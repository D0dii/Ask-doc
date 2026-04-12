import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    description: 'Note title',
    example: 'Q3 rollout checklist',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Note content in plain text or markdown',
    example: 'Key points from today\'s review...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
