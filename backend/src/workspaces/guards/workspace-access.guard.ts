import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import type { UserRequest } from '../../auth/types/auth.types';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get workspaceId from route params (supports both :workspaceId and :id)
    const workspaceId =
      request.params.workspaceId || request.params.workspace_id;

    if (!workspaceId) {
      // No workspace param in route, skip this guard
      return true;
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach workspace to request for use in controller/service
    request.workspace = workspace;

    return true;
  }
}
