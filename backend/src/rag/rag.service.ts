import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QdrantClient } from '@qdrant/js-client-rest';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from './utils/pdf.util';
import { File, FileStatus } from './entities/file.entity';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private qdrant: QdrantClient;
  private readonly COLLECTION_NAME = 'ask_doc';

  constructor(
    private configService: ConfigService,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {
    this.qdrant = new QdrantClient({
      url: this.configService.get<string>(
        'QDRANT_URL',
        'http://localhost:6333',
      ),
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

  // Get all files for a workspace (authorization handled by guard)
  async getFilesByWorkspace(workspaceId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  // Get a specific file (authorization handled by guard)
  async getFileById(fileId: string, workspaceId: string): Promise<File | null> {
    return this.fileRepository.findOne({
      where: { id: fileId, workspaceId },
    });
  }

  // Create file record and start async processing (authorization handled by guard)
  async createAndProcessFile(
    uploadedFile: Express.Multer.File,
    workspaceId: string,
  ): Promise<File> {
    // Create file record in DB
    const file = this.fileRepository.create({
      name: uploadedFile.originalname,
      originalName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      status: FileStatus.PROCESSING,
      workspaceId,
    });

    const savedFile = await this.fileRepository.save(file);

    // Fire and forget - start processing without awaiting
    this.processFileAsync(savedFile.id, uploadedFile.buffer, workspaceId).catch(
      (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to process file ${savedFile.id}: ${message}`);
      },
    );

    return savedFile;
  }

  // Async file processing
  private async processFileAsync(
    fileId: string,
    fileBuffer: Buffer,
    workspaceId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting async processing for file: ${fileId}`);

      // Run the ingestion
      await this.ingestFile(fileBuffer, workspaceId, fileId);

      // Update status to completed
      await this.fileRepository.update(fileId, {
        status: FileStatus.COMPLETED,
      });

      this.logger.log(`Completed processing for file: ${fileId}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during processing';
      this.logger.error(`Error processing file ${fileId}: ${message}`);

      // Update status to failed with error message
      await this.fileRepository.update(fileId, {
        status: FileStatus.FAILED,
        errorMessage: message,
      });
    }
  }

  // Delete file and its vectors (authorization handled by guard)
  async deleteFile(fileId: string, workspaceId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, workspaceId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete vectors from Qdrant
    try {
      await this.qdrant.delete(this.COLLECTION_NAME, {
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
    }

    // Delete file record from DB
    await this.fileRepository.remove(file);
    this.logger.log(`Deleted file record: ${fileId}`);
  }
}
