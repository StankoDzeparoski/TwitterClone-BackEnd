import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamoModule } from './dynamo/dynamo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { DebugModule } from './debug/debug.module';
import { HealthModule } from './health/health.module';
import { CommentsModule } from './comments/comments.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DynamoModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    UploadsModule,
    DebugModule,
    HealthModule,
  ],
})
export class AppModule {}
