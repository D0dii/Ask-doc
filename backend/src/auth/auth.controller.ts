import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type GoogleUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken?: string;
};

type AuthedRequest = Request & { user?: GoogleUser };
type CookieBag = {
  access_token?: string;
  refresh_token?: string;
};
type CookieRequest = Request & { cookies: CookieBag };

@Controller('auth')
export class AuthController {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  // 1. Frontend links here -> Redirects to Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  googleAuth(@Req() _req: AuthedRequest) {
    return; // Guard handles the redirect to Google
  }

  // 2. Google sends user back here
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: AuthedRequest, @Res() res: Response) {
    if (!req.user) {
      return res.status(401).send('Google authentication failed');
    }

    const { accessToken, refreshToken } =
      await this.authService.handleGoogleUser(req.user);

    this.setAuthCookies(res, accessToken, refreshToken);

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    res.redirect(frontendUrl);
  }

  @Get('me')
  async me(@Req() req: CookieRequest, @Res() res: Response) {
    const accessToken = req.cookies?.access_token;
    console.log(accessToken);
    if (!accessToken) {
      return res.status(401).send('Not authenticated');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
      }>(accessToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        return res.status(401).send('User not found');
      }

      return res.send({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        isAdmin: user.isAdmin,
      });
    } catch (err) {
      console.log(err);
      return res.status(401).send('Invalid token');
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: CookieRequest, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).send('Missing refresh token');
    }

    try {
      const { accessToken, refreshToken: newRefresh } =
        await this.authService.refreshTokens(refreshToken);

      this.setAuthCookies(res, accessToken, newRefresh);
      return res.send({ ok: true });
    } catch (err) {
      console.log(err);
      return res.status(401).send('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    this.clearAuthCookies(res);
    return res.send({ ok: true });
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 0,
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 0,
    });
  }
}
