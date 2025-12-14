import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from './utils/pdf.util';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private qdrant: QdrantClient;
  private readonly COLLECTION_NAME = 'context_docs';

  constructor() {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  // 1. Initialize Database on Startup
  async onModuleInit() {
    try {
      const result = await this.qdrant.getCollections();
      const exists = result.collections.some(
        (c) => c.name === this.COLLECTION_NAME,
      );

      if (!exists) {
        this.logger.log(`Creating Qdrant collection: ${this.COLLECTION_NAME}`);
        await this.qdrant.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: 768, // Gemini text-embedding-004 size
            distance: 'Cosine',
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to Qdrant', error);
    }
  }

  // 2. The Ingestion Function
  async ingestFile(fileBuffer: Buffer, sessionId: string, fileId: string) {
    this.logger.log(`Starting ingestion for file: ${fileId}`);

    // A. Parse PDF
    const text = await extractTextFromPdf(fileBuffer);

    // B. Split Text (Chunks)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200, // Important for context continuity
    });
    const docOutput = await splitter.createDocuments([text]);
    const chunks = docOutput.map((doc) => doc.pageContent);

    this.logger.log(`Generated ${chunks.length} chunks from PDF.`);

    // C. Embed using Gemini (Vercel SDK handles batching!)
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: chunks,
    });

    // D. Prepare Points for Qdrant
    const points = chunks.map((chunk, index) => ({
      id: uuidv4(), // Qdrant needs UUIDs
      vector: embeddings[index],
      payload: {
        text: chunk, // We store the text to retrieve it later
        fileId: fileId, // For Deletion/Filtering
        sessionId: sessionId, // For User Security
      },
    }));

    // E. Save to Database
    await this.qdrant.upsert(this.COLLECTION_NAME, {
      wait: true,
      points: points,
    });

    this.logger.log(`Successfully ingested file ${fileId}`);
  }
}
