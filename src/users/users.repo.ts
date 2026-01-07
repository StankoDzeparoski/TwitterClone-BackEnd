import { Injectable } from '@nestjs/common';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
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
}
