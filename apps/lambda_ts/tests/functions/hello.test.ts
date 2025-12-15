import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from '../../src/functions/hello/index.js';

describe('Hello Lambda Function', () => {
  it('should return greeting with default name', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: '/hello',
      headers: {},
      queryStringParameters: null,
      pathParameters: null,
      body: null,
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const context: Context = {
      requestId: 'test-request-id',
      functionName: 'hello',
      functionVersion: '1',
      invokedFunctionArn:
        'arn:aws:lambda:us-east-1:123456789012:function:hello',
      memoryLimitInMB: '256',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/hello',
      logStreamName: '2024/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
      callbackWaitsForEmptyEventLoop: true,
    };

    const result = await handler(event, context);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello, World!');
    expect(body.requestId).toBe('test-request-id');
  });

  it('should return greeting with custom name', async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: 'GET',
      path: '/hello',
      headers: {},
      queryStringParameters: { name: 'Alice' },
      pathParameters: null,
      body: null,
      isBase64Encoded: false,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    };

    const context: Context = {
      requestId: 'test-request-id-2',
      functionName: 'hello',
      functionVersion: '1',
      invokedFunctionArn:
        'arn:aws:lambda:us-east-1:123456789012:function:hello',
      memoryLimitInMB: '256',
      awsRequestId: 'test-request-id-2',
      logGroupName: '/aws/lambda/hello',
      logStreamName: '2024/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
      callbackWaitsForEmptyEventLoop: true,
    };

    const result = await handler(event, context);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello, Alice!');
  });
});
