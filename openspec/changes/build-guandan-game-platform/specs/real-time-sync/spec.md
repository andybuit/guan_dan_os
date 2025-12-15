# Real-Time Sync Capability

**Capability ID**: `real-time-sync`  
**Owner**: Backend Team  
**Status**: New (Added)  

## Overview

The Real-Time Sync capability provides WebSocket-based bidirectional communication for synchronizing game state across all clients in real-time. It handles connection management, event broadcasting, state reconciliation, and ensures sub-200ms latency for gameplay updates.

## ADDED Requirements

### Requirement: WebSocket Connection Management

The system SHALL establish and maintain WebSocket connections for each client.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Establish WebSocket connection

**Given** a player opens the game client  
**When** the client initiates WebSocket connection  
**Then** the system must accept the connection  
**And** generate a unique connection ID  
**And** store connection ID in DynamoDB with TTL (1 hour)  
**And** associate connection ID with player's session token  
**And** send CONNECTION_ESTABLISHED event to client

#### Scenario: Handle connection heartbeat

**Given** an established WebSocket connection  
**When** 30 seconds elapse with no activity  
**Then** the server must send a PING message  
**And** the client must respond with PONG within 10 seconds  
**And** if no PONG received, mark connection as stale

#### Scenario: Graceful disconnection

**Given** a player closes the browser/app  
**When** the WebSocket connection closes  
**Then** the system must detect disconnection  
**And** remove connection ID from active connections  
**And** trigger player disconnect handlers (see room-management)  
**And** clean up connection resources

#### Scenario: Handle multiple connections per user

**Given** Player A has an existing connection from device 1  
**When** Player A connects from device 2  
**Then** the system must close the first connection  
**And** establish the new connection  
**And** send DISCONNECTED event to device 1  
**And** maintain single active connection per player

---

### Requirement: Event Broadcasting System

The system SHALL broadcast game events to all relevant clients in a room.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Broadcast to all players in room

**Given** a room with 4 connected players  
**When** Player A plays a card  
**Then** the system must broadcast CARD_PLAYED event to:
- Player A (confirmation)
- Player B, C, D (notification)  
**And** each message must include event type, payload, and timestamp  
**And** all clients must receive within 200ms (p95)

#### Scenario: Player-specific state filtering

**Given** a GAME_STATE event is being broadcast  
**When** sending to Player A  
**Then** the payload must include Player A's full hand (27 cards)  
**And** only show card counts for Players B, C, D (not actual cards)  
**And** include public state (current play, turn, scores)

#### Scenario: Broadcast player join to room

**Given** Player B joins a room with Player A already present  
**When** Player B is assigned a seat  
**Then** broadcast PLAYER_JOINED to:
- Player A: "Player B joined" with B's profile  
- Player B: Full room state with all players  
**And** update room UI on both clients

#### Scenario: Broadcast AI join to room

**Given** a seat timer expires and AI joins  
**When** AI is assigned to seat  
**Then** broadcast AI_JOINED event with:
- AI player profile (nickname, level, avatar, [AI] tag)
- Updated room state (player count, seat occupancy)  
**And** display "AI玩家X 已加入房间" notification

---

### Requirement: Game Event Types

The system SHALL support a comprehensive set of game event types.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Player lifecycle events

The system SHALL support these player events:
- **PLAYER_JOINED**: Player enters room
- **PLAYER_LEFT**: Player leaves room
- **PLAYER_READY**: Player toggles ready state
- **PLAYER_DISCONNECTED**: Player connection lost
- **PLAYER_RECONNECTED**: Player reconnects
- **AI_JOINED**: AI fills empty seat

Each event must include:
- Event type
- Player ID
- Room ID
- Timestamp
- Relevant payload (e.g., seat position, profile)

#### Scenario: Game state events

