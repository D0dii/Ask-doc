import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { VectorService } from '../shared/vector-store/vector.service';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly vectorService: VectorService,
  ) {}

  async create(data: {
    name: string;
    description?: string;
    ownerId: string;
  }): Promise<Workspace> {
    const workspace = this.workspaceRepository.create(data);
    return this.workspaceRepository.save(workspace);
  }

  async findAllByOwner(ownerId: string): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({ where: { id } });
  }

  async findOneByOwner(id: string, ownerId: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({ where: { id, ownerId } });
  }

  async update(
    id: string,
    ownerId: string,
    data: { name?: string; description?: string },
  ): Promise<Workspace | null> {
    const workspace = await this.findOneByOwner(id, ownerId);
    if (!workspace) return null;

    Object.assign(workspace, data);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const workspace = await this.findOneByOwner(id, ownerId);
    if (!workspace) return false;

    // Remove vectors scoped to this workspace before deleting the workspace row
    await this.vectorService.deleteByWorkspaceId(id);

    await this.workspaceRepository.remove(workspace);
    return true;
  }
}
