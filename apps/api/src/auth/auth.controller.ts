import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { CurrentUser } from './current-user.decorator';

interface LoginBody {
  username?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginBody,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token, ttlMs } = await this.auth.login(
      body.username ?? '',
      body.password ?? '',
      req.ip,
      req.headers['user-agent'],
    );
    res.cookie('rafnas_sess', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: ttlMs,
    });
    return this.auth.publicUser(user);
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(
    @Req() req: Request & { cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.cookies['rafnas_sess']);
    res.clearCookie('rafnas_sess', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: User) {
    return this.auth.publicUser(user);
  }
}
