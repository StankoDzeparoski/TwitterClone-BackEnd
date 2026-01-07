import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';

@Injectable()
export class DynamoService {
  readonly tableName = process.env.DYNAMO_TABLE ?? 'TwitterClone';
  readonly doc: DynamoDBDocumentClient;

  constructor() {
    const region =
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      'eu-north-1';

    // Force Lambda runtime env credentials (includes AWS_SESSION_TOKEN)
    const client = new DynamoDBClient({
      region,
      credentials: fromEnv(),
    });

    this.doc = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
}
