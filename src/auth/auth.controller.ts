import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private users: UsersService) {}

  private setCookie(res: Response, token: string) {
    const name = process.env.COOKIE_NAME ?? 'token';
    const secure = (process.env.COOKIE_SECURE ?? 'false') === 'true';

    res.cookie(name, token, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { token } = await this.auth.register(dto.username, dto.email, dto.password);
    this.setCookie(res, token);
    return { ok: true, token };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token } = await this.auth.login(dto.email, dto.password);
    this.setCookie(res, token);
    return { ok: true, token };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const name = process.env.COOKIE_NAME ?? 'token';
    const secure = (process.env.COOKIE_SECURE ?? 'false') === 'true';

    res.cookie(name, '', {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
    });

    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: Request) {
    const userId = (req as any).user.id as string;
    return { user: await this.users.publicUser(userId) };
  }
}
