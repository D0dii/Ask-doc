import { Injectable } from '@nestjs/common';
import { RetrievalService } from '../services/retrieval.service';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../../shared/evidence/evidence.types';

@Injectable()
export class SemanticStrategy implements RetrievalStrategy {
  constructor(private retrievalService: RetrievalService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    const evidence = await this.retrievalService.retrieveEvidence(
      params.knowledgeHubId,
      params.query,
      params.limit,
    );
    return evidence.evidenceChunks;
  }
}
