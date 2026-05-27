import { Injectable } from '@nestjs/common';
import type { EvidenceChunk } from '../evidence/evidence.types';
import type { StrategyResults } from '../types/retrieval.types';

interface FuseInput extends StrategyResults {
  limit: number;
  maxGeneralKnowledgeRatio: number;
}

@Injectable()
export class RerankerService {
  fuse({
    semantic,
    keyword,
    web,
    generalKnowledge,
    limit,
    maxGeneralKnowledgeRatio,
  }: FuseInput): EvidenceChunk[] {
    const combined = [...semantic, ...keyword, ...web, ...generalKnowledge]
      .map((chunk) => ({ ...chunk, score: this.scoreChunk(chunk) }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const seen = new Set<string>();
    const result: EvidenceChunk[] = [];
    const maxGeneralKnowledge = Math.floor(limit * maxGeneralKnowledgeRatio);
    let generalKnowledgeCount = 0;

    for (const chunk of combined) {
      if (result.length >= limit) {
        break;
      }

      const key = `${chunk.sourceType}:${chunk.sourceRef ?? ''}:${chunk.content.slice(0, 120)}`;
      if (seen.has(key)) {
        continue;
      }

      if (chunk.sourceType === 'general_knowledge') {
        if (generalKnowledgeCount >= maxGeneralKnowledge) {
          continue;
        }
        generalKnowledgeCount += 1;
      }

      seen.add(key);
      result.push(chunk);
    }

    return result;
  }

  private scoreChunk(chunk: EvidenceChunk): number {
    const base = chunk.score ?? 0.5;
    const sourceBonus =
      chunk.sourceType === 'retrieved_doc'
        ? 0.3
        : chunk.sourceType === 'web_source'
          ? 0.2
          : chunk.sourceType === 'chat_answer'
            ? 0.1
            : 0;
    return base + sourceBonus;
  }
}
