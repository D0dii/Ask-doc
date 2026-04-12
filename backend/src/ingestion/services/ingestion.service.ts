import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../documents/entities/file.entity';
import { VectorService } from '../../shared/vector-store/vector.service';
import { extractTextFromPdf } from '../utils/pdf.util';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private vectorService: VectorService,
  ) {}

  async processFileAsync(
    fileId: string,
    fileBuffer: Buffer,
    knowledgeHubId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting async processing for file: ${fileId}`);

      const text = await extractTextFromPdf(fileBuffer);
      await this.vectorService.ingestDocument(text, knowledgeHubId, fileId);

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

      await this.fileRepository.update(fileId, {
        status: FileStatus.FAILED,
        errorMessage: message,
      });
    }
  }
}
