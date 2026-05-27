import { Injectable } from '@nestjs/common';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';
import { GeneralKnowledgeRetrievalService } from '../services/general-knowledge-retrieval.service';

@Injectable()
export class GeneralKnowledgeStrategy implements RetrievalStrategy {
  constructor(
    private generalKnowledgeRetrievalService: GeneralKnowledgeRetrievalService,
  ) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    return this.generalKnowledgeRetrievalService.search(
      params.query,
      params.limit,
    );
  }
}
