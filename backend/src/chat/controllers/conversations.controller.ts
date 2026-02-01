import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ConversationsService } from '../services';
import { JwtCookieGuard } from '../../auth/guards/jwt-cookie.guard';
import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../../auth/types/auth.types';
import {
  ChatMessageResponseDto,
  ConversationResponseDto,
  ConversationWithMessagesDto,
  ConversationListResponseDto,
  CreateConversationDto,
  UpdateConversationDto,
} from '../dtos';

@ApiTags('Chat Conversations')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/chat/conversations')
@ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // ==================== CONVERSATIONS ====================

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createConversation(
    @Req() req: WorkspaceRequest,
    @Body() body: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationsService.createConversation(
      req.workspace.id,
      req.user.id,
      body.title,
    );

    return {
      ...conversation,
      messageCount: 0,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for a workspace' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of conversations to return (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of conversations to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of conversations',
    type: ConversationListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversations(
    @Req() req: WorkspaceRequest,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<ConversationListResponseDto> {
    const { conversations, total } =
      await this.conversationsService.getConversationsByWorkspace(
        req.workspace.id,
        limit ?? 50,
        offset ?? 0,
      );

    // Get message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      conversations.map(async (conv) => ({
        ...conv,
        messageCount:
          await this.conversationsService.getMessageCountByConversation(
            conv.id,
          ),
      })),
    );

    return { conversations: conversationsWithCounts, total };
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get a specific conversation with its messages' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation with messages',
    type: ConversationWithMessagesDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Req() req: WorkspaceRequest,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<ConversationWithMessagesDto> {
    const conversation =
      await this.conversationsService.getConversationWithMessages(
        conversationId,
        req.workspace.id,
      );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      ...conversation,
      messageCount: conversation.messages?.length ?? 0,
    };
  }

  @Patch(':conversationId')
  @ApiOperation({ summary: 'Update a conversation title' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async updateConversation(
    @Req() req: WorkspaceRequest,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() body: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    const conversation =
      await this.conversationsService.updateConversationTitle(
        conversationId,
        req.workspace.id,
        body.title,
      );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      ...conversation,
      messageCount:
        await this.conversationsService.getMessageCountByConversation(
          conversation.id,
        ),
    };
  }

  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete a conversation and all its messages' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(
    @Req() req: WorkspaceRequest,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.conversationsService.deleteConversation(
      conversationId,
      req.workspace.id,
    );

    if (!deleted) {
      throw new NotFoundException('Conversation not found');
    }

    return { success: true };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all conversations for a workspace' })
  @ApiResponse({
    status: 200,
    description: 'All conversations cleared successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearConversations(
    @Req() req: WorkspaceRequest,
  ): Promise<{ deletedCount: number }> {
    const deletedCount =
      await this.conversationsService.clearWorkspaceConversations(
        req.workspace.id,
      );

    return { deletedCount };
  }

  // ==================== MESSAGES ====================

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Get all messages in a conversation' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of messages in the conversation',
    type: [ChatMessageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Req() req: WorkspaceRequest,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<ChatMessageResponseDto[]> {
    // Verify conversation exists in this workspace
    const conversation = await this.conversationsService.getConversationById(
      conversationId,
      req.workspace.id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.conversationsService.getMessagesByConversation(conversationId);
  }

  @Delete(':conversationId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a specific message from a conversation' })
  @ApiParam({
    name: 'conversationId',
    description: 'Conversation ID',
    type: String,
  })
  @ApiParam({ name: 'messageId', description: 'Message ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Req() req: WorkspaceRequest,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<{ success: boolean }> {
    // Verify conversation exists in this workspace
    const conversation = await this.conversationsService.getConversationById(
      conversationId,
      req.workspace.id,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const deleted = await this.conversationsService.deleteMessage(
      messageId,
      conversationId,
    );

    if (!deleted) {
      throw new NotFoundException('Message not found');
    }

    return { success: true };
  }
}
