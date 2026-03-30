import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RetrievalService } from '../../retrieval/services/retrieval.service';
import {
  LLM_MODELS,
  CHAT_CONFIG,
} from '../../shared/constants/ai-models.constants';
import { LlmService } from '../../shared/llm-client/llm.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';
import {
  QUESTION_REWRITER_SYSTEM_PROMPT,
  QUESTION_REWRITER_PROMPT_TEMPLATE,
  ANSWER_GENERATOR_SYSTEM_PROMPT,
  ANSWER_GENERATOR_PROMPT_TEMPLATE,
  TITLE_GENERATOR_SYSTEM_PROMPT,
  TITLE_GENERATOR_PROMPT_TEMPLATE,
  formatConversationHistory,
  formatSourcesContext,
} from '../constants/prompts.constants';
import { ConversationsService } from './conversations.service';

export interface QueryResult {
  answer: string;
  sources: VectorSearchResult[];
  conversationId: string;
  messageId: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private conversationsService: ConversationsService,
    private retrievalService: RetrievalService,
    private llmService: LlmService,
  ) {}

  // ==================== MAIN QUERY FLOW ====================

  async query(
    workspaceId: string,
    userId: string,
    question: string,
    conversationId?: string,
  ): Promise<QueryResult> {
    this.logger.log(`Processing query for workspace ${workspaceId}`);

    // 1. Get or create conversation
    const conversation = await this.getOrCreateConversation(
      workspaceId,
      userId,
      conversationId,
    );

    // 2. Get recent conversation history for context
    const conversationHistory = await this.getRecentConversationHistory(
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
    const sources = await this.retrievalService.retrieve(
      workspaceId,
      standaloneQuestion,
    );

    // 5. Generate answer using LLM with conversation context
    const answer =
      sources.length === 0
        ? 'I could not find any relevant information in the documents to answer your question.'
        : await this.generateAnswer(question, sources, conversationHistory);

    this.logger.log(`Generated answer for workspace ${workspaceId}`);

    // 6. Store the Q&A in chat history
    const message = await this.conversationsService.createMessage({
      question,
      answer,
      sources,
      conversationId: conversation.id,
      userId,
    });

    // 7. Update conversation title if it's the first message and no title
    if (!conversation.title && conversationHistory.length === 0) {
      const title = await this.generateConversationTitle(question, answer);
      await this.conversationsService.updateConversationTitle(
        conversation.id,
        workspaceId,
        title,
      );
    }

    // 8. Touch the conversation to update updatedAt
    await this.conversationsService.touchConversation(conversation.id);

    return {
      answer,
      sources,
      conversationId: conversation.id,
      messageId: message.id,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async getOrCreateConversation(
    workspaceId: string,
    userId: string,
    conversationId?: string,
  ) {
    if (conversationId) {
      const existing = await this.conversationsService.getConversationById(
        conversationId,
        workspaceId,
      );
      if (!existing) {
        throw new NotFoundException('Conversation not found');
      }
      return existing;
    }

    return this.conversationsService.createConversation(workspaceId, userId);
  }

  private async getRecentConversationHistory(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    const recentMessages = await this.conversationsService.getRecentMessages(
      conversationId,
      CHAT_CONFIG.MAX_CONTEXT_MESSAGES / 2, // Get last N Q&A pairs
    );

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
      const text = await this.llmService.generateText({
        model: LLM_MODELS.GROQ.DEFAULT,
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
    sources: VectorSearchResult[],
    conversationHistory: ConversationMessage[],
  ): Promise<string> {
    const context = formatSourcesContext(sources);

    // Build conversation context string
    const conversationContext =
      conversationHistory.length > 0
        ? formatConversationHistory(conversationHistory)
        : undefined;

    return this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      system: ANSWER_GENERATOR_SYSTEM_PROMPT,
      prompt: ANSWER_GENERATOR_PROMPT_TEMPLATE({
        conversationHistory: conversationContext,
        context,
        question,
      }),
    });
  }

  private async generateConversationTitle(
    question: string,
    answer: string,
  ): Promise<string> {
    try {
      const text = await this.llmService.generateText({
        model: LLM_MODELS.GROQ.DEFAULT,
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
}
