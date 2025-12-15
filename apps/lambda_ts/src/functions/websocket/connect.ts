/**
 * WebSocket $connect handler
 * Handles new WebSocket connections
 */

import {
  createConnection,
  createWSEvent,
  WSEventType,
  type ConnectedPayload,
} from '@guan-dan-os/shared';
import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';

/**
 * Handle WebSocket connection
 */
export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  console.log('WebSocket $connect event:', JSON.stringify(event, null, 2));

  try {
    const connectionId = event.requestContext.connectionId;
    const { playerId, roomId, sessionToken } = parseConnectionQuery(event);

    if (!playerId || !roomId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required query parameters: playerId, roomId',
        }),
      };
    }

    // Create connection record
    const connection = createConnection(connectionId, playerId, roomId);

    // TODO: Store connection in DynamoDB
    // await dynamoDB.putItem({
    //   TableName: 'connections',
    //   Item: connection,
    // });

    console.log('Connection created:', {
      connectionId,
      playerId,
      roomId,
    });

    // Create connected event
    const connectedEvent = createWSEvent<ConnectedPayload>(
      WSEventType.CONNECTED,
      {
        playerId,
        connectionId,
        sessionToken: sessionToken || '',
      },
      roomId
    );

    // TODO: Send connected event to client
    // await sendToConnection(connectionId, connectedEvent);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    console.error('Error handling WebSocket connection:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to establish connection',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

/**
 * Parse connection query parameters
 */
function parseConnectionQuery(event: APIGatewayProxyWebsocketEventV2): {
  playerId?: string;
  roomId?: string;
  sessionToken?: string;
} {
  const queryParams = event.queryStringParameters || {};

  return {
    playerId: queryParams.playerId,
    roomId: queryParams.roomId,
    sessionToken: queryParams.sessionToken,
  };
}
