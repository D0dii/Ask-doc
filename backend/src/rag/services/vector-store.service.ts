import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ollama } from 'ai-sdk-ollama';
import { embedMany, embed } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { EMBEDDING_MODELS, RAG_CONFIG } from '../../shared/constants';

export interface SearchResult {
  fileId: string;
  text: string;
  score: number;
}

export interface VectorPayload {
  text: string;
  fileId: string;
  workspaceId: string;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private qdrant: QdrantClient;

  constructor(private configService: ConfigService) {
    this.qdrant = new QdrantClient({
      url: this.configService.get<string>(
        'QDRANT_URL',
        'http://localhost:6333',
      ),
    });
  }

  async onModuleInit() {
    try {
      const result = await this.qdrant.getCollections();
      const exists = result.collections.some(
        (c) => c.name === RAG_CONFIG.COLLECTION_NAME,
      );

      if (!exists) {
        this.logger.log(
          `Creating Qdrant collection: ${RAG_CONFIG.COLLECTION_NAME}`,
        );
        await this.qdrant.createCollection(RAG_CONFIG.COLLECTION_NAME, {
          vectors: {
            size: EMBEDDING_MODELS.OLLAMA.DIMENSIONS,
            distance: RAG_CONFIG.DISTANCE_METRIC,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to Qdrant', error);
    }
  }

  // ==================== INGESTION ====================

  async ingestDocument(
    text: string,
    workspaceId: string,
    fileId: string,
  ): Promise<number> {
    this.logger.log(`Starting ingestion for file: ${fileId}`);

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CONFIG.CHUNK_SIZE,
      chunkOverlap: RAG_CONFIG.CHUNK_OVERLAP,
    });
    const docOutput = await splitter.createDocuments([text]);
    const chunks = docOutput.map((doc) => doc.pageContent);

    this.logger.log(`Generated ${chunks.length} chunks.`);

    // Embed chunks in batches
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += RAG_CONFIG.EMBEDDING_BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + RAG_CONFIG.EMBEDDING_BATCH_SIZE);
      this.logger.log(
        `Embedding batch ${Math.floor(i / RAG_CONFIG.EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / RAG_CONFIG.EMBEDDING_BATCH_SIZE)} (${batchChunks.length} chunks)`,
      );

      const { embeddings } = await embedMany({
        model: ollama.embedding(EMBEDDING_MODELS.OLLAMA.DEFAULT),
        values: batchChunks,
      });

      allEmbeddings.push(...embeddings);
    }

    // Prepare and store points
    const points = chunks.map((chunk, index) => ({
      id: uuidv4(),
      vector: allEmbeddings[index],
      payload: {
        text: chunk,
        fileId,
        workspaceId,
      } satisfies VectorPayload,
    }));

    await this.qdrant.upsert(RAG_CONFIG.COLLECTION_NAME, {
      wait: true,
      points,
    });

    this.logger.log(
      `Successfully ingested ${chunks.length} chunks for file ${fileId}`,
    );
    return chunks.length;
  }

  // ==================== SEARCH ====================

  async search(
    workspaceId: string,
    query: string,
    limit?: number,
  ): Promise<SearchResult[]> {
    const searchLimit = limit ?? RAG_CONFIG.DEFAULT_SEARCH_LIMIT;
    this.logger.log(`Searching workspace ${workspaceId} for: ${query}`);

    // Embed the query
    const { embedding: queryEmbedding } = await embed({
      model: ollama.embedding(EMBEDDING_MODELS.OLLAMA.DEFAULT),
      value: query,
    });

    // Search in Qdrant (filter by workspaceId for security)
    const searchResult = await this.qdrant.search(RAG_CONFIG.COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: searchLimit,
      filter: {
        must: [
          {
            key: 'workspaceId',
            match: { value: workspaceId },
          },
        ],
      },
      with_payload: true,
    });

    const results = searchResult.map((result) => ({
      fileId: result.payload?.fileId as string,
      text: result.payload?.text as string,
      score: result.score,
    }));

    this.logger.log(
      `Found ${results.length} relevant chunks for workspace ${workspaceId}`,
    );

    return results;
  }

  // ==================== DELETE ====================

  async deleteByFileId(fileId: string): Promise<void> {
    try {
      await this.qdrant.delete(RAG_CONFIG.COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: 'fileId',
              match: { value: fileId },
            },
          ],
        },
      });
      this.logger.log(`Deleted vectors for file: ${fileId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for file ${fileId}: ${message}`,
      );
      throw error;
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.qdrant.delete(RAG_CONFIG.COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: 'workspaceId',
              match: { value: workspaceId },
            },
          ],
        },
      });
      this.logger.log(`Deleted all vectors for workspace: ${workspaceId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for workspace ${workspaceId}: ${message}`,
      );
      throw error;
    }
  }
}
