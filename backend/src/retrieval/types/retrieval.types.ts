import type { EvidenceChunk } from '../../shared/evidence/evidence.types';

export interface RetrievalStrategy {
  search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]>;
}

export interface StrategyResults {
  semantic: EvidenceChunk[];
  keyword: EvidenceChunk[];
  web: EvidenceChunk[];
  generalKnowledge: EvidenceChunk[];
}
