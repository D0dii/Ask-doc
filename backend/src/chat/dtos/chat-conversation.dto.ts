import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ChatMessageResponseDto } from './chat-message.dto';

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Optional title for the conversation',
    example: 'Questions about REST API',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

export class UpdateConversationDto {
  @ApiProperty({
    description: 'New title for the conversation',
    example: 'REST API Architecture Discussion',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;
}

export class ConversationResponseDto {
  @ApiProperty({ description: 'Unique identifier of the conversation' })
  id: string;

  @ApiProperty({
    description: 'Title of the conversation',
    nullable: true,
  })
  title: string | null;

  @ApiProperty({
    description: 'ID of the knowledge hub this conversation belongs to',
  })
  knowledgeHubId: string;

  @ApiProperty({ description: 'ID of the user who created the conversation' })
  userId: string;

  @ApiProperty({ description: 'Number of messages in the conversation' })
  messageCount: number;

  @ApiProperty({ description: 'When the conversation was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the conversation was last updated' })
  updatedAt: Date;
}

export class ConversationWithMessagesDto extends ConversationResponseDto {
  @ApiProperty({
    description: 'Messages in the conversation',
    type: [ChatMessageResponseDto],
  })
  messages: ChatMessageResponseDto[];
}

export class ConversationListResponseDto {
  @ApiProperty({
    description: 'List of conversations',
    type: [ConversationResponseDto],
  })
  conversations: ConversationResponseDto[];

  @ApiProperty({ description: 'Total number of conversations' })
  total: number;
}

export class QueryInConversationDto {
  @ApiProperty({
    description: 'The question to ask about the documents',
    example: 'What is the main topic of the document?',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  question: string;

  @ApiPropertyOptional({
    description:
      'ID of an existing conversation to continue. If not provided, a new conversation will be created.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  conversationId?: string;
}

export class QueryInConversationResponseDto {
  @ApiProperty({ description: 'The AI-generated answer' })
  answer: string;

  @ApiProperty({
    description: 'Source documents used to generate the answer',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileId: { type: 'string' },
        text: { type: 'string' },
        score: { type: 'number' },
      },
    },
  })
  sources: Array<{ fileId: string; text: string; score: number }>;

  @ApiProperty({ description: 'The conversation ID (new or existing)' })
  conversationId: string;

  @ApiProperty({ description: 'The message ID of this Q&A' })
  messageId: string;
}
