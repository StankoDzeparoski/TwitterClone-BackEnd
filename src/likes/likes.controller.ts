import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(private likes: LikesService) {}

  @Post(':postId')
  @UseGuards(JwtAuthGuard)
  toggle(@Req() req: any, @Param('postId') postId: string) {
    return this.likes.toggle(req.user.id, postId);
  }
}
