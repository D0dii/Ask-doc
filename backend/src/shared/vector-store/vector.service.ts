import { Injectable, Inject, Logger } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { EMBEDDING_MODELS, RAG_CONFIG } from '../constants/ai-models.constants';
import { LLM_CLIENT } from '../llm-client/llm-client.port';
import {
  VECTOR_STORE,
  type VectorPoint,
  type VectorSearchResult,
  type VectorStorePort,
} from './vector-store.port';
import type { LlmClientPort } from '../llm-client/llm-client.port';

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);

  constructor(
    @Inject(VECTOR_STORE) private vectorStore: VectorStorePort,
    @Inject(LLM_CLIENT) private llmClient: LlmClientPort,
  ) {}

  async ingestDocument(
    text: string,
    knowledgeHubId: string,
    fileId: string,
  ): Promise<number> {
    this.logger.log(`Starting ingestion for file: ${fileId}`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CONFIG.CHUNK_SIZE,
      chunkOverlap: RAG_CONFIG.CHUNK_OVERLAP,
    });
    const docOutput = await splitter.createDocuments([text]);
    const chunks = docOutput.map((doc) => doc.pageContent);

    this.logger.log(`Generated ${chunks.length} chunks.`);

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += RAG_CONFIG.EMBEDDING_BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + RAG_CONFIG.EMBEDDING_BATCH_SIZE);
      this.logger.log(
        `Embedding batch ${Math.floor(i / RAG_CONFIG.EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / RAG_CONFIG.EMBEDDING_BATCH_SIZE)} (${batchChunks.length} chunks)`,
      );

      const embeddings = await this.llmClient.embedMany({
        model: EMBEDDING_MODELS.OLLAMA.DEFAULT,
        values: batchChunks,
      });

      allEmbeddings.push(...embeddings);
    }

    const points: VectorPoint[] = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: allEmbeddings[index],
      payload: {
        text: chunk,
        fileId,
        knowledgeHubId,
      },
    }));

    await this.vectorStore.upsertPoints(points);

    this.logger.log(
      `Successfully ingested ${chunks.length} chunks for file ${fileId}`,
    );
    return chunks.length;
  }

  async search(
    knowledgeHubId: string,
    query: string,
    limit?: number,
  ): Promise<VectorSearchResult[]> {
    const searchLimit = limit ?? RAG_CONFIG.DEFAULT_SEARCH_LIMIT;
    this.logger.log(`Searching knowledge hub ${knowledgeHubId} for: ${query}`);

    const queryEmbedding = await this.llmClient.embed({
      model: EMBEDDING_MODELS.OLLAMA.DEFAULT,
      value: query,
    });

    const results = await this.vectorStore.searchByVector({
      knowledgeHubId,
      vector: queryEmbedding,
      limit: searchLimit,
    });

    this.logger.log(
      `Found ${results.length} relevant chunks for knowledge hub ${knowledgeHubId}`,
    );

    return results;
  }

  async deleteByFileId(fileId: string): Promise<void> {
    try {
      await this.vectorStore.deleteByFileId(fileId);
      this.logger.log(`Deleted vectors for file: ${fileId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for file ${fileId}: ${message}`,
      );
      throw error;
    }
  }

  async deleteByKnowledgeHubId(knowledgeHubId: string): Promise<void> {
    try {
      await this.vectorStore.deleteByKnowledgeHubId(knowledgeHubId);
      this.logger.log(
        `Deleted all vectors for knowledge hub: ${knowledgeHubId}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for knowledge hub ${knowledgeHubId}: ${message}`,
      );
      throw error;
    }
  }
}
