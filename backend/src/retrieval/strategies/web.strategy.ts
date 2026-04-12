import { Injectable } from '@nestjs/common';
import { WebSearchService } from '../web/web-search.service';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../evidence/evidence.types';

@Injectable()
export class WebStrategy implements RetrievalStrategy {
  constructor(private webSearchService: WebSearchService) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    const results = await this.webSearchService.search(params.query);
    return results.slice(0, params.limit);
  }
}
