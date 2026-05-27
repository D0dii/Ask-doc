import { Injectable } from '@nestjs/common';
import type { EvidenceChunk } from '../evidence/evidence.types';
import { WebSearchService } from '../web/web-search.service';

@Injectable()
export class WebRetrievalService {
  constructor(private webSearchService: WebSearchService) {}

  async search(query: string, limit: number): Promise<EvidenceChunk[]> {
    const results = await this.webSearchService.search(query);
    return results.slice(0, limit);
  }
}
