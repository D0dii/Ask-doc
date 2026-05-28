import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { QueryService } from '../services/query.service';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import { KnowledgeHubAccessGuard } from '../../knowledge-hubs/guards/knowledge-hub-access.guard';
import type { KnowledgeHubRequest } from '../../auth/types/auth.types';
import { QueryDto, QueryResponseDto } from '../dtos/chat-query.dto';

@ApiTags('Chat')
@ApiCookieAuth()
@Controller('knowledge-hubs/:hubId/chat')
@ApiParam({ name: 'hubId', description: 'Knowledge Hub ID', type: String })
@UseGuards(JwtCookieGuard, KnowledgeHubAccessGuard)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Ask a question about the documents in a knowledge hub',
    description:
      'Asks a question in the single chat thread for this knowledge hub and returns an answer with sources.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI-generated answer with sources',
    type: QueryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async query(
    @Req() req: KnowledgeHubRequest,
    @Body() body: QueryDto,
  ): Promise<QueryResponseDto> {
    return this.queryService.query(
      req.knowledgeHub.id,
      req.user.id,
      body.question,
    );
  }
}
