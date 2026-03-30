import { ApiProperty } from '@nestjs/swagger';
import { FileStatus } from '../entities/file.entity';

export class IngestResponseDto {
  @ApiProperty({ description: 'Status message' })
  message: string;

  @ApiProperty({ description: 'File ID' })
  fileId: string;

  @ApiProperty({
    description: 'Current processing status',
    enum: FileStatus,
    example: FileStatus.PROCESSING,
  })
  status: FileStatus;
}
