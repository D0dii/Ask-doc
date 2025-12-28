import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import type {
  CookieRequest,
  JwtPayload,
  UserRequest,
} from '../types/auth.types';

@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<CookieRequest & UserRequest>();
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      req.user = user;
      return true;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
