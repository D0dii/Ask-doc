import { Injectable } from '@nestjs/common';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';
import { KeywordSearchService } from '../services/keyword-search.service';

@Injectable()
export class KeywordStrategy implements RetrievalStrategy {
  constructor(private keywordSearchService: KeywordSearchService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    return this.keywordSearchService.search(params);
  }
}
