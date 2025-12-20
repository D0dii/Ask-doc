import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  // 1. Frontend links here -> Redirects to Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req) {}

  // 2. Google sends user back here
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/require-await
  async googleAuthRedirect(@Req() req, @Res() res) {
    // We skip the DB for now. Just sign the profile data directly into a token.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const token = this.jwtService.sign(req.user);

    // Redirect to frontend with token in URL
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.redirect(`http://localhost:5173?token=${token}`);
  }
}
