import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { PostsRepo } from './posts.repo';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [DynamoModule],
  providers: [PostsRepo, PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
