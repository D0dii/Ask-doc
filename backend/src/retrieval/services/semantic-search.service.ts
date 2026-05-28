import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../documents/entities/file.entity';
import { VectorService } from '../../shared/vector-store/vector.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';

@Injectable()
export class SemanticSearchService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private vectorService: VectorService,
  ) {}

  async retrieve(
    knowledgeHubId: string,
    question: string,
    limit?: number,
  ): Promise<VectorSearchResult[]> {
    const completedFiles = await this.fileRepository.count({
      where: { knowledgeHubId, status: FileStatus.COMPLETED },
    });

    if (completedFiles === 0) {
      return [];
    }

    return this.vectorService.search(knowledgeHubId, question, limit);
  }
}
