import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { beforeAll, describe, expect, it } from 'vitest';
import { handler } from '../../src/functions/user/index.js';

const LOCALSTACK_ENDPOINT =
  process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';

describe('User Lambda Function with LocalStack', () => {
  const dynamoClient = new DynamoDBClient({
    endpoint: LOCALSTACK_ENDPOINT,
    region: 'us-east-1',
  });

  const createMockContext = (): Context => ({
    requestId: `test-${Date.now()}`,
    functionName: 'user',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:user',
    memoryLimitInMB: '512',
    awsRequestId: `test-${Date.now()}`,
    logGroupName: '/aws/lambda/user',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
    callbackWaitsForEmptyEventLoop: true,
  });

  beforeAll(async () => {
    // Ensure clean state
    try {
      await dynamoClient.send(new DeleteTableCommand({ TableName: 'Users' }));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      // Table might not exist
    }

    // Create table
    await dynamoClient.send(
      new CreateTableCommand({
        TableName: 'Users',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );

    // Wait for table to be active
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('should create a new user', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      path: '/users',
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
      }),
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await handler(event, createMockContext());

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.username).toBe('testuser');
    expect(body.email).toBe('test@example.com');
    expect(body.userId).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });

  it('should retrieve an existing user', async () => {
    // First create a user
    const createEvent: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      path: '/users',
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: JSON.stringify({
        username: 'getuser',
        email: 'get@example.com',
      }),
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const createResult = await handler(createEvent, createMockContext());
    const createdUser = JSON.parse(createResult.body);

    // Now retrieve the user
    const getEvent: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: `/users/${createdUser.userId}`,
      headers: {},
      queryStringParameters: null,
      pathParameters: { userId: createdUser.userId },
      body: null,
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const getResult = await handler(getEvent, createMockContext());

    expect(getResult.statusCode).toBe(200);
    const body = JSON.parse(getResult.body);
    expect(body.userId).toBe(createdUser.userId);
    expect(body.username).toBe('getuser');
    expect(body.email).toBe('get@example.com');
  });

  it('should return 404 for non-existent user', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: '/users/non-existent-id',
      headers: {},
      queryStringParameters: null,
      pathParameters: { userId: 'non-existent-id' },
      body: null,
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await handler(event, createMockContext());

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('User not found');
  });

  it('should return 400 for missing required fields', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'POST',
      path: '/users',
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: JSON.stringify({
        username: 'testuser',
        // missing email
      }),
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const result = await handler(event, createMockContext());

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain('Missing required fields');
  });
});
