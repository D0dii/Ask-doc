import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { GoogleProfileUser } from './types/auth.types';
import { hash, compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

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

    const tokens = await this.createTokens(user);

    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshSecret =
      this.configService.get<string>('REFRESH_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    let payload: {
      sub: string;
      email?: string;
      isAdmin?: boolean;
      type?: string;
    };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Fetch user with their stored refresh token
    const user = await this.usersService.findOneWithRefreshToken(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user has a stored refresh token
    if (!user.refreshToken) {
      throw new UnauthorizedException(
        'No refresh token found - please login again',
      );
    }

    // Verify the provided refresh token matches the stored hash
    const isRefreshTokenValid = await compare(refreshToken, user.refreshToken);

    if (!isRefreshTokenValid) {
      // Token mismatch - possible token theft, invalidate all tokens
      await this.usersService.updateRefreshToken(user.id, null);
      throw new UnauthorizedException(
        'Invalid refresh token - please login again',
      );
    }

    // Rotate: Generate new tokens and update stored hash
    return this.createTokens(user);
  }

  async logout(userId: string): Promise<void> {
    // Invalidate refresh token by removing it from database
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async createTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
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

    // Hash and store the refresh token in database
    const hashedRefreshToken = await hash(refreshToken, this.BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }
}
