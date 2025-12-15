# Room Management Capability

**Capability ID**: `room-management`  
**Owner**: Backend Team  
**Status**: New (Added)  

## Overview

The Room Management capability handles the complete lifecycle of game rooms, including creation, player joining, seat allocation, AI auto-fill, and state transitions from CREATED through CLOSING. It ensures rooms always have 4 players and manages the countdown/ready system.

## ADDED Requirements

### Requirement: Room Creation

The system SHALL allow players to create new game rooms with unique identifiers.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Create room with unique ID

**Given** a player requests to create a room  
**When** the system creates the room  
**Then** the room must be assigned a unique 6-digit numeric ID (e.g., 123456)  
**And** the ID must not collide with existing active rooms  
**And** the room state must be CREATED

#### Scenario: Auto-assign creator to South seat

**Given** Player A creates a room  
**When** the room is created  
**Then** Player A must be automatically assigned to the SOUTH seat  
**And** NORTH, EAST, WEST seats must be empty  
**And** Player A is marked as the room host

#### Scenario: Initialize room configuration

**Given** a room is being created  
**When** initializing configuration  
**Then** the room must have:
- Current rank: 2 (starting rank)
- Bet amount: configurable (default 20 coins)
- Max players: 4 (fixed)
- Created timestamp  
**And** the room must transition to WAITING state

---

### Requirement: Seat Allocation System

The system SHALL assign players to seats using absolute directional positions (N/S/E/W) with fixed priority.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Assign first joiner to North (partner)

**Given** a room has host in SOUTH  
**And** NORTH, EAST, WEST seats are empty  
**When** Player B joins the room  
**Then** Player B must be assigned to NORTH seat  
**And** NORTH and SOUTH are teammates

#### Scenario: Assign second joiner to West (opponent)

**Given** a room has players in SOUTH and NORTH  
**And** EAST and WEST seats are empty  
**When** Player C joins the room  
**Then** Player C must be assigned to WEST seat  
**And** WEST and EAST are opponents to SOUTH/NORTH

#### Scenario: Assign third joiner to East (opponent)

**Given** a room has players in SOUTH, NORTH, and WEST  
**And** only EAST seat is empty  
**When** Player D joins the room  
**Then** Player D must be assigned to EAST seat  
**And** all 4 seats are now filled

#### Scenario: Reject fifth player join

**Given** a room has all 4 seats filled  
**When** Player E attempts to join  
**Then** the system must reject the join request  
**And** return error: "Room is full"

#### Scenario: Maintain team structure (N-S vs E-W)

**Given** a room with 4 players assigned  
**When** determining teams  
**Then** Team 1 must be NORTH and SOUTH  
**And** Team 2 must be EAST and WEST  
**And** teams must be clearly marked in room state

---

### Requirement: Player Join Flow

The system SHALL handle players joining rooms via room code with proper validation.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Join room by code

**Given** a room exists with code "123456"  
**And** the room has empty seats  
**When** Player B submits join request with code "123456"  
**Then** the system must validate the code  
**And** assign Player B to the next available seat (priority order)  
**And** broadcast PLAYER_JOINED event to all players in room

#### Scenario: Reject invalid room code

**Given** Player A enters room code "999999"  
**And** no room exists with that code  
**When** attempting to join  
**Then** the system must reject with error: "Room not found"

#### Scenario: Update room state on player join

**Given** a room in WAITING state  
**When** a player joins  
**Then** the room's player count must increment  
**And** the seat's player reference must be set  
**And** the room's updated timestamp must be set  
**And** all connected clients must receive updated room state

---

### Requirement: AI Auto-Fill System

The system SHALL automatically add AI players to empty seats after 10-second timeout.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Start 10s timer when seat becomes empty

**Given** a room is created with host in SOUTH  
**And** NORTH seat is empty  
**When** the room enters WAITING state  
**Then** a 10-second countdown timer must start for NORTH seat  
**And** the timer must be visible to all players

#### Scenario: Reset timer when real player joins

**Given** NORTH seat has 5 seconds remaining on timer  
**When** Player B joins and is assigned to NORTH  
**Then** the NORTH seat timer must be cancelled  
**And** if WEST seat is empty, start 10s timer for WEST  
**And** if EAST seat is empty, start 10s timer for EAST

#### Scenario: AI joins on timeout expiration

