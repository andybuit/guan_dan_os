/**
 * WebSocket $disconnect handler
 * Handles WebSocket disconnections
 */

import {
  createDisconnectedEvent,
  createDisconnectionInfo,
} from '@guan-dan-os/shared';
import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from 'aws-lambda';

/**
 * Handle WebSocket disconnection
 */
export async function handler(
  event: APIGatewayProxyWebsocketEventV2
): Promise<APIGatewayProxyResultV2> {
  console.log('WebSocket $disconnect event:', JSON.stringify(event, null, 2));

  try {
    const connectionId = event.requestContext.connectionId;

    // TODO: Get connection from DynamoDB
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
      console.log('Connection not found:', connectionId);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Connection not found' }),
      };
    }

    const { playerId, roomId } = connection;

    // Create disconnection info (30s grace period)
    const disconnectionInfo = createDisconnectionInfo(playerId, connectionId);

    // TODO: Store disconnection info in DynamoDB
    // await dynamoDB.putItem({
    //   TableName: 'disconnections',
    //   Item: disconnectionInfo,
    // });

    // Create disconnected event
    const disconnectedEvent = createDisconnectedEvent(
      playerId,
      roomId,
      'Client disconnected'
    );

    // TODO: Broadcast disconnected event to room
    // await broadcastToRoom(roomId, disconnectedEvent);

    // TODO: Delete connection from DynamoDB
    // await dynamoDB.deleteItem({
    //   TableName: 'connections',
    //   Key: { connectionId },
    // });

    console.log('Disconnection tracked:', {
      connectionId,
      playerId,
      roomId,
      gracePeriodEndsAt: disconnectionInfo.gracePeriodEndsAt,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error) {
    console.error('Error handling WebSocket disconnection:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to handle disconnection',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
