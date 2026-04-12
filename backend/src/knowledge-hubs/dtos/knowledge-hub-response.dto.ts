import { ApiProperty } from '@nestjs/swagger';

export class KnowledgeHubResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the knowledge hub',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the knowledge hub',
    example: 'Product Architecture',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the knowledge hub',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'ID of the knowledge hub owner',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
