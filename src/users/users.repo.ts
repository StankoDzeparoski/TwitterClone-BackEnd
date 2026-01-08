import { Injectable } from '@nestjs/common';
import { GetCommand, PutCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../dynamo/dynamo.service';

export type UserItem = {
  PK: string;
  SK: 'PROFILE';
  entityType: 'USER';
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;

  likedPostIds: string[];
  repostedPostIds: string[];
  usersFollowingIds?: Set<string> | string[];
  userFollowersIds?: Set<string> | string[];
};

@Injectable()
export class UsersRepo {
  constructor(private db: DynamoService) {}

  private userKey(userId: string) {
    return { PK: `USER#${userId}`, SK: 'PROFILE' as const };
  }

  private emailKey(email: string) {
    return { PK: `EMAIL#${email.toLowerCase()}`, SK: 'USER' as const };
  }

  async getById(userId: string): Promise<UserItem | null> {
    const res = await this.db.doc.send(
      new GetCommand({ TableName: this.db.tableName, Key: this.userKey(userId) }),
    );
    return (res.Item as UserItem) ?? null;
  }

  async getByEmail(email: string): Promise<UserItem | null> {
    const lookup = await this.db.doc.send(
      new GetCommand({ TableName: this.db.tableName, Key: this.emailKey(email) }),
    );
    const userId = (lookup.Item as any)?.userId;
    if (!userId) return null;
    return this.getById(userId);
  }

  async putUser(user: UserItem) {
    // Create the user item
    await this.db.doc.send(
      new PutCommand({
        TableName: this.db.tableName,
        Item: user,
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );

    // Email lookup item enforces uniqueness by key
    await this.db.doc.send(
      new PutCommand({
        TableName: this.db.tableName,
        Item: {
          ...this.emailKey(user.email),
          entityType: 'EMAIL_LOOKUP',
          userId: user.id,
          createdAt: user.createdAt,
        },
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );
  }

  // ---------- helpers ----------
  private async getListIndex(userId: string, attr: 'likedPostIds' | 'repostedPostIds', postId: string) {
    const u = await this.getById(userId);
    const list = (u?.[attr] ?? []) as string[];
    return list.indexOf(postId); // -1 if not found
  }

  async addToUserListOnce(
    userId: string,
    attr: 'likedPostIds' | 'repostedPostIds',
    postId: string,
  ) {
    // Add only if not already present (atomic with condition)
    await this.db.doc.send(
      new UpdateCommand({
        TableName: this.db.tableName,
        Key: this.userKey(userId),
        UpdateExpression: `SET ${attr} = list_append(if_not_exists(${attr}, :empty), :one)`,
        ConditionExpression: `attribute_not_exists(${attr}) OR NOT contains(${attr}, :pid)`,
        ExpressionAttributeValues: {
          ':empty': [],
          ':one': [postId],
          ':pid': postId,
        },
      }),
    );
  }

  async removeFromUserListIfPresent(
    userId: string,
    attr: 'likedPostIds' | 'repostedPostIds',
    postId: string,
  ) {
    const idx = await this.getListIndex(userId, attr, postId);
    if (idx === -1) return;

    await this.db.doc.send(
      new UpdateCommand({
        TableName: this.db.tableName,
        Key: this.userKey(userId),
        UpdateExpression: `REMOVE ${attr}[${idx}]`,
      }),
    );
  }

  // follow logic

  private normalizeStringSet(value: any): string[] {
    if (!value) return [];
    if (value instanceof Set) return Array.from(value);
    if (Array.isArray(value)) return value;
    return [];
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const me = await this.getById(followerId);
    if (!me) return false;
    const following = this.normalizeStringSet(me.usersFollowingIds);
    return following.includes(followeeId);
  }

  async follow(followerId: string, followeeId: string) {
    // Atomic: add to follower's following set + add to followee's followers set
    await this.db.doc.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.db.tableName,
              Key: this.userKey(followerId),
              UpdateExpression: 'ADD usersFollowingIds :s',
              ExpressionAttributeValues: {
                ':s': new Set([followeeId]),
              },
            },
          },
          {
            Update: {
              TableName: this.db.tableName,
              Key: this.userKey(followeeId),
              UpdateExpression: 'ADD userFollowersIds :s',
              ExpressionAttributeValues: {
                ':s': new Set([followerId]),
              },
            },
          },
        ],
      }),
    );
  }

  async unfollow(followerId: string, followeeId: string) {
    // Atomic: remove from both sets
    await this.db.doc.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.db.tableName,
              Key: this.userKey(followerId),
              UpdateExpression: 'DELETE usersFollowingIds :s',
              ExpressionAttributeValues: {
                ':s': new Set([followeeId]),
              },
            },
          },
          {
            Update: {
              TableName: this.db.tableName,
              Key: this.userKey(followeeId),
              UpdateExpression: 'DELETE userFollowersIds :s',
              ExpressionAttributeValues: {
                ':s': new Set([followerId]),
              },
            },
          },
        ],
      }),
    );
  }


}
