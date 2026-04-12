import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeHub } from './entities/knowledge-hub.entity';
import { VectorService } from '../shared/vector-store/vector.service';

@Injectable()
export class KnowledgeHubsService {
  constructor(
    @InjectRepository(KnowledgeHub)
    private readonly knowledgeHubRepository: Repository<KnowledgeHub>,
    private readonly vectorService: VectorService,
  ) {}

  async create(data: {
    name: string;
    description?: string;
    ownerId: string;
  }): Promise<KnowledgeHub> {
    const knowledgeHub = this.knowledgeHubRepository.create(data);
    return this.knowledgeHubRepository.save(knowledgeHub);
  }

  async findAllByOwner(ownerId: string): Promise<KnowledgeHub[]> {
    return this.knowledgeHubRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<KnowledgeHub | null> {
    return this.knowledgeHubRepository.findOne({ where: { id } });
  }

  async findOneByOwner(
    id: string,
    ownerId: string,
  ): Promise<KnowledgeHub | null> {
    return this.knowledgeHubRepository.findOne({ where: { id, ownerId } });
  }

  async update(
    id: string,
    ownerId: string,
    data: { name?: string; description?: string },
  ): Promise<KnowledgeHub | null> {
    const knowledgeHub = await this.findOneByOwner(id, ownerId);
    if (!knowledgeHub) return null;

    Object.assign(knowledgeHub, data);
    return this.knowledgeHubRepository.save(knowledgeHub);
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const knowledgeHub = await this.findOneByOwner(id, ownerId);
    if (!knowledgeHub) return false;

    await this.vectorService.deleteByKnowledgeHubId(id);
    await this.knowledgeHubRepository.remove(knowledgeHub);
    return true;
  }
}
