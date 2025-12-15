import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { createResponse, parseBody } from '../../shared/utils.js';

const logger = new Logger({ serviceName: 'user-lambda' });
const tracer = new Tracer({ serviceName: 'user-lambda' });
const metrics = new Metrics({
  namespace: 'GuanDanOS',
  serviceName: 'user-lambda',
});

// Initialize DynamoDB client
const dynamoClient = tracer.captureAWSv3Client(
  new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.LOCALSTACK_ENDPOINT && {
      endpoint: process.env.LOCALSTACK_ENDPOINT,
    }),
  })
);

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.USERS_TABLE_NAME || 'Users';

interface User {
  userId: string;
  username: string;
  email: string;
  createdAt?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('UserHandler');

  try {
    logger.info('Processing user request', {
      requestId: context.requestId,
      httpMethod: event.httpMethod,
      path: event.path,
    });

    const method = event.httpMethod;

    if (method === 'POST') {
      // Create user
      const body = parseBody<User>(event);

      if (!body || !body.username || !body.email) {
        return createResponse(400, {
          error: 'Missing required fields: username, email',
        });
      }

      const user: User = {
        userId: crypto.randomUUID(),
        username: body.username,
        email: body.email,
        createdAt: new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: user,
        })
      );

      logger.info('User created', { userId: user.userId });
      metrics.addMetric('UserCreated', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      subsegment?.close();

      return createResponse(201, user);
    } else if (method === 'GET') {
      // Get user
      const userId = event.pathParameters?.userId;

      if (!userId) {
        return createResponse(400, { error: 'Missing userId parameter' });
      }

      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { userId },
        })
      );

      if (!result.Item) {
        logger.warn('User not found', { userId });
        metrics.addMetric('UserNotFound', MetricUnit.Count, 1);
        metrics.publishStoredMetrics();

        subsegment?.close();

        return createResponse(404, { error: 'User not found' });
      }

      logger.info('User retrieved', { userId });
      metrics.addMetric('UserRetrieved', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();

      subsegment?.close();

      return createResponse(200, result.Item);
    }

    subsegment?.close();

    return createResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    logger.error('Error processing request', { error });
    metrics.addMetric('UserErrors', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    subsegment?.close();

    return createResponse(500, {
      error: 'Internal server error',
      requestId: context.requestId,
    });
  }
};
