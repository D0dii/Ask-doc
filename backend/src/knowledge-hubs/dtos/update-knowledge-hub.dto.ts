import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateKnowledgeHubDto {
  @ApiProperty({
    description: 'Name of the knowledge hub',
    example: 'Updated Product Architecture',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Optional description of the knowledge hub',
    example: 'Updated description',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
