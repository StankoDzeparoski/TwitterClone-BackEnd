import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { PostsRepo } from './posts.repo';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [DynamoModule, UploadsModule],
  providers: [PostsRepo, PostsService],
  controllers: [PostsController],
  exports: [PostsRepo, PostsService],
})
export class PostsModule {}
