import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFlashcardDto {
  @ApiPropertyOptional({
    description: 'Flashcard front text (question/prompt)',
    example: 'What does RAG stand for?',
  })
  @IsString()
  @IsOptional()
  front?: string;

  @ApiPropertyOptional({
    description: 'Flashcard back text (answer/explanation)',
    example: 'Retrieval Augmented Generation',
  })
  @IsString()
  @IsOptional()
  back?: string;
}
