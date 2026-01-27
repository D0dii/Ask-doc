import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageSourceDto {
  @ApiProperty({ description: 'The file ID this source belongs to' })
  fileId: string;

  @ApiProperty({ description: 'The text content of the source' })
  text: string;

  @ApiProperty({ description: 'Similarity score (0-1)' })
  score: number;
}

export class ChatMessageResponseDto {
  @ApiProperty({ description: 'Unique identifier of the chat message' })
  id: string;

  @ApiProperty({ description: 'The question asked by the user' })
  question: string;

  @ApiProperty({ description: 'The AI-generated answer' })
  answer: string;

  @ApiProperty({
    description: 'Source documents used to generate the answer',
    type: [ChatMessageSourceDto],
    nullable: true,
  })
  sources: ChatMessageSourceDto[] | null;

  @ApiProperty({ description: 'ID of the workspace this message belongs to' })
  workspaceId: string;

  @ApiProperty({ description: 'ID of the user who asked the question' })
  userId: string;

  @ApiProperty({ description: 'When the message was created' })
  createdAt: Date;
}

export class ChatHistoryResponseDto {
  @ApiProperty({
    description: 'List of chat messages',
    type: [ChatMessageResponseDto],
  })
  messages: ChatMessageResponseDto[];

  @ApiProperty({ description: 'Total number of messages' })
  total: number;
}
