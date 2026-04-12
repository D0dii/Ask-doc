import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { FlashcardGenerationMode } from '../entities/flashcard.entity';

export class GenerateFlashcardDto {
  @ApiProperty({
    description: 'How the flashcards should be generated',
    enum: FlashcardGenerationMode,
    example: FlashcardGenerationMode.FROM_TOPIC_QUERY,
  })
  @IsEnum(FlashcardGenerationMode)
  mode: FlashcardGenerationMode;

  @ApiProperty({
    description: 'Topic query text used when mode is from_topic_query',
    example: 'Generate cards about OAuth2 authorization code flow.',
    required: false,
    maxLength: 4000,
  })
  @ValidateIf(
    (dto: GenerateFlashcardDto) => dto.mode === FlashcardGenerationMode.FROM_TOPIC_QUERY,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  query?: string;

  @ApiProperty({
    description: 'Chat message ID used when mode is from_answer',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf(
    (dto: GenerateFlashcardDto) => dto.mode === FlashcardGenerationMode.FROM_ANSWER,
  )
  @IsUUID()
  messageId?: string;

  @ApiProperty({
    description: 'Document ID used when mode is from_selection',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf(
    (dto: GenerateFlashcardDto) => dto.mode === FlashcardGenerationMode.FROM_SELECTION,
  )
  @IsUUID()
  documentId?: string;

  @ApiProperty({
    description: 'Selected text from document used when mode is from_selection',
    required: false,
    example: 'OAuth2 uses authorization code exchange for tokens.',
    maxLength: 4000,
  })
  @ValidateIf(
    (dto: GenerateFlashcardDto) => dto.mode === FlashcardGenerationMode.FROM_SELECTION,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  selectionText?: string;

  @ApiProperty({
    description: 'Number of flashcards to generate',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 20,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}
