import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../entities/file.entity';
import { VectorService } from '../../shared/vector-store';
import { IngestionService } from '../../ingestion/services/ingestion.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private vectorService: VectorService,
    private ingestionService: IngestionService,
  ) {}

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
    const file = this.fileRepository.create({
      name: uploadedFile.originalname,
      originalName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      size: uploadedFile.size,
      status: FileStatus.PROCESSING,
      workspaceId,
    });

    const savedFile = await this.fileRepository.save(file);

    this.ingestionService
      .processFileAsync(savedFile.id, uploadedFile.buffer, workspaceId)
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to process file ${savedFile.id}: ${message}`);
      });

    return savedFile;
  }

  async deleteFile(fileId: string, workspaceId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, workspaceId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      await this.vectorService.deleteByFileId(fileId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for file ${fileId}: ${message}`,
      );
    }

    await this.fileRepository.remove(file);
    this.logger.log(`Deleted file record: ${fileId}`);
  }

  async deleteAllByWorkspace(workspaceId: string): Promise<void> {
    const files = await this.fileRepository.find({ where: { workspaceId } });

    if (files.length === 0) {
      return;
    }

    try {
      await this.vectorService.deleteByWorkspaceId(workspaceId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error deleting vectors for workspace ${workspaceId}: ${message}`,
      );
    }

    await this.fileRepository.remove(files);
    this.logger.log(
      `Deleted ${files.length} file records for workspace: ${workspaceId}`,
    );
  }
}
