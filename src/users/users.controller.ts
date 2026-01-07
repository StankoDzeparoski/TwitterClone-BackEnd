import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return { user: await this.users.publicUser(id) };
  }
}
