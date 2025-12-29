import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Indicates the logout was successful',
    example: true,
  })
  ok: boolean;
}
