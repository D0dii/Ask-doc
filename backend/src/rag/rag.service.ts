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
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { embedMany, embed, generateText } from 'ai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from './utils/pdf.util';
import { File, FileStatus } from './entities/file.entity';

interface QueryResult {
  answer: string;
  sources: Array<{
    fileId: string;
    text: string;
    score: number;
  }>;
}

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
  async ingestFile(fileBuffer: Buffer, workspaceId: string, fileId: string) {
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

    // C. Embed using Gemini (batch in groups of 100 - API limit)
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      this.logger.log(
        `Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batchChunks.length} chunks)`,
      );

      const { embeddings } = await embedMany({
        model: google.embeddingModel('text-embedding-004'),
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

  // Delete all files and vectors for a workspace
  async deleteAllByWorkspace(workspaceId: string): Promise<void> {
    // Get all files for this workspace
    const files = await this.fileRepository.find({ where: { workspaceId } });

    if (files.length === 0) {
      return;
    }

    // Delete all vectors from Qdrant for this workspace
    try {
      await this.qdrant.delete(this.COLLECTION_NAME, {
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

  // Query documents in a workspace
  async query(workspaceId: string, question: string): Promise<QueryResult> {
    this.logger.log(`Query for workspace ${workspaceId}: ${question}`);

    // Check if workspace has any completed files
    const completedFiles = await this.fileRepository.count({
      where: { workspaceId, status: FileStatus.COMPLETED },
    });

    if (completedFiles === 0) {
      throw new BadRequestException(
        'No processed documents in this workspace. Please upload and wait for files to be processed.',
      );
    }

    // A. Embed the question
    const { embedding: questionEmbedding } = await embed({
      model: google.embeddingModel('text-embedding-004'),
      value: question,
    });

    // B. Search in Qdrant (filter by workspaceId for security)
    const searchResult = await this.qdrant.search(this.COLLECTION_NAME, {
      vector: questionEmbedding,
      limit: 5, // Top 5 most relevant chunks
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

    if (searchResult.length === 0) {
      return {
        answer:
          'I could not find any relevant information in the documents to answer your question.',
        sources: [],
      };
    }

    // C. Extract context from search results
    const sources = searchResult.map((result) => ({
      fileId: result.payload?.fileId as string,
      text: result.payload?.text as string,
      score: result.score,
    }));

    const context = sources.map((s) => s.text).join('\n\n---\n\n');

    // D. Generate answer using LLM
    const { text: answer } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are a helpful assistant that answers questions based on the provided document context. 
Only answer based on the information in the context. If the context doesn't contain enough information to answer the question, say so.
Be concise and accurate.`,
      prompt: `Context from documents:
${context}

Question: ${question}

Answer:`,
    });

    this.logger.log(`Generated answer for workspace ${workspaceId}`);

    return {
      answer,
      sources,
    };
  }
}
