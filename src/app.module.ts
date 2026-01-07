import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoModule } from './dynamo/dynamo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { DebugModule } from './debug/debug.module';
import { HealthModule } from './health/health.module';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DynamoModule,
    UsersModule,
    AuthModule,
    PostsModule,
    LikesModule,
    CommentsModule,
    FollowsModule,
    UploadsModule,
    DebugModule,
    HealthModule,
  ],
})
export class AppModule {}
