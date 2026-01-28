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

export class SourceDto {
  @ApiProperty({ description: 'The file ID this chunk belongs to' })
  fileId: string;

  @ApiProperty({ description: 'The text content of the chunk' })
  text: string;

  @ApiProperty({ description: 'Similarity score (0-1)' })
  score: number;
}

export class QueryResponseDto {
  @ApiProperty({ description: 'The AI-generated answer' })
  answer: string;

  @ApiProperty({
    description: 'Source documents used to generate the answer',
    type: [SourceDto],
  })
  sources: SourceDto[];
}
