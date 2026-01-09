import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CursorPipe } from '../common/pipes/cursor.pipe';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private posts: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreatePostDto) {
    //const imageInput = (dto as any).imageKeys?.length ? (dto as any).imageKeys : (dto as any).imageKey;
    const imageInput = dto.imageKeys?.length ? dto.imageKeys : dto.imageKey;
    return this.posts.create(req.user.id, dto.content ?? '', imageInput);
  }

  @Get('feed')
  feed(
    @Query('limit', new ParsePositiveIntPipe()) limit?: number,
    @Query('cursor', new CursorPipe()) cursor?: Record<string, any>,
  ) {
    return this.posts.feed(limit ?? 20, cursor);
  }

  @Get('user/:userId')
  user(
    @Param('userId') userId: string,
    @Query('limit', new ParsePositiveIntPipe()) limit?: number,
    @Query('cursor', new CursorPipe()) cursor?: Record<string, any>,
  ) {
    return this.posts.userPosts(userId, limit ?? 20, cursor);
  }

  @Post(':postId/retweet')
  @UseGuards(JwtAuthGuard)
  retweet(@Req() req: any, @Param('postId') postId: string) {
    return this.posts.retweet(req.user.id, postId);
  }

  // ✅ merged likes: POST /posts/:postId/like
  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  like(@Req() req: any, @Param('postId') postId: string) {
    return this.posts.toggleLike(req.user.id, postId);
  }

  @Get(':postId')
  async getById(@Param('postId') postId: string) {
  return { post: await this.posts.getById(postId) };
}
}
