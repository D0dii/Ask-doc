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
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type {
  AuthedRequest,
  CookieRequest,
  UserRequest,
} from './types/auth.types';
import { JwtCookieGuard } from './guards/jwt-cookie.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private configService: ConfigService,
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
  @UseGuards(JwtCookieGuard)
  me(@Req() req: UserRequest, @Res() res: Response) {
    const user = req.user;

    return res.send({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      isAdmin: user.isAdmin,
    });
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
