import { BadRequestException, Injectable } from '@nestjs/common';
import { nowIso } from '../common/time';
import { newId } from '../common/ids';
import { UsersRepo, UserItem } from './users.repo';

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepo) {}

  async create(input: { username: string; email: string; passwordHash: string }) {
    const existing = await this.repo.getByEmail(input.email);
    if (existing) throw new BadRequestException('Email already in use');

    const id = newId('u_');
    const user: UserItem = {
      PK: `USER#${id}`,
      SK: 'PROFILE',
      entityType: 'USER',
      id,
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      createdAt: nowIso(),
    };

    await this.repo.putUser(user);
    return user;
  }

  findByEmail(email: string) {
    return this.repo.getByEmail(email);
  }

  findById(userId: string) {
    return this.repo.getById(userId);
  }

  async publicUser(userId: string) {
    const u = await this.findById(userId);
    if (!u) return null;
    return { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt };
  }
}
