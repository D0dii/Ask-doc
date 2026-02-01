import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatConversation } from '../entities/chat-conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatConversation)
    private conversationRepository: Repository<ChatConversation>,
  ) {}

  // ==================== CONVERSATION CRUD ====================

  async createConversation(
    workspaceId: string,
    userId: string,
    title?: string,
  ): Promise<ChatConversation> {
    const conversation = this.conversationRepository.create({
      workspaceId,
      userId,
      title: title || null,
    });

    return this.conversationRepository.save(conversation);
  }

  async getConversationsByWorkspace(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ conversations: ChatConversation[]; total: number }> {
    const [conversations, total] =
      await this.conversationRepository.findAndCount({
        where: { workspaceId },
        order: { updatedAt: 'DESC' },
        take: limit,
        skip: offset,
      });

    return { conversations, total };
  }

  async getConversationById(
    conversationId: string,
    workspaceId: string,
  ): Promise<ChatConversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, workspaceId },
    });
  }

  async getConversationWithMessages(
    conversationId: string,
    workspaceId: string,
  ): Promise<ChatConversation | null> {
    return this.conversationRepository.findOne({
      where: { id: conversationId, workspaceId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async updateConversationTitle(
    conversationId: string,
    workspaceId: string,
    title: string,
  ): Promise<ChatConversation | null> {
    const conversation = await this.getConversationById(
      conversationId,
      workspaceId,
    );

    if (!conversation) {
      return null;
    }

    conversation.title = title;
    return this.conversationRepository.save(conversation);
  }

  async deleteConversation(
    conversationId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const result = await this.conversationRepository.delete({
      id: conversationId,
      workspaceId,
    });

    return (result.affected ?? 0) > 0;
  }

  async clearWorkspaceConversations(workspaceId: string): Promise<number> {
    const result = await this.conversationRepository.delete({ workspaceId });
    return result.affected ?? 0;
  }

  async touchConversation(conversationId: string): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      updatedAt: new Date(),
    });
  }

  // ==================== MESSAGE CRUD ====================

  async createMessage(params: {
    question: string;
    answer: string;
    sources: Array<{ fileId: string; text: string; score: number }> | null;
    conversationId: string;
    userId: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      question: params.question,
      answer: params.answer,
      sources: params.sources ?? undefined,
      conversationId: params.conversationId,
      userId: params.userId,
    });

    return this.chatMessageRepository.save(message);
  }

  async getMessagesByConversation(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentMessages(
    conversationId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteMessage(
    messageId: string,
    conversationId: string,
  ): Promise<boolean> {
    const result = await this.chatMessageRepository.delete({
      id: messageId,
      conversationId,
    });

    return (result.affected ?? 0) > 0;
  }

  async getMessageCountByConversation(conversationId: string): Promise<number> {
    return this.chatMessageRepository.count({
      where: { conversationId },
    });
  }
}