**Given** EAST seat has been empty for 10 seconds  
**And** no real player has joined  
**When** the timer expires  
**Then** the system must generate an AI player with:
- Nickname: "AI玩家" + number
- Level: random between 8-18
- Coins: random between 50,000-200,000
- Avatar: random from 6 system avatars
- is_ai: true flag  
**And** assign AI to EAST seat  
**And** broadcast AI_JOINED event

#### Scenario: Prioritize seats for AI (E > W > N)

**Given** multiple seats are empty with expired timers  
**When** adding AI players  
**Then** AI must fill seats in priority order:
1. EAST first (if empty)
2. WEST second (if empty)
3. NORTH third (if empty)  
**And** SOUTH is never filled by AI (always real player/host)

#### Scenario: Mark AI players distinctly

**Given** an AI player joins a room  
**When** broadcasting to clients  
**Then** the AI player must have [AI] tag in display  
**And** AI's ready state must always be true  
**And** AI stats must not count toward leaderboards

---

### Requirement: Room State Machine

The system SHALL enforce a finite state machine for room lifecycle with 6 states.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Transition CREATED → WAITING

**Given** a room is in CREATED state  
**When** the host is assigned to SOUTH seat  
**Then** the room must automatically transition to WAITING state  
**And** start seat timers for empty seats

#### Scenario: Transition WAITING → STARTING

**Given** a room is in WAITING state  
**And** all 4 seats are filled (real players or AI)  
**When** checking transition conditions  
**Then** the room must transition to STARTING state  
**And** start a 10-second countdown to game start  
**And** display "房间已满，10秒后开始游戏"

#### Scenario: Transition STARTING → PLAYING

**Given** a room is in STARTING state  
**And** the 10-second countdown has completed  
**Or** the host clicked "Start Now" button  
**When** starting the game  
**Then** the room must transition to PLAYING state  
**And** deal 27 cards to each of 4 players  
**And** initialize game state (turn order, current rank, etc.)

#### Scenario: Transition PLAYING → ENDING

**Given** a room is in PLAYING state  
**And** all 4 players have been ranked (头游, 二游, 三游, 末游)  
**When** the game concludes  
**Then** the room must transition to ENDING state  
**And** calculate tributes, rank progression, and coin changes

#### Scenario: Transition ENDING → WAITING (play again)

**Given** a room is in ENDING state  
**And** all players clicked "Play Again"  
**When** restarting the game  
**Then** the room must transition back to WAITING state  
**And** reset game state but keep players in same seats  
**And** apply rank progression from previous game

#### Scenario: Transition ENDING → CLOSING (exit)

**Given** a room is in ENDING state  
**And** at least one player clicked "Return to Lobby"  
**Or** 10 seconds elapsed with no action  
**When** closing the room  
**Then** the room must transition to CLOSING state  
**And** save game results to database  
**And** disconnect all players  
**And** remove room from active rooms list

#### Scenario: Prevent invalid state transitions

**Given** a room is in PLAYING state  
**When** attempting to transition directly to WAITING  
**Then** the system must reject the transition  
**And** log error: "Invalid state transition: PLAYING → WAITING"  
**And** maintain current state

---

### Requirement: Ready and Start System

The system SHALL manage player ready states and game start countdown.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: Toggle ready state (human player)

**Given** Player A is in a WAITING room  
**And** Player A is not ready  
**When** Player A clicks "Ready" button  
**Then** Player A's ready state must be set to true  
**And** broadcast PLAYER_READY event to room  
**And** display ready indicator on Player A's seat

#### Scenario: AI always ready

**Given** an AI player joins a room  
**When** checking AI's ready state  
**Then** AI's ready state must always be true  
**And** AI cannot toggle ready state (no button)

#### Scenario: Start countdown when all ready

**Given** a room in WAITING state  
**And** all 4 players (human + AI) are ready  
**When** checking start conditions  
**Then** the room must transition to STARTING  
**And** start 10-second countdown  
**And** display "游戏将在 X 秒后开始"

#### Scenario: Host force start

**Given** a room in STARTING state  
**And** countdown is at 5 seconds  
**When** the host clicks "Start Now"  
**Then** the countdown must be cancelled  
**And** the room must immediately transition to PLAYING  
**And** deal cards and start game

---

### Requirement: Room Visibility and Discovery

The system SHALL allow players to discover and join available rooms.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: List available rooms

**Given** multiple rooms exist in WAITING state  
**When** a player opens the lobby  
**Then** the system must display all rooms that are:
- In WAITING or STARTING state
- Not full (< 4 players)
- Public (not private, for v2)  
**And** show room code, player count, and host name for each

