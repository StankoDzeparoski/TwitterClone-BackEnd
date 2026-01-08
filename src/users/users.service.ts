import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

      likedPostIds: [],
      repostedPostIds: [],
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

  addLikedPost(userId: string, postId: string) {
    return this.repo.addToUserListOnce(userId, 'likedPostIds', postId);
  }
  removeLikedPost(userId: string, postId: string) {
    return this.repo.removeFromUserListIfPresent(userId, 'likedPostIds', postId);
  }

  addRepostedPost(userId: string, postId: string) {
    return this.repo.addToUserListOnce(userId, 'repostedPostIds', postId);
  }
  removeRepostedPost(userId: string, postId: string) {
    return this.repo.removeFromUserListIfPresent(userId, 'repostedPostIds', postId);
  }

  // Follow logic
  async toggleFollow(meId: string, targetUserId: string) {
    if (meId === targetUserId) throw new BadRequestException("You can't follow yourself");

    const target = await this.repo.getById(targetUserId);
    if (!target) throw new NotFoundException('User not found');

    const already = await this.repo.isFollowing(meId, targetUserId);
    if (already) {
      await this.repo.unfollow(meId, targetUserId);
      return { ok: true, following: false };
    }

    await this.repo.follow(meId, targetUserId);
    return { ok: true, following: true };
  }

  async followers(userId: string) {
    const u = await this.repo.getById(userId);
    if (!u) throw new NotFoundException('User not found');

    const ids =
      u.userFollowersIds instanceof Set
        ? Array.from(u.userFollowersIds)
        : (u.userFollowersIds ?? []);

    return { items: ids };
  }

  async following(userId: string) {
    const u = await this.repo.getById(userId);
    if (!u) throw new NotFoundException('User not found');

    const ids =
      u.usersFollowingIds instanceof Set
        ? Array.from(u.usersFollowingIds)
        : (u.usersFollowingIds ?? []);

    return { items: ids };
  }

  async publicUser(userId: string) {
    const u = await this.findById(userId);
    if (!u) return null;

    const followers =
      u.userFollowersIds instanceof Set ? Array.from(u.userFollowersIds) : (u.userFollowersIds ?? []);
    const following =
      u.usersFollowingIds instanceof Set ? Array.from(u.usersFollowingIds) : (u.usersFollowingIds ?? []);

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
      likedPostIds: u.likedPostIds ?? [],
      repostedPostIds: u.repostedPostIds ?? [],
      userFollowersIds: followers,
      usersFollowingIds: following,
    };
  }
}
