import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return { user: await this.users.publicUser(id) };
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  toggleFollow(@Req() req: any, @Param('id') id: string) {
    return this.users.toggleFollow(req.user.id, id);
  }

  @Get(':id/followers')
  followers(@Param('id') id: string, @Query('limit') _limit?: string) {
    return this.users.followers(id);
  }

  @Get(':id/following')
  following(@Param('id') id: string, @Query('limit') _limit?: string) {
    return this.users.following(id);
  }
}
