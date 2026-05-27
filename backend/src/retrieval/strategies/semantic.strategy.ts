import { Injectable } from '@nestjs/common';
import { SemanticSearchService } from '../services/semantic-search.service';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';

@Injectable()
export class SemanticStrategy implements RetrievalStrategy {
  constructor(private semanticSearchService: SemanticSearchService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    const evidence = await this.semanticSearchService.retrieveEvidence(
      params.knowledgeHubId,
      params.query,
      params.limit,
    );
    return evidence.evidenceChunks;
  }
}
