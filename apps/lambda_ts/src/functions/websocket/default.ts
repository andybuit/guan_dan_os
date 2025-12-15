/**
 * WebSocket $default handler
 * Handles all WebSocket messages (fallback)
 */

import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';

/**
 * Handle WebSocket message
 */
export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  console.log('WebSocket $default event:', JSON.stringify(event, null, 2));

  try {
    const connectionId = event.requestContext.connectionId;
    const body = parseMessageBody(event);

    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid message body' }),
      };
    }

    const { action, payload } = body;

    // TODO: Get connection from DynamoDB to get playerId and roomId
    // const connection = await dynamoDB.getItem({
    //   TableName: 'connections',
    //   Key: { connectionId },
    // });

    const connection = {
      connectionId,
      playerId: 'test-player',
      roomId: 'test-room',
    };

    if (!connection) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' }),
      };
    }

    // Route message based on action
    switch (action) {
      case 'ping':
        return handlePing(connectionId);

      case 'playCard':
        return handlePlayCard(connection, payload);

      case 'pass':
        return handlePass(connection);

      case 'ready':
        return handleReady(connection, payload);

      default:
        console.log('Unknown action:', action);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` }),
        };
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to handle message',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}

/**
 * Parse message body
 */
function parseMessageBody(
  event: APIGatewayProxyWebsocketEventV2
): { action: string; payload?: any } | null {
  try {
    if (!event.body) {
      return null;
    }

    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

/**
 * Handle ping (heartbeat)
 */
async function handlePing(
  connectionId: string
): Promise<APIGatewayProxyResultV2> {
  console.log('Ping received from:', connectionId);

  // TODO: Update connection lastActivityAt in DynamoDB
  // await dynamoDB.updateItem({
  //   TableName: 'connections',
  //   Key: { connectionId },
  //   UpdateExpression: 'SET lastActivityAt = :now',
  //   ExpressionAttributeValues: { ':now': Date.now() },
  // });

  // TODO: Send pong response
  // await sendToConnection(connectionId, { type: 'pong', timestamp: Date.now() });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'pong' }),
  };
}

/**
 * Handle play card action
 */
async function handlePlayCard(
  connection: { connectionId: string; playerId: string; roomId: string },
  payload: any
): Promise<APIGatewayProxyResultV2> {
  console.log('Play card:', connection.playerId, payload);

  // TODO: Validate play
  // TODO: Update game state
  // TODO: Broadcast CARD_PLAYED event to room

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Card played' }),
  };
}

/**
 * Handle pass action
 */
async function handlePass(connection: {
  connectionId: string;
  playerId: string;
  roomId: string;
}): Promise<APIGatewayProxyResultV2> {
  console.log('Player passed:', connection.playerId);

  // TODO: Update game state
  // TODO: Broadcast PLAYER_PASSED event to room

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Passed' }),
  };
}

/**
 * Handle ready action
 */
async function handleReady(
  connection: { connectionId: string; playerId: string; roomId: string },
  payload: any
): Promise<APIGatewayProxyResultV2> {
  console.log('Player ready:', connection.playerId, payload);

  // TODO: Update room state
  // TODO: Broadcast PLAYER_READY event to room
  // TODO: Check if all players ready, start game

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Ready status updated' }),
  };
}
