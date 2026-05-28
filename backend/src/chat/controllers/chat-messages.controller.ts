import {
  Controller,
  Get,
  Delete,
  Param,
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
} from '@nestjs/swagger';
import { ChatThreadService } from '../services/chat-thread.service';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import { KnowledgeHubAccessGuard } from '../../knowledge-hubs/guards/knowledge-hub-access.guard';
import type { KnowledgeHubRequest } from '../../auth/types/auth.types';
import { ChatMessageResponseDto } from '../dtos/chat-message.dto';

@ApiTags('Chat')
@ApiCookieAuth()
@Controller('knowledge-hubs/:hubId/chat')
@ApiParam({ name: 'hubId', description: 'Knowledge Hub ID', type: String })
@UseGuards(JwtCookieGuard, KnowledgeHubAccessGuard)
export class ChatMessagesController {
  constructor(private readonly chatThreadService: ChatThreadService) {}

  @Get('messages')
  @ApiOperation({
    summary: 'Get all messages in the knowledge hub chat thread',
  })
  @ApiResponse({
    status: 200,
    description: 'List of messages in the knowledge hub chat thread',
    type: [ChatMessageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMessages(
    @Req() req: KnowledgeHubRequest,
  ): Promise<ChatMessageResponseDto[]> {
    const thread = await this.chatThreadService.getThreadByKnowledgeHubId(
      req.knowledgeHub.id,
    );

    if (!thread) {
      return [];
    }

    return this.chatThreadService.getMessagesByThread(thread.id);
  }

  @Delete('messages/:messageId')
  @ApiOperation({
    summary: 'Delete a specific message from knowledge hub thread',
  })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Req() req: KnowledgeHubRequest,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<{ success: boolean }> {
    const thread = await this.chatThreadService.getThreadByKnowledgeHubId(
      req.knowledgeHub.id,
    );

    if (!thread) {
      throw new NotFoundException('Message not found');
    }

    const deleted = await this.chatThreadService.deleteMessageByThread(
      messageId,
      thread.id,
    );

    if (!deleted) {
      throw new NotFoundException('Message not found');
    }

    return { success: true };
  }
}
