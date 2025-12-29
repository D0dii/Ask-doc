import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Indicates the refresh was successful',
    example: true,
  })
  ok: boolean;
}
