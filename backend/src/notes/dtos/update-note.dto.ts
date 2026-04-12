import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    description: 'Note title',
    example: 'Q3 rollout checklist (updated)',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Note content in plain text or markdown',
    example: 'Updated notes after reviewing action items.',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
