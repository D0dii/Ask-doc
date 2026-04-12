import { Injectable } from '@nestjs/common';
import {
  BuildEvidenceContextInput,
  BuildEvidenceContextResult,
  EvidenceChunk,
} from './evidence.types';
import { RetrievalService } from '../services/retrieval.service';
import { RetrievalOrchestratorService } from '../services/retrieval-orchestrator.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';

@Injectable()
export class EvidencePipelineService {
  constructor(
    private retrievalService: RetrievalService,
    private retrievalOrchestratorService: RetrievalOrchestratorService,
  ) {}

  async buildContext({
    knowledgeHubId,
    query,
    limit,
    includeWebSources = false,
  }: BuildEvidenceContextInput): Promise<BuildEvidenceContextResult> {
    const retrievedEvidence = await this.retrievalService.retrieveEvidence(
      knowledgeHubId,
      query,
      limit,
    );

    const chunks = includeWebSources
      ? await this.retrievalOrchestratorService.retrieveEvidence({
          knowledgeHubId,
          query,
          limit,
        })
      : retrievedEvidence.evidenceChunks;

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
