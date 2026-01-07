import { Injectable } from '@nestjs/common';
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../dynamo/dynamo.service';

export type PostItem = {
  PK: string;
  SK: 'META';
  entityType: 'POST';
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  retweetOfId: string | null;
  likeCount: number;

  // ✅ images stored as private S3 object keys
  imageKeys: string[];

  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
};

@Injectable()
export class PostsRepo {
  constructor(private db: DynamoService) {}

  private postKey(postId: string) {
    return { PK: `POST#${postId}`, SK: 'META' as const };
  }

  async putPost(item: PostItem) {
    await this.db.doc.send(
      new PutCommand({
        TableName: this.db.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      }),
    );
  }

  async deletePostById(postId: string) {
    await this.db.doc.send(
      new DeleteCommand({
        TableName: this.db.tableName,
        Key: this.postKey(postId),
      }),
    );
  }

  async getPostById(postId: string): Promise<PostItem | null> {
    const res = await this.db.doc.send(
      new GetCommand({
        TableName: this.db.tableName,
        Key: this.postKey(postId),
      }),
    );
    return (res.Item as PostItem) ?? null;
  }

  async findUserRetweet(userId: string, originalPostId: string): Promise<PostItem | null> {
    const res = await this.db.doc.send(
      new QueryCommand({
        TableName: this.db.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `RT#${originalPostId}#`,
        },
        Limit: 1,
      }),
    );

    const item = (res.Items?.[0] as PostItem | undefined) ?? null;
    return item;
  }

  async queryFeed(limit: number, startKey?: Record<string, any>) {
    const res = await this.db.doc.send(
      new QueryCommand({
        TableName: this.db.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: { ':pk': 'FEED#GLOBAL' },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
      }),
    );
    return { items: (res.Items as PostItem[]) ?? [], lastKey: res.LastEvaluatedKey };
  }

  async queryUserPosts(userId: string, limit: number, startKey?: Record<string, any>) {
    const res = await this.db.doc.send(
      new QueryCommand({
        TableName: this.db.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk',
        ExpressionAttributeValues: { ':pk': `USER#${userId}` },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
      }),
    );
    return { items: (res.Items as PostItem[]) ?? [], lastKey: res.LastEvaluatedKey };
  }
}
