import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../documents/entities/file.entity';
import { RetrievalService } from './services/retrieval.service';
import { SharedModule } from '../shared/shared.module';
import { RetrievalOrchestratorService } from './services/retrieval-orchestrator.service';
import { SemanticStrategy } from './strategies/semantic.strategy';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { WebStrategy } from './strategies/web.strategy';
import { GeneralKnowledgeStrategy } from './strategies/general-knowledge.strategy';
import { RerankerService } from './fusion/reranker.service';
import { EvidencePipelineService } from './evidence/evidence-pipeline.service';
import { EvidencePolicyService } from './evidence/evidence-policy.service';
import { WebSearchService } from './web/web-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([File]), SharedModule],
  providers: [
    RetrievalService,
    RetrievalOrchestratorService,
    SemanticStrategy,
    KeywordStrategy,
    WebStrategy,
    GeneralKnowledgeStrategy,
    RerankerService,
    EvidencePipelineService,
    EvidencePolicyService,
    WebSearchService,
  ],
  exports: [
    RetrievalService,
    RetrievalOrchestratorService,
    EvidencePipelineService,
    EvidencePolicyService,
    TypeOrmModule,
  ],
})
export class RetrievalModule {}
