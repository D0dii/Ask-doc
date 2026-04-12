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
} from '../constants/prompts.constants';
import { ConversationsService } from './conversations.service';
import { EvidencePipelineService } from '../../retrieval/evidence/evidence-pipeline.service';
import {
  EvidencePolicyService,
  EvidencePolicyViolationError,
} from '../../retrieval/evidence/evidence-policy.service';

export interface QueryResult {
  answer: string;
  sources: VectorSearchResult[];
  conversationId: string;
  messageId: string;
}

interface ParsedGeneralKnowledgeAnswer {
  answer: string;
  generalKnowledge: string;
  generalKnowledgeConfidence: number;
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
    private llmService: LlmService,
    private evidencePipelineService: EvidencePipelineService,
    private evidencePolicyService: EvidencePolicyService,
  ) {}

  // ==================== MAIN QUERY FLOW ====================

  async query(
    knowledgeHubId: string,
    userId: string,
    question: string,
  ): Promise<QueryResult> {
    this.logger.log(`Processing query for knowledge hub ${knowledgeHubId}`);

    // 1. Get or create the single thread for this knowledge hub
    const thread = await this.conversationsService.getOrCreateThread(
      knowledgeHubId,
      userId,
    );

    // 2. Get recent thread history for context
    const conversationHistory = await this.getRecentConversationHistory(
      thread.id,
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
    const evidenceContext = await this.evidencePipelineService.buildContext({
      knowledgeHubId,
      query: standaloneQuestion,
      limit: undefined,
      includeWebSources: true,
    });
    const sources = evidenceContext.sources;

    // 5. Generate answer using LLM with conversation context
    const answer =
      sources.length === 0
        ? 'I could not find any relevant information in the documents to answer your question.'
        : await this.generateAnswer(
            question,
            evidenceContext.context,
            conversationHistory,
          );

    this.logger.log(`Generated answer for knowledge hub ${knowledgeHubId}`);

    // 6. Store the Q&A in chat history
    const message = await this.conversationsService.createMessage({
      question,
      answer,
      sources,
      threadId: thread.id,
      userId,
    });

    // 7. Update thread title if it's the first message and no title
    if (!thread.title && conversationHistory.length === 0) {
      const title = await this.generateConversationTitle(question, answer);
      await this.conversationsService.updateThreadTitleByKnowledgeHub(
        knowledgeHubId,
        title,
      );
    }

    // 8. Touch the thread to update updatedAt
    await this.conversationsService.touchThreadByKnowledgeHub(knowledgeHubId);

    return {
      answer,
      sources,
      conversationId: thread.id,
      messageId: message.id,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async getRecentConversationHistory(
    threadId: string,
  ): Promise<ConversationMessage[]> {
    const recentMessages =
      await this.conversationsService.getRecentMessagesByThread(
        threadId,
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
    evidenceContext: string,
    conversationHistory: ConversationMessage[],
  ): Promise<string> {
    // Build conversation context string
    const conversationContext =
      conversationHistory.length > 0
        ? formatConversationHistory(conversationHistory)
        : undefined;

    const basePrompt = ANSWER_GENERATOR_PROMPT_TEMPLATE({
      conversationHistory: conversationContext,
      context: evidenceContext,
      question,
    });

    const firstPass = await this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      system: ANSWER_GENERATOR_SYSTEM_PROMPT,
      prompt: `${basePrompt}\n\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: <text or none>\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: <number between 0 and 1>`,
    });

    try {
      const parsedFirstPass = this.parseGeneralKnowledgeTaggedAnswer(firstPass);
      this.evidencePolicyService.enforceGeneralKnowledgeBudget({
        generatedText: parsedFirstPass.answer,
        generalKnowledgeText: parsedFirstPass.generalKnowledge,
        generalKnowledgeConfidence: parsedFirstPass.generalKnowledgeConfidence,
      });
      return parsedFirstPass.answer;
    } catch (error) {
      if (
        error instanceof EvidencePolicyViolationError &&
        error.shouldRegenerate
      ) {
        const secondPass = await this.llmService.generateText({
          model: LLM_MODELS.GROQ.DEFAULT,
          system: ANSWER_GENERATOR_SYSTEM_PROMPT,
          prompt: `${basePrompt}\n\nStrict rule: use only provided evidence context. If information is missing, say so.\nAt the end of your response, add one final line in this exact format:\nGENERAL_KNOWLEDGE: none\nAnd one more final line in this exact format:\nGENERAL_KNOWLEDGE_CONFIDENCE: 1.0`,
        });

        const parsedSecondPass =
          this.parseGeneralKnowledgeTaggedAnswer(secondPass);
        this.evidencePolicyService.enforceGeneralKnowledgeBudget({
          generatedText: parsedSecondPass.answer,
          generalKnowledgeText: parsedSecondPass.generalKnowledge,
          generalKnowledgeConfidence:
            parsedSecondPass.generalKnowledgeConfidence,
        });

        return parsedSecondPass.answer;
      }

      throw error;
    }
  }

  private parseGeneralKnowledgeTaggedAnswer(
    response: string,
  ): ParsedGeneralKnowledgeAnswer {
    const lines = response
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new EvidencePolicyViolationError(
        'Missing general knowledge metadata tags in model response',
      );
    }

    const confidenceLine = lines[lines.length - 1];
    const knowledgeLine = lines[lines.length - 2];
    const knowledgePrefix = 'GENERAL_KNOWLEDGE:';
    const confidencePrefix = 'GENERAL_KNOWLEDGE_CONFIDENCE:';

    if (!knowledgeLine.startsWith(knowledgePrefix)) {
      throw new EvidencePolicyViolationError(
        'Missing GENERAL_KNOWLEDGE tag in model response',
      );
    }

    if (!confidenceLine.startsWith(confidencePrefix)) {
      throw new EvidencePolicyViolationError(
        'Missing GENERAL_KNOWLEDGE_CONFIDENCE tag in model response',
      );
    }

    const generalKnowledgeRaw = knowledgeLine
      .slice(knowledgePrefix.length)
      .trim();
    const confidenceRaw = confidenceLine.slice(confidencePrefix.length).trim();
    const confidence = Number.parseFloat(confidenceRaw);

    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new EvidencePolicyViolationError(
        'Invalid GENERAL_KNOWLEDGE_CONFIDENCE value',
      );
    }

    const answer = lines.slice(0, -2).join('\n').trim();

    return {
      answer,
      generalKnowledge:
        generalKnowledgeRaw.toLowerCase() === 'none' ? '' : generalKnowledgeRaw,
      generalKnowledgeConfidence: confidence,
    };
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
