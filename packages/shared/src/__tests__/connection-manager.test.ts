/**
 * Tests for connection manager utilities
 */

import { describe, expect, it } from 'vitest';
import {
  addConnectionToLookup,
  createConnection,
  createConnectionLookup,
  createDisconnectionInfo,
  DISCONNECT_GRACE_PERIOD_MS,
  getConnectionByPlayerId,
  getConnectionsForRoom,
  getReconnectionStatus,
  hasDisconnectGracePeriodExpired,
  HEARTBEAT_INTERVAL_MS,
  isConnectionExpired,
  isDisconnectionInfoValid,
  needsHeartbeat,
  removeConnectionFromLookup,
} from '../utils/connection-manager';

describe('Connection Manager', () => {
  describe('Connection Creation', () => {
    it('should create connection with correct properties', () => {
      const conn = createConnection('conn1', 'player1', 'room1');

      expect(conn.connectionId).toBe('conn1');
      expect(conn.playerId).toBe('player1');
      expect(conn.roomId).toBe('room1');
      expect(conn.isReconnection).toBe(false);
      expect(conn.previousConnectionId).toBeUndefined();
      expect(conn.connectedAt).toBeGreaterThan(0);
      expect(conn.lastActivityAt).toBeGreaterThan(0);
      expect(conn.expiresAt).toBeGreaterThan(conn.connectedAt);
    });

    it('should mark reconnection when previous connection provided', () => {
      const conn = createConnection('conn2', 'player1', 'room1', 'conn1');

      expect(conn.isReconnection).toBe(true);
      expect(conn.previousConnectionId).toBe('conn1');
    });
  });

  describe('Connection Expiration', () => {
    it('should not be expired when newly created', () => {
      const conn = createConnection('conn1', 'player1', 'room1');

      expect(isConnectionExpired(conn)).toBe(false);
    });

    it('should be expired when expiresAt is in the past', () => {
      const conn = createConnection('conn1', 'player1', 'room1');
      const expiredConn = { ...conn, expiresAt: Date.now() - 1000 };

      expect(isConnectionExpired(expiredConn)).toBe(true);
    });
  });

  describe('Heartbeat Detection', () => {
    it('should not need heartbeat for new connection', () => {
      const conn = createConnection('conn1', 'player1', 'room1');

      expect(needsHeartbeat(conn)).toBe(false);
    });

    it('should need heartbeat after interval', () => {
      const conn = createConnection('conn1', 'player1', 'room1');
      const staleConn = {
        ...conn,
        lastActivityAt: Date.now() - HEARTBEAT_INTERVAL_MS - 1000,
      };

      expect(needsHeartbeat(staleConn)).toBe(true);
    });
  });

  describe('Connection Lookup', () => {
    it('should create empty lookup', () => {
      const lookup = createConnectionLookup();

      expect(lookup.playerToConnection.size).toBe(0);
      expect(lookup.connections.size).toBe(0);
    });

    it('should add connection to lookup', () => {
      let lookup = createConnectionLookup();
      const conn = createConnection('conn1', 'player1', 'room1');

      lookup = addConnectionToLookup(lookup, conn);

      expect(lookup.playerToConnection.get('player1')).toBe('conn1');
      expect(lookup.connections.get('conn1')).toEqual(conn);
    });

    it('should remove connection from lookup', () => {
      let lookup = createConnectionLookup();
      const conn = createConnection('conn1', 'player1', 'room1');

      lookup = addConnectionToLookup(lookup, conn);
      lookup = removeConnectionFromLookup(lookup, 'conn1');

      expect(lookup.playerToConnection.get('player1')).toBeUndefined();
      expect(lookup.connections.get('conn1')).toBeUndefined();
    });

    it('should get connection by player ID', () => {
      let lookup = createConnectionLookup();
      const conn = createConnection('conn1', 'player1', 'room1');

      lookup = addConnectionToLookup(lookup, conn);

      const found = getConnectionByPlayerId(lookup, 'player1');
      expect(found).toEqual(conn);
    });

    it('should get connections for room', () => {
      let lookup = createConnectionLookup();
      const conn1 = createConnection('conn1', 'player1', 'room1');
      const conn2 = createConnection('conn2', 'player2', 'room1');
      const conn3 = createConnection('conn3', 'player3', 'room2');

      lookup = addConnectionToLookup(lookup, conn1);
      lookup = addConnectionToLookup(lookup, conn2);
      lookup = addConnectionToLookup(lookup, conn3);

      const room1Conns = getConnectionsForRoom(lookup, 'room1');

      expect(room1Conns).toHaveLength(2);
      expect(room1Conns.map((c) => c.connectionId)).toContain('conn1');
      expect(room1Conns.map((c) => c.connectionId)).toContain('conn2');
    });
  });

  describe('Disconnection Info', () => {
    it('should create disconnection info', () => {
      const info = createDisconnectionInfo('player1', 'conn1');

      expect(info.playerId).toBe('player1');
      expect(info.previousConnectionId).toBe('conn1');
      expect(info.disconnectedAt).toBeGreaterThan(0);
      expect(info.gracePeriodEndsAt).toBeGreaterThan(info.disconnectedAt);
    });

    it('should be valid within grace period', () => {
      const info = createDisconnectionInfo('player1', 'conn1');

      expect(isDisconnectionInfoValid(info)).toBe(true);
    });

    it('should be invalid after grace period', () => {
      const info = createDisconnectionInfo('player1', 'conn1');
      const expiredInfo = {
        ...info,
        gracePeriodEndsAt: Date.now() - 1000,
      };

      expect(isDisconnectionInfoValid(expiredInfo)).toBe(false);
    });

    it('should calculate grace period expiration', () => {
      const now = Date.now();
      const disconnectedAt = now - 5000; // 5 seconds ago

      expect(hasDisconnectGracePeriodExpired(disconnectedAt)).toBe(false);

      const longAgo = now - DISCONNECT_GRACE_PERIOD_MS - 1000;
      expect(hasDisconnectGracePeriodExpired(longAgo)).toBe(true);
    });
  });

  describe('Reconnection Status', () => {
    it('should allow reconnection within grace period', () => {
      const info = createDisconnectionInfo('player1', 'conn1');
      const status = getReconnectionStatus(info);

      expect(status.canReconnect).toBe(true);
      expect(status.timeRemaining).toBeGreaterThan(0);
      expect(status.wasReplaced).toBe(false);
    });

    it('should not allow reconnection after grace period', () => {
      const info = createDisconnectionInfo('player1', 'conn1');
      const expiredInfo = {
        ...info,
        gracePeriodEndsAt: Date.now() - 1000,
      };

      const status = getReconnectionStatus(expiredInfo);

      expect(status.canReconnect).toBe(false);
      expect(status.timeRemaining).toBe(0);
      expect(status.wasReplaced).toBe(true);
    });

    it('should handle null disconnection info', () => {
      const status = getReconnectionStatus(null);

      expect(status.canReconnect).toBe(false);
      expect(status.timeRemaining).toBe(0);
      expect(status.wasReplaced).toBe(true);
    });
  });
});
