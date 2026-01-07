import { Module } from '@nestjs/common';
import { DynamoModule } from '../dynamo/dynamo.module';
import { UsersRepo } from './users.repo';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DynamoModule],
  providers: [UsersRepo, UsersService],
  controllers: [UsersController],
  exports: [UsersService, UsersRepo],
})
export class UsersModule {}
