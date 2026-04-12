import { Module, forwardRef } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature([File]), forwardRef(() => SharedModule)],
  providers: [
    RetrievalService,
    RetrievalOrchestratorService,
    SemanticStrategy,
    KeywordStrategy,
    WebStrategy,
    GeneralKnowledgeStrategy,
    RerankerService,
  ],
  exports: [RetrievalService, RetrievalOrchestratorService, TypeOrmModule],
})
export class RetrievalModule {}
