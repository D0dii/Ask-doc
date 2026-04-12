import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeHub } from '../entities/knowledge-hub.entity';
import type { UserRequest } from '../../auth/types/auth.types';

@Injectable()
export class KnowledgeHubAccessGuard implements CanActivate {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(KnowledgeHub)
    private knowledgeHubRepository: Repository<KnowledgeHub>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const knowledgeHubId =
      request.params.hubId ||
      request.params.hub_id ||
      request.params.knowledgeHubId ||
      request.params.knowledge_hub_id ||
      request.params.id;

    if (!knowledgeHubId) {
      return true;
    }

    if (!KnowledgeHubAccessGuard.UUID_REGEX.test(knowledgeHubId)) {
      throw new BadRequestException('Invalid knowledge hub id');
    }

    const knowledgeHub = await this.knowledgeHubRepository.findOne({
      where: { id: knowledgeHubId },
    });

    if (!knowledgeHub) {
      throw new NotFoundException('Knowledge hub not found');
    }

    if (knowledgeHub.ownerId !== user.id) {
      throw new ForbiddenException(
        'You do not have access to this knowledge hub',
      );
    }

    request.knowledgeHub = knowledgeHub;
    return true;
  }
}
