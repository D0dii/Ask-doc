import { Injectable } from '@nestjs/common';
import type { EvidenceChunk } from '../evidence/evidence.types';

@Injectable()
export class WebSearchService {
  async search(_query: string): Promise<EvidenceChunk[]> {
    return [];
  }
}
