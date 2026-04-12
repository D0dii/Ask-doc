import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EMBEDDING_MODELS, RAG_CONFIG } from '../constants/ai-models.constants';
import {
  type VectorPoint,
  type VectorSearchResult,
  type VectorStorePort,
} from './vector-store.port';

@Injectable()
export class QdrantVectorStoreService implements VectorStorePort, OnModuleInit {
  private readonly logger = new Logger(QdrantVectorStoreService.name);
  private qdrant: QdrantClient;

  constructor(private configService: ConfigService) {
    this.qdrant = new QdrantClient({
      url: this.configService.get<string>(
        'QDRANT_URL',
        'http://localhost:6333',
      ),
    });
  }

  async onModuleInit(): Promise<void> {
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

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    await this.qdrant.upsert(RAG_CONFIG.COLLECTION_NAME, {
      wait: true,
      points,
    });
  }

  async searchByVector(params: {
    knowledgeHubId: string;
    vector: number[];
    limit: number;
  }): Promise<VectorSearchResult[]> {
    const searchResult = await this.qdrant.search(RAG_CONFIG.COLLECTION_NAME, {
      vector: params.vector,
      limit: params.limit,
      filter: {
        must: [
          {
            key: 'knowledgeHubId',
            match: { value: params.knowledgeHubId },
          },
        ],
      },
      with_payload: true,
    });

    return searchResult.map((result) => ({
      fileId: result.payload?.fileId as string,
      text: result.payload?.text as string,
      score: result.score,
    }));
  }

  async deleteByFileId(fileId: string): Promise<void> {
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
  }

  async deleteByKnowledgeHubId(knowledgeHubId: string): Promise<void> {
    await this.qdrant.delete(RAG_CONFIG.COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'knowledgeHubId',
            match: { value: knowledgeHubId },
          },
        ],
      },
    });
  }
}
