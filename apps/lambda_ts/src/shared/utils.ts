import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const createResponse = (
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

export const parseBody = <T>(event: APIGatewayProxyEvent): T | null => {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body) as T;
  } catch (error) {
    return null;
  }
};