#### Scenario: Filter rooms by state

**Given** a player is browsing rooms  
**When** applying a filter for "Waiting" rooms  
**Then** only rooms in WAITING state must be displayed  
**And** rooms in PLAYING or ENDING must be hidden

#### Scenario: Search room by code

**Given** a player knows a room code "123456"  
**When** entering the code in search  
**Then** the system must find and display that specific room  
**And** allow direct join without browsing

---

### Requirement: Player Disconnection Handling

The system SHALL handle player disconnections gracefully during different room states.

**Priority**: P1 (High)  
**Category**: Functional  

#### Scenario: Disconnect in WAITING (before game starts)

**Given** a room in WAITING state  
**And** Player A disconnects  
**When** detecting disconnection  
**Then** Player A's seat must be marked as empty  
**And** restart 10-second AI timer for that seat  
**And** broadcast PLAYER_LEFT event to room

#### Scenario: Disconnect in PLAYING (30s grace period)

**Given** a room in PLAYING state  
**And** Player A disconnects  
**When** detecting disconnection  
**Then** Player A's seat must be marked as "disconnected"  
**And** start a 30-second grace period  
**And** if Player A reconnects within 30s, resume game  
**And** if 30s expires, auto-pass all future turns

#### Scenario: Replace disconnected player with AI

**Given** Player A has been disconnected for > 30s in PLAYING state  
**When** the grace period expires  
**Then** generate an AI player to take over Player A's seat  
**And** AI assumes Player A's hand and position  
**And** AI plays for remainder of game  
**And** broadcast PLAYER_REPLACED event

---

## Non-Functional Requirements

### Requirement RM-NFR-001: Performance

**Category**: Performance  

#### Scenario: Room creation latency

**Given** a player clicks "Create Room"  
**When** the system creates the room  
**Then** room creation must complete within 500ms (p95)  
**And** return room code to player

#### Scenario: Join room latency

**Given** a player submits join request  
**When** processing the request  
**Then** seat assignment must complete within 300ms (p95)  
**And** broadcast to existing players within 500ms total

#### Scenario: AI generation latency

**Given** a seat timer expires  
**When** generating an AI player  
**Then** AI generation must complete within 1 second (p99)  
**And** not block other room operations

---

### Requirement RM-NFR-002: Reliability

**Category**: Reliability  

#### Scenario: Handle concurrent joins

**Given** two players attempt to join the same seat simultaneously  
**When** processing both requests  
**Then** only the first request must succeed  
**And** the second must receive error: "Seat already taken"  
**And** no seat double-assignment occurs

#### Scenario: Recover from state transition failure

**Given** a room is transitioning WAITING → STARTING  
**And** an error occurs during transition  
**When** the error is caught  
**Then** the room must roll back to WAITING state  
**And** log error with full context  
**And** notify players of failure

---

### Requirement RM-NFR-003: Scalability

**Category**: Scalability  

#### Scenario: Support 100+ concurrent rooms

**Given** 100 active rooms exist  
**When** creating a new room  
**Then** room creation must not degrade in performance  
**And** all timers must continue functioning correctly  
**And** no resource leaks occur

---

## Dependencies

- **Game Engine** (`game-engine` capability): For dealing cards and initializing game state
- **WebSocket System** (`real-time-sync` capability): For broadcasting events
- **AI Engine** (`ai-engine` capability): For generating AI players
- **Shared Types** (`packages/shared`): Room, Player, Seat types

## Acceptance Criteria

- [ ] Rooms can be created with unique 6-digit codes
- [ ] Seat allocation follows strict priority (N > W > E)
- [ ] AI auto-fill triggers after exactly 10s timeout per seat
- [ ] All 6 room states are reachable and validated
- [ ] State machine prevents invalid transitions
- [ ] Players can join/leave rooms without corruption
- [ ] Disconnection handling works in all states
- [ ] Unit test coverage ≥ 70% for room management code
- [ ] Integration tests simulate full room lifecycle
- [ ] Performance: create < 500ms, join < 300ms (p95)

## References

- Game Flow Spec: `/docs/phase_1/guandan_v2.1_spec.md` (Section 3: Room Lifecycle)
- Design Doc: `../design.md` (Section: State Machine for Room Lifecycle)
- Seat System: `/docs/phase_1/guandan_v2.1_spec.md` (Section 1: Seat Allocation)
