import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../documents/entities/file.entity';
import { VectorService } from '../../shared/vector-store/vector.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';

@Injectable()
export class RetrievalService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private vectorService: VectorService,
  ) {}

  async retrieve(
    workspaceId: string,
    question: string,
    limit?: number,
  ): Promise<VectorSearchResult[]> {
    const completedFiles = await this.fileRepository.count({
      where: { workspaceId, status: FileStatus.COMPLETED },
    });

    if (completedFiles === 0) {
      throw new BadRequestException(
        'No processed documents in this workspace. Please upload and wait for files to be processed.',
      );
    }

    return this.vectorService.search(workspaceId, question, limit);
  }
}
