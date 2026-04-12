import { Module, forwardRef } from '@nestjs/common';
import { LLM_CLIENT } from './llm-client/llm-client.port';
import { AiSdkLlmClientService } from './llm-client/ai-sdk-llm-client.service';
import { VECTOR_STORE } from './vector-store/vector-store.port';
import { QdrantVectorStoreService } from './vector-store/qdrant-vector-store.service';
import { VectorService } from './vector-store/vector.service';
import { LlmService } from './llm-client/llm.service';
import { EvidencePolicyService } from './evidence/evidence-policy.service';
import { EvidencePipelineService } from './evidence/evidence-pipeline.service';
import { WebSearchService } from './evidence/web-search.service';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [forwardRef(() => RetrievalModule)],
  providers: [
    QdrantVectorStoreService,
    AiSdkLlmClientService,
    {
      provide: VECTOR_STORE,
      useExisting: QdrantVectorStoreService,
    },
    {
      provide: LLM_CLIENT,
      useExisting: AiSdkLlmClientService,
    },
    VectorService,
    LlmService,
    EvidencePolicyService,
    EvidencePipelineService,
    WebSearchService,
  ],
  exports: [
    QdrantVectorStoreService,
    AiSdkLlmClientService,
    VECTOR_STORE,
    LLM_CLIENT,
    VectorService,
    LlmService,
    EvidencePolicyService,
    EvidencePipelineService,
    WebSearchService,
  ],
})
export class SharedModule {}
