import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { PostsRepo } from './posts.repo';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DynamoModule, UploadsModule, UsersModule],
  providers: [PostsRepo, PostsService],
  controllers: [PostsController],
  exports: [PostsRepo, PostsService],
})
export class PostsModule {}
