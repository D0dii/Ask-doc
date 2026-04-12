import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../documents/entities/file.entity';
import type { RetrievalStrategy } from '../types/retrieval.types';
import type { EvidenceChunk } from '../../shared/evidence/evidence.types';

@Injectable()
export class KeywordStrategy implements RetrievalStrategy {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {}

  async search(params: {
    knowledgeHubId: string;
    query: string;
    limit: number;
  }): Promise<EvidenceChunk[]> {
    if (!params.query.trim()) {
      return [];
    }

    const files = await this.fileRepository.find({
      where: {
        knowledgeHubId: params.knowledgeHubId,
        status: FileStatus.COMPLETED,
      },
      take: params.limit,
      order: { updatedAt: 'DESC' },
    });

    return files.map((file) => ({
      sourceType: 'retrieved_doc' as const,
      content: `Keyword match candidate from document ${file.name}`,
      sourceRef: file.id,
      score: 0.55,
      metadata: { strategy: 'keyword' },
    }));
  }
}
