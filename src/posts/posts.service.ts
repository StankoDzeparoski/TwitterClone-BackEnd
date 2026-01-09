import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { nowIso } from '../common/time';
import { newId } from '../common/ids';
import { encodeCursor } from '../common/pipes/cursor.pipe';
import { PostsRepo, PostItem } from './posts.repo';
import { S3Service } from '../uploads/s3.service';
import { UsersService } from '../users/users.service';

export type PostView = {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  retweetOfId: string | null;
  likeCount: number;

  imageKeys: string[];
  imageUrls: string[]; // ✅ presigned GET urls
};

@Injectable()
export class PostsService {
  constructor(
    private repo: PostsRepo,
    private s3: S3Service,
    private users: UsersService,
  ) {}

  private async toView(p: PostItem): Promise<PostView> {
    const keys = p.imageKeys ?? [];
    const imageUrls = await Promise.all(keys.map((k) => this.s3.presignGet(k)));

    return {
      id: p.id,
      authorId: p.authorId,
      content: p.content,
      createdAt: p.createdAt,
      retweetOfId: p.retweetOfId,
      likeCount: p.likeCount ?? 0,
      imageKeys: keys,
      imageUrls,
    };
  }

  async create(authorId: string, content: string, imageKeyOrKeys?: string | string[]) {
    const createdAt = nowIso();
    const id = newId('p_');

    const safeContent = (content ?? '').trim();

    const rawKeys = Array.isArray(imageKeyOrKeys)
      ? imageKeyOrKeys
      : imageKeyOrKeys
        ? [imageKeyOrKeys]
        : [];

    const imageKeys = rawKeys.map((k) => (k ?? '').trim()).filter(Boolean);

    if (!safeContent && imageKeys.length === 0) {
      throw new BadRequestException('Post must have content or an image');
    }

    const item: PostItem = {
      PK: `POST#${id}`,
      SK: 'META',
      entityType: 'POST',
      id,
      authorId,
      content: safeContent,
      createdAt,
      retweetOfId: null,
      likeCount: 0,
      imageKeys,

      GSI1PK: 'FEED#GLOBAL',
      GSI1SK: `POST#${createdAt}#${id}`,
      GSI2PK: `USER#${authorId}`,
      GSI2SK: `POST#${createdAt}#${id}`,
    };

    await this.repo.putPost(item);
    return this.toView(item);
  }

  async getById(postId: string): Promise<PostView> {
    const p = await this.repo.getPostById(postId);
    if (!p) throw new NotFoundException('Post not found');
    return this.toView(p);
  }


  async feed(limit: number, startKey?: Record<string, any>) {
    const { items, lastKey } = await this.repo.queryFeed(limit, startKey);

    // ✅ presign GET urls for each post in parallel
    const views = await Promise.all(items.map((i) => this.toView(i)));

    return { items: views, nextCursor: encodeCursor(lastKey) };
  }

  async userPosts(userId: string, limit: number, startKey?: Record<string, any>) {
    const { items, lastKey } = await this.repo.queryUserPosts(userId, limit, startKey);

    const views = await Promise.all(items.map((i) => this.toView(i)));

    return { items: views, nextCursor: encodeCursor(lastKey) };
  }

  async retweet(authorId: string, originalPostId: string) {
    const original = await this.repo.getPostById(originalPostId);
    if (!original) throw new NotFoundException('Post not found');

    const existing = await this.repo.findUserRetweet(authorId, originalPostId);
    if (existing) {
      await this.repo.deletePostById(existing.id);

      // ✅ update user record (remove original postId from reposted list)
      await this.users.removeRepostedPost(authorId, originalPostId);

      return { ok: true, reposted: false };
    }

    const createdAt = nowIso();
    const id = newId('p_');

    const item: PostItem = {
      PK: `POST#${id}`,
      SK: 'META',
      entityType: 'POST',
      id,
      authorId,
      content: original.content || '',
      createdAt,
      retweetOfId: originalPostId,
      likeCount: 0,
      imageKeys: original.imageKeys ?? [],

      GSI1PK: 'FEED#GLOBAL',
      GSI1SK: `POST#${createdAt}#${id}`,
      GSI2PK: `USER#${authorId}`,
      GSI2SK: `RT#${originalPostId}#${createdAt}#${id}`,
    };

    await this.repo.putPost(item);

    // ✅ update user record (add original postId)
    await this.users.addRepostedPost(authorId, originalPostId);

    return { ok: true, reposted: true, item: await this.toView(item) };
  }

  // == likes part

  async toggleLike(userId: string, postId: string) {
    // Optional: validate post exists
    const p = await this.repo.getPostById(postId);
    if (!p) throw new NotFoundException('Post not found');

    const res = await this.repo.toggleLike(userId, postId);

    // ✅ update user model list
    if (res.liked) {
      await this.users.addLikedPost(userId, postId);
    } else {
      await this.users.removeLikedPost(userId, postId);
    }

    return res; // { liked: boolean }
  }

}
