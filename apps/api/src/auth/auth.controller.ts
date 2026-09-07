import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { CurrentUser } from './current-user.decorator';

interface LoginBody {
  username?: string;
  password?: string;
  code?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBody, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, token, ttlMs } = await this.auth.login(
      body.username ?? '',
      body.password ?? '',
      body.code,
      req.ip,
      req.headers['user-agent'],
    );
    res.cookie('rafnas_sess', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: ttlMs });
    return this.auth.publicUser(user);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(@Req() req: Request & { cookies: Record<string, string> }, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies['rafnas_sess']);
    res.clearCookie('rafnas_sess', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: User) {
    return this.auth.publicUser(user);
  }

  @Post('change-password')
  @UseGuards(SessionGuard)
  changePassword(@CurrentUser() user: User, @Body() body: { newPassword?: string }) {
    return this.auth.changePassword(user, body.newPassword ?? '');
  }

  @Post('2fa/enroll')
  @UseGuards(SessionGuard)
  enroll(@CurrentUser() user: User) {
    return this.auth.enroll2fa(user);
  }

  @Post('2fa/verify')
  @UseGuards(SessionGuard)
  verify2fa(@CurrentUser() user: User, @Body() body: { code?: string }) {
    return this.auth.verify2fa(user, body.code ?? '');
  }

  @Post('2fa/disable')
  @UseGuards(SessionGuard)
  disable2fa(@CurrentUser() user: User) {
    return this.auth.disable2fa(user);
  }
}
