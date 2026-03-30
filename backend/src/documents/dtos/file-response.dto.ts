import { ApiProperty } from '@nestjs/swagger';
import { FileStatus } from '../entities/file.entity';

export class FileResponseDto {
  @ApiProperty({ description: 'File ID' })
  id: string;

  @ApiProperty({ description: 'File name' })
  name: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({
    description: 'Processing status',
    enum: FileStatus,
    example: FileStatus.PENDING,
  })
  status: FileStatus;

  @ApiProperty({
    description: 'Error message if processing failed',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({ description: 'Workspace ID this file belongs to' })
  workspaceId: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}
