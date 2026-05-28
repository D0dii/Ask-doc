import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatThread } from '../entities/chat-thread.entity';

@Injectable()
export class ChatThreadService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatThread)
    private threadRepository: Repository<ChatThread>,
  ) {}

  async getOrCreateThread(
    knowledgeHubId: string,
    userId: string,
  ): Promise<ChatThread> {
    const existing = await this.getThreadByKnowledgeHubId(knowledgeHubId);
    if (existing) {
      return existing;
    }

    const thread = this.threadRepository.create({
      knowledgeHubId,
      userId,
      title: null,
    });

    try {
      return await this.threadRepository.save(thread);
    } catch {
      const concurrent = await this.getThreadByKnowledgeHubId(knowledgeHubId);
      if (concurrent) {
        return concurrent;
      }
      throw new Error('Failed to create or retrieve chat thread');
    }
  }

  async getThreadByKnowledgeHubId(
    knowledgeHubId: string,
  ): Promise<ChatThread | null> {
    return this.threadRepository.findOne({
      where: { knowledgeHubId },
    });
  }

  async updateThreadTitleByKnowledgeHub(
    knowledgeHubId: string,
    title: string,
  ): Promise<ChatThread | null> {
    const thread = await this.getThreadByKnowledgeHubId(knowledgeHubId);

    if (!thread) {
      return null;
    }

    thread.title = title;
    return this.threadRepository.save(thread);
  }

  async touchThreadByKnowledgeHub(knowledgeHubId: string): Promise<void> {
    const thread = await this.getThreadByKnowledgeHubId(knowledgeHubId);
    if (!thread) {
      return;
    }

    await this.threadRepository.update(thread.id, {
      updatedAt: new Date(),
    });
  }

  async createMessage(params: {
    question: string;
    answer: string;
    sources: Array<{ fileId: string; text: string; score: number }> | null;
    threadId: string;
    userId: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      question: params.question,
      answer: params.answer,
      sources: params.sources ?? undefined,
      threadId: params.threadId,
      userId: params.userId,
    });

    return this.chatMessageRepository.save(message);
  }

  async getMessagesByThread(threadId: string): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentMessagesByThread(
    threadId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { threadId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteMessageByThread(
    messageId: string,
    threadId: string,
  ): Promise<boolean> {
    const result = await this.chatMessageRepository.delete({
      id: messageId,
      threadId,
    });

    return (result.affected ?? 0) > 0;
  }
}
