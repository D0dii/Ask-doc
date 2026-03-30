import { Module } from '@nestjs/common';
import { LLM_CLIENT } from './llm-client/llm-client.port';
import { AiSdkLlmClientService } from './llm-client/ai-sdk-llm-client.service';
import { VECTOR_STORE } from './vector-store/vector-store.port';
import { QdrantVectorStoreService } from './vector-store/qdrant-vector-store.service';
import { VectorService } from './vector-store/vector.service';
import { LlmService } from './llm-client/llm.service';

@Module({
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
  ],
  exports: [
    QdrantVectorStoreService,
    AiSdkLlmClientService,
    VECTOR_STORE,
    LLM_CLIENT,
    VectorService,
    LlmService,
  ],
})
export class SharedModule {}
