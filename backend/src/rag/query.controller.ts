import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { RagService } from './rag.service';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../auth/types/auth.types';
import { QueryDto, QueryResponseDto } from './dtos';

@ApiTags('RAG')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/query')
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class QueryController {
  constructor(private readonly ragService: RagService) {}

  @Post()
  @ApiOperation({
    summary: 'Ask a question about the documents in a workspace',
  })
  @ApiResponse({
    status: 200,
    description: 'AI-generated answer with sources',
    type: QueryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no processed documents in workspace',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async query(
    @Req() req: WorkspaceRequest,
    @Body() body: QueryDto,
  ): Promise<QueryResponseDto> {
    return this.ragService.query(req.workspace.id, body.question);
  }
}
