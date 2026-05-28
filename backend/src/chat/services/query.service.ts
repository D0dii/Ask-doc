import { Injectable, Logger } from '@nestjs/common';
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
import { ChatThreadService } from './chat-thread.service';
import { SemanticSearchService } from '../../retrieval/services/semantic-search.service';

export interface QueryResult {
  answer: string;
  sources: VectorSearchResult[];
  threadId: string;
  messageId: string;
}

interface ThreadMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private chatThreadService: ChatThreadService,
    private llmService: LlmService,
    private semanticSearchService: SemanticSearchService,
  ) {}

  async query(
    knowledgeHubId: string,
    userId: string,
    question: string,
  ): Promise<QueryResult> {
    this.logger.log(`Processing query for knowledge hub ${knowledgeHubId}`);

    const thread = await this.chatThreadService.getOrCreateThread(
      knowledgeHubId,
      userId,
    );

    const threadHistory = await this.getRecentThreadHistory(thread.id);

    const standaloneQuestion = await this.rewriteQuestionIfNeeded(
      question,
      threadHistory,
    );

    this.logger.log(
      `Original: "${question}" | Standalone: "${standaloneQuestion}"`,
    );

    const sources = await this.semanticSearchService.retrieve(
      knowledgeHubId,
      standaloneQuestion,
    );

    const answer =
      sources.length === 0
        ? 'I could not find any relevant information in the documents to answer your question.'
        : await this.generateAnswer(
            question,
            formatSourcesContext(sources),
            threadHistory,
          );

    this.logger.log(`Generated answer for knowledge hub ${knowledgeHubId}`);

    const message = await this.chatThreadService.createMessage({
      question,
      answer,
      sources,
      threadId: thread.id,
      userId,
    });

    if (!thread.title && threadHistory.length === 0) {
      const title = await this.generateThreadTitle(question, answer);
      await this.chatThreadService.updateThreadTitleByKnowledgeHub(
        knowledgeHubId,
        title,
      );
    }

    await this.chatThreadService.touchThreadByKnowledgeHub(knowledgeHubId);

    return {
      answer,
      sources,
      threadId: thread.id,
      messageId: message.id,
    };
  }

  private async getRecentThreadHistory(
    threadId: string,
  ): Promise<ThreadMessage[]> {
    const recentMessages =
      await this.chatThreadService.getRecentMessagesByThread(
        threadId,
        CHAT_CONFIG.MAX_CONTEXT_MESSAGES / 2,
      );

    const history: ThreadMessage[] = [];
    for (const msg of recentMessages.reverse()) {
      history.push({ role: 'user', content: msg.question });
      history.push({ role: 'assistant', content: msg.answer });
    }

    return history;
  }

  private async rewriteQuestionIfNeeded(
    question: string,
    threadHistory: ThreadMessage[],
  ): Promise<string> {
    if (threadHistory.length === 0) {
      return question;
    }

    const historyText = formatConversationHistory(threadHistory);

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
    context: string,
    threadHistory: ThreadMessage[],
  ): Promise<string> {
    const conversationContext =
      threadHistory.length > 0
        ? formatConversationHistory(threadHistory)
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

  private async generateThreadTitle(
    question: string,
    answer: string,
  ): Promise<string> {
    try {
      const text = await this.llmService.generateText({
        model: LLM_MODELS.GROQ.DEFAULT,
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        prompt: TITLE_GENERATOR_PROMPT_TEMPLATE(question, answer),
      });

      return text.trim().slice(0, CHAT_CONFIG.MAX_TITLE_LENGTH) || 'New chat';
    } catch {
      return 'New chat';
    }
  }
}