The system SHALL support these game events:
- **GAME_STARTING**: 10s countdown begins
- **GAME_STARTED**: Cards dealt, game begins
- **TURN_CHANGED**: Active player changes
- **CARD_PLAYED**: Player plays cards
- **PLAYER_PASSED**: Player passes turn
- **ROUND_END**: All players passed, round over
- **GAME_END**: All players ranked, game over

Each event must include:
- Event type
- Game ID
- Current state snapshot or delta
- Timestamp

#### Scenario: Settlement events

The system SHALL support these settlement events:
- **TRIBUTE_REQUIRED**: 末游 must tribute
- **TRIBUTE_OFFERED**: Card sent to 头游
- **TRIBUTE_RETURNED**: 头游 returns card
- **COUNTER_TRIBUTE**: 抗贡 (2 big jokers)
- **RANK_ADVANCED**: Team levels up
- **GAME_SETTLED**: Final results

Each event must include:
- From/to player IDs
- Cards involved (if applicable)
- Rank changes
- Coin changes

---

### Requirement: State Reconciliation

The system SHALL handle state synchronization and conflict resolution.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Send full state snapshot on connect

**Given** Player A joins an in-progress game (reconnection)  
**When** WebSocket connection is established  
**Then** the server must send full game state:
- Room metadata (ID, players, seats)
- Game state (turn, current play, history)
- Player A's hand (all cards)
- Other players' card counts  
**And** Player A's client must render current game state

#### Scenario: Handle stale client state

**Given** Player A has outdated state (version 10)  
**And** Server state is at version 15  
**When** Player A attempts an action  
**Then** the server must reject with STATE_MISMATCH error  
**And** send updated state snapshot (version 15)  
**And** Player A must reconcile before retrying action

#### Scenario: Optimistic updates with rollback

**Given** Player A plays a card (client-side prediction)  
**When** the server validates and rejects the play  
**Then** Player A's client must:
- Roll back optimistic update
- Restore previous state
- Display error message  
**And** not affect other players' views

---

### Requirement: Reconnection Handling

The system SHALL allow players to reconnect without losing game state.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: Reconnect within 30s grace period

**Given** Player A disconnects during PLAYING state  
**And** less than 30 seconds have elapsed  
**When** Player A reconnects  
**Then** the system must:
- Validate Player A's session token
- Restore Player A to same seat
- Send full game state snapshot
- Resume Player A's turn if it was their turn  
**And** broadcast PLAYER_RECONNECTED to room

#### Scenario: Reconnect after 30s (replaced by AI)

**Given** Player A disconnected > 30s ago  
**And** AI has taken over Player A's seat  
**When** Player A attempts to reconnect  
**Then** the system must reject with error: "Seat taken by AI"  
**And** offer to spectate (future) or return to lobby

#### Scenario: Resume turn on reconnect

**Given** it was Player A's turn when they disconnected  
**And** turn timeout has not expired (< 30s)  
**When** Player A reconnects  
**Then** Player A's turn must resume with:
- Remaining time on turn clock
- Same game state
- Ability to play or pass  
**And** no turn is skipped

---

### Requirement: Error Handling

The system SHALL gracefully handle WebSocket errors and invalid messages.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: Invalid message format

**Given** a client sends malformed JSON  
**When** the server parses the message  
**Then** the server must reject with ERROR event  
**And** error must include: "Invalid message format"  
**And** not crash or disconnect client

#### Scenario: Unauthorized action

**Given** Player A attempts to play out of turn  
**When** the server validates the action  
**Then** the server must reject with ERROR event  
**And** error must include: "Not your turn"  
**And** send current turn information

#### Scenario: Rate limiting

**Given** Player A sends 20 messages in 1 second  
**When** the rate limit (10 msg/s) is exceeded  
**Then** the server must send RATE_LIMITED error  
**And** drop excess messages  
**And** temporarily throttle Player A (5s cooldown)

---

### Requirement: Message Ordering

The system SHALL ensure correct message ordering for game events.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: Sequence number tracking

**Given** multiple events occur in quick succession  
**When** broadcasting events  
**Then** each event must include a sequence number  
**And** sequence numbers must increment monotonically  
**And** clients must detect gaps in sequence

