import { Injectable } from '@nestjs/common';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';
import { WebRetrievalService } from '../services/web-retrieval.service';

@Injectable()
export class WebStrategy implements RetrievalStrategy {
  constructor(private webRetrievalService: WebRetrievalService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    return this.webRetrievalService.search(params.query, params.limit);
  }
}
