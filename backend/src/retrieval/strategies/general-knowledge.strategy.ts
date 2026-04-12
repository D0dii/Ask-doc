import { Injectable } from '@nestjs/common';
import { LlmService } from '../../shared/llm-client/llm.service';
import { LLM_MODELS } from '../../shared/constants/ai-models.constants';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';

@Injectable()
export class GeneralKnowledgeStrategy implements RetrievalStrategy {
  constructor(private llmService: LlmService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    const raw = await this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      prompt: `Provide up to ${Math.max(1, Math.min(params.limit, 3))} concise factual claims relevant to this query. Return plain lines only. Query: ${params.query}`,
    });

    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, params.limit)
      .map((line) => ({
        sourceType: 'general_knowledge' as const,
        content: line,
        score: 0.45,
        metadata: { strategy: 'general_knowledge' },
      }));
  }
}
