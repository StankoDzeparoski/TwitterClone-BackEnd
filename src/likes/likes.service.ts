import { Injectable } from '@nestjs/common';
import { LikesRepo } from './likes.repo';

@Injectable()
export class LikesService {
  constructor(private repo: LikesRepo) {}
  toggle(userId: string, postId: string) {
    return this.repo.toggle(userId, postId);
  }
}
