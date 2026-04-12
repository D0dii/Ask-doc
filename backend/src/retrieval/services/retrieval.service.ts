import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from '../../documents/entities/file.entity';
import { VectorService } from '../../shared/vector-store/vector.service';
import type { VectorSearchResult } from '../../shared/vector-store/vector-store.port';
import {
  EvidenceChunk,
  RetrievedEvidenceResult,
} from '../evidence/evidence.types';

@Injectable()
export class RetrievalService {
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
      throw new BadRequestException(
        'No processed documents in this knowledge hub. Please upload and wait for files to be processed.',
      );
    }

    return this.vectorService.search(knowledgeHubId, question, limit);
  }

  async retrieveEvidence(
    knowledgeHubId: string,
    question: string,
    limit?: number,
  ): Promise<RetrievedEvidenceResult> {
    const sources = await this.retrieve(knowledgeHubId, question, limit);

    return {
      sources,
      evidenceChunks: sources.map((source) =>
        this.toRetrievedEvidenceChunk(source),
      ),
    };
  }

  private toRetrievedEvidenceChunk(source: VectorSearchResult): EvidenceChunk {
    return {
      sourceType: 'retrieved_doc',
      content: source.text,
      sourceRef: source.fileId,
      score: source.score,
    };
  }
}
