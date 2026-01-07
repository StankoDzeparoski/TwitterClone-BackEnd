import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { LikesRepo } from './likes.repo';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';

@Module({
  imports: [DynamoModule],
  providers: [LikesRepo, LikesService],
  controllers: [LikesController],
})
export class LikesModule {}
