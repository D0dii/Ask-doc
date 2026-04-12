import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFlashcardDto {
  @ApiProperty({
    description: 'Flashcard front text (question/prompt)',
    example: 'What is retrieval augmented generation (RAG)?',
  })
  @IsString()
  @IsNotEmpty()
  front: string;

  @ApiProperty({
    description: 'Flashcard back text (answer/explanation)',
    example: 'A pattern that augments LLM prompts with retrieved context.',
  })
  @IsString()
  @IsNotEmpty()
  back: string;
}
