import { Injectable } from '@nestjs/common';
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../dynamo/dynamo.service';
import { nowIso } from '../common/time';

@Injectable()
export class LikesRepo {
  constructor(private db: DynamoService) {}

  private likeKey(postId: string, userId: string) {
    return { PK: `POST#${postId}`, SK: `LIKE#USER#${userId}` };
  }

  async toggle(userId: string, postId: string) {
    const key = this.likeKey(postId, userId);

    const existing = await this.db.doc.send(
      new GetCommand({ TableName: this.db.tableName, Key: key }),
    );

    if (existing.Item) {
      await this.db.doc.send(new DeleteCommand({ TableName: this.db.tableName, Key: key }));

      // Best-effort decrement
      await this.db.doc.send(
        new UpdateCommand({
          TableName: this.db.tableName,
          Key: { PK: `POST#${postId}`, SK: 'META' },
          UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :z) - :one',
          ExpressionAttributeValues: { ':one': 1, ':z': 0 },
        }),
      );

      return { liked: false };
    }

    await this.db.doc.send(
      new PutCommand({
        TableName: this.db.tableName,
        Item: {
          ...key,
          entityType: 'LIKE',
          postId,
          userId,
          createdAt: nowIso(),
        },
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );

    await this.db.doc.send(
      new UpdateCommand({
        TableName: this.db.tableName,
        Key: { PK: `POST#${postId}`, SK: 'META' },
        UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :z) + :one',
        ExpressionAttributeValues: { ':one': 1, ':z': 0 },
      }),
    );

    return { liked: true };
  }
}
