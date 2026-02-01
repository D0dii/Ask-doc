import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { FilesService } from '../rag/services';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
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

    // Cascade delete: remove all files and vectors first
    await this.filesService.deleteAllByWorkspace(id);

    await this.workspaceRepository.remove(workspace);
    return true;
  }
}
