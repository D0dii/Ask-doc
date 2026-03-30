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
import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../../auth/types/auth.types';
import {
  QueryInConversationDto,
  QueryInConversationResponseDto,
} from '../dtos/chat-conversation.dto';

@ApiTags('Chat')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/chat')
@ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Ask a question about the documents in a workspace',
    description:
      'Asks a question and optionally continues an existing conversation. If conversationId is provided, the question will be added to that conversation with context awareness. If not, a new conversation will be created.',
  })
  @ApiResponse({
    status: 200,
    description: 'AI-generated answer with sources',
    type: QueryInConversationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - no processed documents in workspace',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Workspace or conversation not found',
  })
  async query(
    @Req() req: WorkspaceRequest,
    @Body() body: QueryInConversationDto,
  ): Promise<QueryInConversationResponseDto> {
    return this.queryService.query(
      req.workspace.id,
      req.user.id,
      body.question,
      body.conversationId,
    );
  }
}
