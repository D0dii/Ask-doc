import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../documents/entities/file.entity';
import { SemanticSearchService } from './services/semantic-search.service';
import { QueryOrchestratorService } from './services/query-orchestrator.service';
import { SharedModule } from '../shared/shared.module';
import { RetrievalOrchestratorService } from './services/retrieval-orchestrator.service';
import { SemanticStrategy } from './strategies/semantic.strategy';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { WebStrategy } from './strategies/web.strategy';
import { GeneralKnowledgeStrategy } from './strategies/general-knowledge.strategy';
import { RerankerService } from './services/reranker.service';
import { EvidencePolicyService } from './evidence/evidence-policy.service';
import { WebSearchService } from './web/web-search.service';
import { WebRetrievalService } from './services/web-retrieval.service';
import { GeneralKnowledgeRetrievalService } from './services/general-knowledge-retrieval.service';
import { KeywordSearchService } from './services/keyword-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([File]), SharedModule],
  providers: [
    SemanticSearchService,
    QueryOrchestratorService,
    RetrievalOrchestratorService,
    SemanticStrategy,
    KeywordStrategy,
    WebStrategy,
    GeneralKnowledgeStrategy,
    KeywordSearchService,
    WebRetrievalService,
    GeneralKnowledgeRetrievalService,
    RerankerService,
    EvidencePolicyService,
    WebSearchService,
  ],
  exports: [
    SemanticSearchService,
    QueryOrchestratorService,
    RetrievalOrchestratorService,
    EvidencePolicyService,
    TypeOrmModule,
  ],
})
export class RetrievalModule {}
