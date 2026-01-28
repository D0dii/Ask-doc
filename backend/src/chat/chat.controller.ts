import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../auth/types/auth.types';
import {
  ChatMessageResponseDto,
  ChatHistoryResponseDto,
  QueryDto,
  QueryResponseDto,
} from './dtos';

@ApiTags('Chat')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/chat')
@ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
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
    return this.chatService.query(req.workspace.id, req.user.id, body.question);
  }

  @Get()
  @ApiOperation({ summary: 'Get chat history for a workspace' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to return (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of messages to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved successfully',
    type: ChatHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getChatHistory(
    @Req() req: WorkspaceRequest,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ChatHistoryResponseDto> {
    const { messages, total } = await this.chatService.getMessagesByWorkspace(
      req.workspace.id,
      limit ?? 50,
      offset ?? 0,
    );

    return { messages, total };
  }

  @Get(':messageId')
  @ApiOperation({ summary: 'Get a specific chat message' })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Chat message retrieved successfully',
    type: ChatMessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async getMessage(
    @Req() req: WorkspaceRequest,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<ChatMessageResponseDto> {
    const message = await this.chatService.getMessageById(
      messageId,
      req.workspace.id,
    );

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a specific chat message' })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Req() req: WorkspaceRequest,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.chatService.deleteMessage(
      messageId,
      req.workspace.id,
    );

    if (!deleted) {
      throw new NotFoundException('Message not found');
    }

    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all chat history for a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Chat history cleared successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearHistory(
    @Req() req: WorkspaceRequest,
  ): Promise<{ deletedCount: number }> {
    const deletedCount = await this.chatService.clearWorkspaceHistory(
      req.workspace.id,
    );

    return { deletedCount };
  }
}
