export interface ApiGatewayProxyEvent {
  body: string | null;
  headers: Record<string, string>;
  httpMethod: string;
  path: string;
  queryStringParameters: Record<string, string> | null;
  pathParameters: Record<string, string> | null;
}

export interface ApiGatewayProxyResult {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export interface LambdaContext {
  requestId: string;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
}
