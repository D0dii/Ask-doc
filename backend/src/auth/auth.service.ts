import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GoogleProfileUser } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleGoogleUser(googleUser: GoogleProfileUser): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    if (!googleUser.email) {
      throw new Error('Email is required for Google login');
    }

    const user = await this.usersService.upsertByEmail({
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      picture: googleUser.picture,
      accessToken: googleUser.accessToken,
    });

    const tokens = this.createTokens(user);

    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshSecret =
      this.configService.get<string>('REFRESH_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    const payload = this.jwtService.verify<{
      sub: string;
      email?: string;
      isAdmin?: boolean;
      type?: string;
    }>(refreshToken, {
      secret: refreshSecret,
    });

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    return this.createTokens(user);
  }

  private createTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      type: 'access' as const,
    };

    const refreshPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      type: 'refresh' as const,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn:
        (this.configService.get<string>(
          'JWT_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn']) ?? '15m',
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret:
        this.configService.get<string>('REFRESH_JWT_SECRET') ||
        this.configService.get<string>('JWT_SECRET'),
      expiresIn:
        (this.configService.get<string>(
          'REFRESH_JWT_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn']) ?? '7d',
    });

    return { accessToken, refreshToken };
  }
}
