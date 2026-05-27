import { Injectable } from '@nestjs/common';
import { LlmService } from '../../shared/llm-client/llm.service';
import { LLM_MODELS } from '../../shared/constants/ai-models.constants';
import type { EvidenceChunk } from '../evidence/evidence.types';

@Injectable()
export class GeneralKnowledgeRetrievalService {
  constructor(private llmService: LlmService) {}

  async search(query: string, limit: number): Promise<EvidenceChunk[]> {
    const raw = await this.llmService.generateText({
      model: LLM_MODELS.GROQ.DEFAULT,
      prompt: `Provide up to ${Math.max(1, Math.min(limit, 3))} concise factual claims relevant to this query. Return plain lines only. Query: ${query}`,
    });

    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, limit)
      .map((line) => ({
        sourceType: 'general_knowledge' as const,
        content: line,
        score: 0.45,
        metadata: { strategy: 'general_knowledge' },
      }));
  }
}
