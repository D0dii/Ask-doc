import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { ChatMessage } from './entities/chat-message.entity';
import { RagService, SearchResult } from '../rag/rag.service';

export interface QueryResult {
  answer: string;
  sources: SearchResult[];
}

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
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private ragService: RagService,
  ) {}

  // Main query method: search documents, generate answer, store in history
  async query(
    workspaceId: string,
    userId: string,
    question: string,
  ): Promise<QueryResult> {
    this.logger.log(`Processing query for workspace ${workspaceId}`);

    // 1. Search for relevant document chunks
    const sources = await this.ragService.search(workspaceId, question);

    // 2. Generate answer using LLM
    let answer: string;

    if (sources.length === 0) {
      answer =
        'I could not find any relevant information in the documents to answer your question.';
    } else {
      const context = sources.map((s) => s.text).join('\n\n---\n\n');

      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a helpful assistant that answers questions based on the provided document context. 
Only answer based on the information in the context. If the context doesn't contain enough information to answer the question, say so.
Be concise and accurate.`,
        prompt: `Context from documents:
${context}

Question: ${question}

Answer:`,
      });

      answer = text;
    }

    this.logger.log(`Generated answer for workspace ${workspaceId}`);

    // 3. Store the Q&A in chat history
    await this.createMessage({
      question,
      answer,
      sources,
      workspaceId,
      userId,
    });

    return { answer, sources };
  }

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
