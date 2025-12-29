import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the workspace',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the workspace',
    example: 'My Project',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the workspace',
    example: 'A workspace for my project documents',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'ID of the workspace owner',
    example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-29T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-12-29T12:00:00.000Z',
  })
  updatedAt: Date;
}
