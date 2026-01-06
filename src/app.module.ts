import { Module } from '@nestjs/common';
import { DynamoModule } from './dynamo/dynamo.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';

@Module({
  imports: [DynamoModule, UsersModule, AuthModule, PostsModule, LikesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
