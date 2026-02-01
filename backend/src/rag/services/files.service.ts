import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../entities/file.entity';
import { VectorStoreService, SearchResult } from './vector-store.service';
import { extractTextFromPdf } from '../utils/pdf.util';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private vectorStoreService: VectorStoreService,
  ) {}

  // ==================== FILE CRUD ====================

  async getFilesByWorkspace(workspaceId: string): Promise<File[]> {
    return this.fileRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getFileById(fileId: string, workspaceId: string): Promise<File | null> {
    return this.fileRepository.findOne({
      where: { id: fileId, workspaceId },
    });
  }

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

  async deleteFile(fileId: string, workspaceId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, workspaceId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete vectors from Qdrant
    try {
      await this.vectorStoreService.deleteByFileId(fileId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for file ${fileId}: ${message}`,
      );
      // Continue to delete file record even if vector deletion fails
    }

    // Delete file record from DB
    await this.fileRepository.remove(file);
    this.logger.log(`Deleted file record: ${fileId}`);
  }

  async deleteAllByWorkspace(workspaceId: string): Promise<void> {
    const files = await this.fileRepository.find({ where: { workspaceId } });

    if (files.length === 0) {
      return;
    }

    // Delete all vectors from Qdrant for this workspace
    try {
      await this.vectorStoreService.deleteByWorkspaceId(workspaceId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for workspace ${workspaceId}: ${message}`,
      );
      // Continue to delete file records even if vector deletion fails
    }

    // Delete all file records from DB
    await this.fileRepository.remove(files);
    this.logger.log(
      `Deleted ${files.length} file records for workspace: ${workspaceId}`,
    );
  }

  // ==================== SEARCH (delegates to VectorStore) ====================

  async search(
    workspaceId: string,
    question: string,
    limit?: number,
  ): Promise<SearchResult[]> {
    // Check if workspace has any completed files
    const completedFiles = await this.fileRepository.count({
      where: { workspaceId, status: FileStatus.COMPLETED },
    });

    if (completedFiles === 0) {
      throw new BadRequestException(
        'No processed documents in this workspace. Please upload and wait for files to be processed.',
      );
    }

    return this.vectorStoreService.search(workspaceId, question, limit);
  }

  // ==================== PRIVATE HELPERS ====================

  private async processFileAsync(
    fileId: string,
    fileBuffer: Buffer,
    workspaceId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting async processing for file: ${fileId}`);

      // Parse PDF
      const text = await extractTextFromPdf(fileBuffer);

      // Ingest into vector store
      await this.vectorStoreService.ingestDocument(text, workspaceId, fileId);

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
}
