import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { RagService, SearchResult } from '../rag/rag.service';
import { LLM_MODELS, CHAT_CONFIG } from '../shared/constants';
import {
  QUESTION_REWRITER_SYSTEM_PROMPT,
  QUESTION_REWRITER_PROMPT_TEMPLATE,
  ANSWER_GENERATOR_SYSTEM_PROMPT,
  ANSWER_GENERATOR_PROMPT_TEMPLATE,
  TITLE_GENERATOR_SYSTEM_PROMPT,
  TITLE_GENERATOR_PROMPT_TEMPLATE,
  formatConversationHistory,
  formatSourcesContext,
} from './constants';

export interface QueryResult {
  answer: string;
  sources: SearchResult[];
  conversationId: string;
  messageId: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatConversation)
    private conversationRepository: Repository<ChatConversation>,
    private ragService: RagService,
  ) {}

  // ==================== CONVERSATION MANAGEMENT ====================

  async createConversation(
    workspaceId: string,
    userId: string,
    title?: string,
  ): Promise<ChatConversation> {
    const conversation = this.conversationRepository.create({
      workspaceId,
      userId,
      title: title || null,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversationsByWorkspace(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ conversations: ChatConversation[]; total: number }> {
    const [conversations, total] =
      await this.conversationRepository.findAndCount({
        where: { workspaceId },
        order: { updatedAt: 'DESC' },
        take: limit,
        skip: offset,
      });

    return { conversations, total };
  }

  async getConversationById(
    conversationId: string,
    workspaceId: string,
  ): Promise<ChatConversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, workspaceId },
    });
  }

  async getConversationWithMessages(
    conversationId: string,
    workspaceId: string,
  ): Promise<ChatConversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, workspaceId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async updateConversationTitle(
    conversationId: string,
    workspaceId: string,
    title: string,
  ): Promise<ChatConversation | null> {
    const conversation = await this.getConversationById(
      conversationId,
      workspaceId,
    );

    if (!conversation) {
      return null;
    }

    conversation.title = title;
    return this.conversationRepository.save(conversation);
  }

  async deleteConversation(
    conversationId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const result = await this.conversationRepository.delete({
      id: conversationId,
      workspaceId,
    });

    return (result.affected ?? 0) > 0;
  }

  async clearWorkspaceConversations(workspaceId: string): Promise<number> {
    const result = await this.conversationRepository.delete({ workspaceId });
    return result.affected ?? 0;
  }

  // ==================== QUERY WITH CONTEXT ====================

  async query(
    workspaceId: string,
    userId: string,
    question: string,
    conversationId?: string,
  ): Promise<QueryResult> {
    this.logger.log(`Processing query for workspace ${workspaceId}`);

    // 1. Get or create conversation
    let conversation: ChatConversation;
    if (conversationId) {
      const existing = await this.getConversationById(
        conversationId,
        workspaceId,
      );
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
      conversation = existing;
    } else {
      conversation = await this.createConversation(workspaceId, userId);
    }

    // 2. Get recent conversation history for context
    const conversationHistory = await this.getRecentConversation(
      conversation.id,
    );

    // 3. Rewrite question if it's a follow-up (references previous context)
    const standaloneQuestion = await this.rewriteQuestionIfNeeded(
      question,
      conversationHistory,
    );

    this.logger.log(
      `Original: "${question}" | Standalone: "${standaloneQuestion}"`,
    );

    // 4. Search for relevant document chunks using the standalone question
    const sources = await this.ragService.search(
      workspaceId,
      standaloneQuestion,
    );

    // 5. Generate answer using LLM with conversation context
    let answer: string;

    if (sources.length === 0) {
      answer =
        'I could not find any relevant information in the documents to answer your question.';
    } else {
      answer = await this.generateAnswer(
        question,
        sources,
        conversationHistory,
      );
    }

    this.logger.log(`Generated answer for workspace ${workspaceId}`);

    // 6. Store the Q&A in chat history
    const message = await this.createMessage({
      question,
      answer,
      sources,
      conversationId: conversation.id,
      userId,
    });

    // 7. Update conversation title if it's the first message and no title
    if (!conversation.title && conversationHistory.length === 0) {
      const title = await this.generateConversationTitle(question, answer);
      await this.updateConversationTitle(conversation.id, workspaceId, title);
    }

    // 8. Touch the conversation to update updatedAt
    await this.conversationRepository.update(conversation.id, {
      updatedAt: new Date(),
    });

    return {
      answer,
      sources,
      conversationId: conversation.id,
      messageId: message.id,
    };
  }

  // ==================== CONTEXT HELPERS ====================

  private async getRecentConversation(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    const recentMessages = await this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: CHAT_CONFIG.MAX_CONTEXT_MESSAGES / 2, // Get last N Q&A pairs
    });

    // Convert to conversation format (oldest first)
    const conversation: ConversationMessage[] = [];
    for (const msg of recentMessages.reverse()) {
      conversation.push({ role: 'user', content: msg.question });
      conversation.push({ role: 'assistant', content: msg.answer });
    }

    return conversation;
  }

  private async rewriteQuestionIfNeeded(
    question: string,
    conversationHistory: ConversationMessage[],
  ): Promise<string> {
    // If no history, return original question
    if (conversationHistory.length === 0) {
      return question;
    }

    // Use LLM to rewrite the question
    const historyText = formatConversationHistory(conversationHistory);

    try {
      const { text } = await generateText({
        model: groq(LLM_MODELS.GROQ.DEFAULT),
        system: QUESTION_REWRITER_SYSTEM_PROMPT,
        prompt: QUESTION_REWRITER_PROMPT_TEMPLATE(historyText, question),
      });

      return text.trim() || question;
    } catch (error) {
      this.logger.warn(`Failed to rewrite question: ${error}`);
      return question;
    }
  }

  private async generateAnswer(
    question: string,
    sources: SearchResult[],
    conversationHistory: ConversationMessage[],
  ): Promise<string> {
    const context = formatSourcesContext(sources);

    // Build conversation context string
    const conversationContext =
      conversationHistory.length > 0
        ? formatConversationHistory(conversationHistory)
        : undefined;

    const { text } = await generateText({
      model: groq(LLM_MODELS.GROQ.DEFAULT),
      system: ANSWER_GENERATOR_SYSTEM_PROMPT,
      prompt: ANSWER_GENERATOR_PROMPT_TEMPLATE({
        conversationHistory: conversationContext,
        context,
        question,
      }),
    });

    return text;
  }

  private async generateConversationTitle(
    question: string,
    answer: string,
  ): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq(LLM_MODELS.GROQ.DEFAULT),
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        prompt: TITLE_GENERATOR_PROMPT_TEMPLATE(question, answer),
      });

      return (
        text.trim().slice(0, CHAT_CONFIG.MAX_TITLE_LENGTH) || 'New conversation'
      );
    } catch {
      return 'New conversation';
    }
  }

  // ==================== MESSAGE MANAGEMENT ====================

  private async createMessage(params: {
    question: string;
    answer: string;
    sources: SearchResult[] | null;
    conversationId: string;
    userId: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      question: params.question,
      answer: params.answer,
      sources: params.sources ?? undefined,
      conversationId: params.conversationId,
      userId: params.userId,
    });

    return this.chatMessageRepository.save(message);
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteMessage(
    messageId: string,
    conversationId: string,
  ): Promise<boolean> {
    const result = await this.chatMessageRepository.delete({
      id: messageId,
      conversationId,
    });

    return (result.affected ?? 0) > 0;
  }

  // ==================== WORKSPACE-LEVEL HELPERS ====================

  async getMessageCountByConversation(conversationId: string): Promise<number> {
    return this.chatMessageRepository.count({
      where: { conversationId },
    });
  }
}
