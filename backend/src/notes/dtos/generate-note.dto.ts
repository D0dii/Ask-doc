import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NoteGenerationMode } from '../entities/note.entity';

export class GenerateNoteDto {
  @ApiProperty({
    description: 'How the note should be generated',
    enum: NoteGenerationMode,
    example: NoteGenerationMode.FROM_ANSWER,
  })
  @IsEnum(NoteGenerationMode)
  mode: NoteGenerationMode;

  @ApiProperty({
    description: 'Topic query text used when mode is from_topic_query',
    example: 'Summarize OAuth2 authorization code flow from uploaded docs',
    required: false,
    minLength: 3,
    maxLength: 4000,
  })
  @ValidateIf((dto: GenerateNoteDto) => dto.mode === NoteGenerationMode.FROM_TOPIC_QUERY)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(4000)
  query?: string;

  @ApiProperty({
    description: 'Chat message ID used when mode is from_answer',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((dto: GenerateNoteDto) => dto.mode === NoteGenerationMode.FROM_ANSWER)
  @IsUUID()
  messageId?: string;

  @ApiProperty({
    description: 'Document ID used when mode is from_selection',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ValidateIf((dto: GenerateNoteDto) => dto.mode === NoteGenerationMode.FROM_SELECTION)
  @IsUUID()
  documentId?: string;

  @ApiProperty({
    description: 'Selected text from document used when mode is from_selection',
    required: false,
    example: 'OAuth2 authorization code flow exchanges an auth code for access token.',
    minLength: 3,
    maxLength: 4000,
  })
  @ValidateIf((dto: GenerateNoteDto) => dto.mode === NoteGenerationMode.FROM_SELECTION)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(4000)
  selectionText?: string;

  @ApiProperty({
    description: 'Optional note title override',
    example: 'Study Notes: API Authentication',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;
}
