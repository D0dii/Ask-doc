import { Injectable } from '@nestjs/common';
import type {
  BuildEvidenceContextInput,
  BuildEvidenceContextResult,
  EvidenceChunk,
} from '../evidence/evidence.types';
import { RetrievalOrchestratorService } from './retrieval-orchestrator.service';
import { SemanticSearchService } from './semantic-search.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';

@Injectable()
export class QueryOrchestratorService {
  constructor(
    private retrievalOrchestratorService: RetrievalOrchestratorService,
    private semanticSearchService: SemanticSearchService,
  ) {}

  async buildContext({
    knowledgeHubId,
    query,
    limit,
    includeWebSources = false,
  }: BuildEvidenceContextInput): Promise<BuildEvidenceContextResult> {
    const chunks = includeWebSources
      ? await this.retrievalOrchestratorService.retrieveEvidence({
          knowledgeHubId,
          query,
          limit,
        })
      : (
          await this.semanticSearchService.retrieveEvidence(
            knowledgeHubId,
            query,
            limit,
          )
        ).evidenceChunks;

    const sources: VectorSearchResult[] = chunks
      .filter((chunk) => chunk.sourceType === 'retrieved_doc')
      .map((chunk) => ({
        fileId: chunk.sourceRef ?? 'unknown',
        text: chunk.content,
        score: chunk.score ?? 0,
      }));

    const web = chunks.filter((chunk) => chunk.sourceType === 'web_source');
    const retrieved = chunks.filter(
      (chunk) => chunk.sourceType === 'retrieved_doc',
    );

    return {
      chunks,
      context: this.formatContext(chunks),
      sources,
      retrieved,
      web,
    };
  }

  private formatContext(chunks: EvidenceChunk[]): string {
    return chunks.map((chunk) => chunk.content).join('\n\n---\n\n');
  }
}
