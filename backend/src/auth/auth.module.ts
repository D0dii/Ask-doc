import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtCookieGuard } from './guards/jwt-cookie.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            (config.get<string>(
              'JWT_EXPIRES_IN',
            ) as JwtSignOptions['expiresIn']) ?? '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtCookieGuard],
})
export class AuthModule {}
