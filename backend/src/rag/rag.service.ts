import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ollama } from 'ai-sdk-ollama';
import { embedMany, embed } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from './utils/pdf.util';
import { File, FileStatus } from './entities/file.entity';
import { EMBEDDING_MODELS, RAG_CONFIG } from '../shared/constants';

export interface SearchResult {
  fileId: string;
  text: string;
  score: number;
}

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private qdrant: QdrantClient;

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

  // 2. The Ingestion Function
  async ingestFile(fileBuffer: Buffer, workspaceId: string, fileId: string) {
    this.logger.log(`Starting ingestion for file: ${fileId}`);

    // A. Parse PDF
    const text = await extractTextFromPdf(fileBuffer);

    // B. Split Text (Chunks)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: RAG_CONFIG.CHUNK_SIZE,
      chunkOverlap: RAG_CONFIG.CHUNK_OVERLAP,
    });
    const docOutput = await splitter.createDocuments([text]);
    const chunks = docOutput.map((doc) => doc.pageContent);

    this.logger.log(`Generated ${chunks.length} chunks from PDF.`);

    // C. Embed using Ollama (batch in groups)
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

    // D. Prepare Points for Qdrant
    const points = chunks.map((chunk, index) => ({
      id: uuidv4(), // Qdrant needs UUIDs
      vector: allEmbeddings[index],
      payload: {
        text: chunk, // We store the text to retrieve it later
        fileId: fileId, // For Deletion/Filtering
        workspaceId: workspaceId, // For User Security
      },
    }));

    // E. Save to Database
    await this.qdrant.upsert(RAG_CONFIG.COLLECTION_NAME, {
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
    }

    // Delete file record from DB
    await this.fileRepository.remove(file);
    this.logger.log(`Deleted file record: ${fileId}`);
  }

  // Delete all files and vectors for a workspace
  async deleteAllByWorkspace(workspaceId: string): Promise<void> {
    // Get all files for this workspace
    const files = await this.fileRepository.find({ where: { workspaceId } });

    if (files.length === 0) {
      return;
    }

    // Delete all vectors from Qdrant for this workspace
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
    }

    // Delete all file records from DB
    await this.fileRepository.remove(files);
    this.logger.log(
      `Deleted ${files.length} file records for workspace: ${workspaceId}`,
    );
  }

  // Search for relevant document chunks in a workspace (semantic search only)
  async search(
    workspaceId: string,
    question: string,
    limit = RAG_CONFIG.DEFAULT_SEARCH_LIMIT,
  ): Promise<SearchResult[]> {
    this.logger.log(`Searching workspace ${workspaceId} for: ${question}`);

    // Check if workspace has any completed files
    const completedFiles = await this.fileRepository.count({
      where: { workspaceId, status: FileStatus.COMPLETED },
    });

    if (completedFiles === 0) {
      throw new BadRequestException(
        'No processed documents in this workspace. Please upload and wait for files to be processed.',
      );
    }

    // Embed the question
    const { embedding: questionEmbedding } = await embed({
      model: ollama.embedding(EMBEDDING_MODELS.OLLAMA.DEFAULT),
      value: question,
    });

    // Search in Qdrant (filter by workspaceId for security)
    const searchResult = await this.qdrant.search(RAG_CONFIG.COLLECTION_NAME, {
      vector: questionEmbedding,
      limit,
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

    // Extract and return search results
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
}
