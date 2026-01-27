import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

interface CreateChatMessageParams {
  question: string;
  answer: string;
  sources: Array<{
    fileId: string;
    text: string;
    score: number;
  }> | null;
  workspaceId: string;
  userId: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async createMessage(params: CreateChatMessageParams): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      question: params.question,
      answer: params.answer,
      sources: params.sources ?? undefined,
      workspaceId: params.workspaceId,
      userId: params.userId,
    });

    return this.chatMessageRepository.save(message);
  }

  async getMessagesByWorkspace(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const [messages, total] = await this.chatMessageRepository.findAndCount({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { messages, total };
  }

  async getMessageById(
    messageId: string,
    workspaceId: string,
  ): Promise<ChatMessage | null> {
    return this.chatMessageRepository.findOne({
      where: { id: messageId, workspaceId },
    });
  }

  async deleteMessage(
    messageId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const result = await this.chatMessageRepository.delete({
      id: messageId,
      workspaceId,
    });

    return (result.affected ?? 0) > 0;
  }

  async clearWorkspaceHistory(workspaceId: string): Promise<number> {
    const result = await this.chatMessageRepository.delete({ workspaceId });
    return result.affected ?? 0;
  }
}