#### Scenario: Out-of-order delivery detection

**Given** Player A receives events: seq 10, seq 12 (missing seq 11)  
**When** processing messages  
**Then** the client must detect missing message  
**And** request retransmission of seq 11  
**Or** request full state snapshot

---

## Non-Functional Requirements

### Requirement RTS-NFR-001: Performance

**Category**: Performance  

#### Scenario: Event broadcast latency

**Given** an event is generated (e.g., CARD_PLAYED)  
**When** broadcasting to all clients in room  
**Then** 95% of clients must receive within 200ms  
**And** 99% must receive within 500ms  
**And** no client should wait > 1 second

#### Scenario: Message throughput

**Given** a busy room with frequent actions  
**When** processing game events  
**Then** the system must handle ≥ 100 events/second per room  
**And** maintain latency guarantees  
**And** not drop messages

#### Scenario: Concurrent connection scaling

**Given** 100 concurrent rooms (400 connections)  
**When** all rooms are active  
**Then** the system must maintain performance:
- Connection acceptance: < 1s
- Event broadcast: < 200ms (p95)
- No connection drops  
**And** scale horizontally if needed

---

### Requirement RTS-NFR-002: Reliability

**Category**: Reliability  

#### Scenario: Handle Lambda cold start

**Given** a WebSocket handler Lambda is cold  
**When** a client connects  
**Then** connection must complete even with 1-2s delay  
**And** send CONNECTING event to client during cold start  
**And** retry if initial connection fails

#### Scenario: Graceful degradation on error

**Given** DynamoDB is temporarily unavailable  
**When** attempting to broadcast event  
**Then** the system must queue events in memory  
**And** retry up to 3 times with exponential backoff  
**And** if all retries fail, notify clients of degraded service  
**And** do not crash WebSocket connections

#### Scenario: Connection cleanup on failure

**Given** a connection handler throws unexpected error  
**When** the error occurs  
**Then** the system must:
- Log error with full context
- Close WebSocket connection gracefully
- Clean up connection ID from DynamoDB
- Remove from room's connection list  
**And** not leak resources

---

### Requirement RTS-NFR-003: Security

**Category**: Security  

#### Scenario: Validate session token on connect

**Given** a client attempts to connect  
**When** processing $connect  
**Then** the system must validate session token  
**And** reject if invalid/expired  
**And** never expose other players' sensitive data (hands, tokens)

#### Scenario: Prevent message injection

**Given** a malicious client crafts fake events  
**When** messages are received  
**Then** the system must validate:
- Event type is allowed
- Payload matches schema
- Sender is authorized (e.g., can only play own cards)  
**And** reject and log suspicious activity

---

## Dependencies

- **API Gateway WebSocket**: AWS WebSocket API for connections
- **Lambda Functions**: Handlers for $connect, $disconnect, $default
- **DynamoDB**: Connection ID storage and game state persistence
- **Room Management** (`room-management` capability): For room state updates
- **Game Engine** (`game-engine` capability): For validating actions

## Acceptance Criteria

- [ ] WebSocket connections establish reliably (> 99% success)
- [ ] Events broadcast to all clients within 200ms (p95)
- [ ] Full game state snapshot sent on connect/reconnect
- [ ] Reconnection works within 30s grace period
- [ ] All 15+ event types are implemented and tested
- [ ] State version tracking prevents conflicts
- [ ] Rate limiting prevents abuse (10 msg/s per client)
- [ ] Error handling is graceful (no crashes)
- [ ] Integration tests cover connect, disconnect, broadcast, reconnect
- [ ] Load testing validates 100 concurrent rooms (400 connections)

## References

- Game Flow Spec: `/docs/phase_1/guandan_v2.1_spec.md` (Section 4: Network Sync)
- Design Doc: `../design.md` (Section: WebSocket for Real-Time Sync)
- AWS WebSocket API: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html
