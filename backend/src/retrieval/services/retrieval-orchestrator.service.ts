import { Injectable } from '@nestjs/common';
import type { EvidenceChunk } from '../evidence/evidence.types';
import { SemanticStrategy } from '../strategies/semantic.strategy';
import { KeywordStrategy } from '../strategies/keyword.strategy';
import { WebStrategy } from '../strategies/web.strategy';
import { GeneralKnowledgeStrategy } from '../strategies/general-knowledge.strategy';
import { RerankerService } from '../fusion/reranker.service';
import {
  GENERATION_POLICY,
  RAG_CONFIG,
} from '../../shared/constants/ai-models.constants';

@Injectable()
export class RetrievalOrchestratorService {
  constructor(
    private semanticStrategy: SemanticStrategy,
    private keywordStrategy: KeywordStrategy,
    private webStrategy: WebStrategy,
    private generalKnowledgeStrategy: GeneralKnowledgeStrategy,
    private rerankerService: RerankerService,
  ) {}

  async retrieveEvidence(params: {
    knowledgeHubId: string;
    query: string;
    limit?: number;
  }): Promise<EvidenceChunk[]> {
    const limit = params.limit ?? RAG_CONFIG.DEFAULT_SEARCH_LIMIT;

    const [semantic, keyword, web, generalKnowledge] = await Promise.all([
      this.semanticStrategy.search({
        knowledgeHubId: params.knowledgeHubId,
        query: params.query,
        limit,
      }),
      this.keywordStrategy.search({
        knowledgeHubId: params.knowledgeHubId,
        query: params.query,
        limit,
      }),
      this.webStrategy.search({
        knowledgeHubId: params.knowledgeHubId,
        query: params.query,
        limit,
      }),
      this.generalKnowledgeStrategy.search({
        knowledgeHubId: params.knowledgeHubId,
        query: params.query,
        limit,
      }),
    ]);

    return this.rerankerService.fuse({
      semantic,
      keyword,
      web,
      generalKnowledge,
      limit,
      maxGeneralKnowledgeRatio:
        GENERATION_POLICY.GENERAL_KNOWLEDGE_EVIDENCE_RATIO_MAX,
    });
  }
}
