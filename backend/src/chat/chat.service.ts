import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { RagService, SearchResult } from '../rag/rag.service';

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
  private readonly MAX_CONTEXT_MESSAGES = 6; // Last 3 Q&A pairs

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
      take: this.MAX_CONTEXT_MESSAGES / 2, // Get last N Q&A pairs
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
    const historyText = conversationHistory
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
      )
      .join('\n');

    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a question rewriter. Given a conversation history and a follow-up question, rewrite the question to be standalone and self-contained.

Rules:
- If the question is already standalone, return it unchanged
- Keep the rewritten question concise
- Only output the rewritten question, nothing else`,
        prompt: `Conversation history:
${historyText}

Follow-up question: ${question}

Rewritten standalone question:`,
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
    const context = sources.map((s) => s.text).join('\n\n---\n\n');

    // Build conversation context string
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = `
Previous conversation:
${conversationHistory.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}

---

`;
    }

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are a helpful assistant that answers questions based on the provided document context.
Only answer based on the information in the context. If the context doesn't contain enough information to answer the question, say so.
Be concise and accurate.
If there's previous conversation history, use it to understand follow-up questions and maintain consistency in your answers.`,
      prompt: `${conversationContext}Context from documents:
${context}

Current question: ${question}

Answer:`,
    });

    return text;
  }

  private async generateConversationTitle(
    question: string,
    answer: string,
  ): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system:
          'Generate a short, concise title (max 50 characters) for this conversation based on the question and answer. Only output the title, nothing else.',
        prompt: `Question: ${question}\nAnswer: ${answer}\n\nTitle:`,
      });

      return text.trim().slice(0, 50) || 'New conversation';
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
