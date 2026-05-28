import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class QueryDto {
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
}

export class QueryResponseDto {
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

  @ApiProperty({ description: 'The chat thread ID for this knowledge hub' })
  threadId: string;

  @ApiProperty({ description: 'The message ID of this Q&A' })
  messageId: string;
}
