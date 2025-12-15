# Design Document: Guandan Game Platform Architecture

**Change ID**: `build-guandan-game-platform`  
**Last Updated**: 2025-12-13  

## Overview

This document captures architectural decisions, system design, and technical trade-offs for the 掼蛋 (Guandan) online game platform. It serves as the authoritative reference for understanding **why** certain approaches were chosen.

---

## System Architecture

### High-Level Components

```
┌───────────────────────────────────────────────────────────────┐
│                        Client Layer                           │
│  ┌─────────────────────┐    ┌─────────────────────┐          │
│  │   Web Application   │    │  Mobile Application │          │
│  │   (Next.js 16)      │    │  (Expo/React Native)│          │
│  │                     │    │                     │          │
│  │  - Lobby UI         │    │  - Lobby UI         │          │
│  │  - Room UI          │    │  - Room UI          │          │
│  │  - Game Board UI    │    │  - Game Board UI    │          │
│  │  - WebSocket Client │    │  - WebSocket Client │          │
│  └──────────┬──────────┘    └──────────┬──────────┘          │
└─────────────┼──────────────────────────┼─────────────────────┘
              │                          │
              └──────────┬───────────────┘
                         │ WSS + HTTPS
┌────────────────────────┴───────────────────────────────────────┐
│                     API Gateway Layer                          │
│  ┌────────────────────┐         ┌────────────────────┐        │
│  │  WebSocket API     │         │  REST API          │        │
│  │  (Connection Mgmt) │         │  (HTTP Endpoints)  │        │
│  └─────────┬──────────┘         └─────────┬──────────┘        │
└────────────┼──────────────────────────────┼────────────────────┘
             │                              │
             ↓                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Lambda Functions (Compute)                 │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐│
│  │  Game Engine     │  │  Room Manager    │  │  AI Engine    ││
│  │  (TypeScript)    │  │  (TypeScript)    │  │  (Python)     ││
│  │                  │  │                  │  │               ││
│  │  - Card Validator│  │  - Lifecycle FSM │  │  - Decision   ││
│  │  - Rule Engine   │  │  - Seat Allocate │  │  - Evaluation ││
│  │  - State Machine │  │  - Player Join   │  │  - Priority   ││
│  │  - Tribute Logic │  │  - AI Auto-fill  │  │  - Difficulty ││
│  └──────────────────┘  └──────────────────┘  └───────────────┘│
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐│
│  │  WebSocket       │  │  User Service    │  │  Stats/Rank   ││
│  │  Handlers (TS)   │  │  (TypeScript)    │  │  (TypeScript) ││
│  │                  │  │                  │  │               ││
│  │  - Connect       │  │  - Auth          │  │  - Leaderboard││
│  │  - Disconnect    │  │  - Profile       │  │  - History    ││
│  │  - Broadcast     │  │  - Session       │  │  - Analytics  ││
│  └──────────────────┘  └──────────────────┘  └───────────────┘│
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Persistence Layer (DynamoDB)               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Players    │  │  Rooms      │  │  Games      │           │
│  │  Table      │  │  Table      │  │  Table      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Rankings   │  │  Sessions   │  │  Events     │           │
│  │  Table      │  │  Table      │  │  Table      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Serverless Architecture (AWS Lambda)

**Decision**: Use AWS Lambda for all backend compute

**Rationale**:
- **Auto-scaling**: Handles variable load (10 rooms or 1000 rooms) automatically
- **Cost-efficiency**: Pay only for execution time, no idle server costs
- **Operational simplicity**: No server management, patching, or monitoring
- **Geographic distribution**: Lambda@Edge for low latency globally (future)

**Trade-offs**:
- ❌ **Cold start latency**: 500ms-2s for first request (mitigated with provisioned concurrency)
- ❌ **State management**: Stateless functions require external storage (DynamoDB)
- ❌ **Debugging complexity**: Harder to debug than monolith (solved with structured logging)
- ✅ **Massive scalability**: Can handle 10,000+ concurrent games without planning
- ✅ **Cost at scale**: Much cheaper than EC2 for variable workloads

**Mitigations**:
- Use **provisioned concurrency** (5-10 instances) for game-critical Lambdas
- Implement **connection pooling** for DynamoDB to reuse clients
- Add **structured logging** (JSON) with correlation IDs for tracing

**Alternatives Considered**:
- **EC2 + Node.js server**: More control, but requires capacity planning and 24/7 ops
- **ECS/Fargate containers**: Good middle ground, but adds complexity for this use case
- **Monolithic server on Heroku**: Simplest for MVP, but doesn't scale well

---

### 2. WebSocket for Real-Time Sync

**Decision**: Use API Gateway WebSocket + Lambda for game state synchronization

**Rationale**:
- **Real-time requirement**: Card games need <200ms sync, REST polling is too slow
- **Bidirectional**: Server can push state changes to clients instantly
- **Stateful connections**: Maintains connection for game duration (~5-10 min)
- **Standard protocol**: Works on all browsers and React Native

**Trade-offs**:
- ❌ **Connection management**: Need to track connection IDs in DynamoDB
- ❌ **Scaling complexity**: WebSocket connections are stateful, harder to scale
- ❌ **Error handling**: Need reconnection logic and state reconciliation
- ✅ **Low latency**: Sub-200ms updates vs 1-5s with polling
- ✅ **Efficient**: No polling waste, only send updates when state changes

**Mitigations**:
- Store **connection IDs** in DynamoDB with TTL (1 hour)
- Implement **exponential backoff** reconnection (1s, 2s, 4s, max 30s)
- Send **full state snapshot** on reconnection to handle dropped messages
- Use **heartbeat pings** (every 30s) to detect dead connections

**Alternatives Considered**:
- **REST polling (1s interval)**: Too slow for real-time gameplay
- **Server-Sent Events (SSE)**: One-way only, need separate HTTP for client→server
- **Socket.io**: Adds library dependency, API Gateway WS is sufficient

---

### 3. DynamoDB for Persistence

**Decision**: Use DynamoDB (NoSQL) for all data storage

**Rationale**:
- **Serverless integration**: Native Lambda integration, no connection pooling needed
- **Scalability**: Auto-scales with traffic, handles millions of requests
- **Single-digit ms latency**: Fast reads/writes for game state
- **Pay-per-use**: Cost-effective for variable load

**Trade-offs**:
- ❌ **No complex queries**: Can't do SQL joins or aggregations (solved with GSIs)
- ❌ **Schema design critical**: Hard to change partition keys after launch
- ❌ **Eventual consistency**: Default reads are eventually consistent (use strong reads for critical data)
- ✅ **Massive scale**: Proven to handle millions of concurrent users
- ✅ **Predictable performance**: Consistent sub-10ms latency

**Schema Design**:

#### Players Table
```
PK: USER#<userId>
SK: PROFILE
Attributes: { nickname, avatar, level, coins, stats }
GSI1PK: RANKING#<rank>
GSI1SK: SCORE#<score>
```

#### Rooms Table
```
PK: ROOM#<roomId>
SK: METADATA
Attributes: { state, hostId, seats, config, createdAt }
GSI1PK: STATE#<state>
GSI1SK: CREATED#<timestamp>
```

#### Games Table
```
PK: GAME#<gameId>
SK: STATE
Attributes: { roomId, players, deck, hands, history, ranks }
TTL: expiresAt (30 days)
```

**Alternatives Considered**:
- **PostgreSQL (RDS)**: Better for complex queries, but requires connection pooling and capacity planning
- **MongoDB (Atlas)**: Flexible schema, but adds external dependency
- **Redis**: Fast but in-memory only, not durable for game history

---

### 4. Monorepo with Turborepo

**Decision**: Use pnpm + Turborepo monorepo for all code

**Rationale**:
- **Code sharing**: Share types, utils, and validation logic between web, mobile, and backend
- **Atomic changes**: Change API contract in one commit across all projects
- **Build caching**: Turborepo caches builds, speeds up CI/CD
- **Simplified deps**: One `pnpm install` for entire workspace

**Trade-offs**:
- ❌ **Initial setup complexity**: Need to configure workspaces, Turborepo, paths
- ❌ **Slower CI on full rebuild**: Building everything takes longer than single app
- ✅ **Type safety**: TypeScript types shared across frontend and backend
- ✅ **DRY**: No duplicated validation logic between client and server

**Structure**:
```
guan_dan_os/
├── apps/
│   ├── web/                # Next.js web app
│   ├── mobile/             # Expo mobile app
│   ├── lambda_ts/          # TypeScript Lambda functions
│   └── lambda_py/          # Python Lambda functions (AI)
├── packages/
│   ├── shared/             # Shared types, utils, constants
│   └── game-engine/        # Core game logic (used by lambda_ts and clients)
└── turbo.json
```

**Alternatives Considered**:
- **Separate repos**: Simpler but causes type drift and duplication
- **Yarn workspaces**: pnpm is faster and has better monorepo support
- **Nx**: More features than Turborepo, but overkill for this project

---

### 5. Python for AI, TypeScript for Everything Else

**Decision**: Use Python for AI decision engine, TypeScript for all other backend

**Rationale**:
- **Python strengths**: Better libraries for AI/ML (NumPy, SciPy), easier to prototype complex logic
- **TypeScript strengths**: Better type safety, easier to share with frontend, faster cold starts
- **Separation of concerns**: AI is isolated, doesn't need to share code with other Lambdas

**Trade-offs**:
- ❌ **Two languages**: Need to maintain two toolchains, dependencies
- ❌ **Inter-Lambda calls**: AI Lambda must be called from TypeScript room manager
- ✅ **Best tool for job**: Python excels at decision algorithms, TS excels at API logic
- ✅ **Performance**: Python's NumPy is faster than JS for numerical operations

**Integration**:
```typescript
// TypeScript Lambda calls Python Lambda
const aiDecision = await lambda.invoke({
  FunctionName: 'ai-decision-engine',
  Payload: JSON.stringify({ gameState, difficulty }),
});
```

**Alternatives Considered**:
- **Pure TypeScript**: Would work, but AI logic is harder to express and slower
- **Pure Python**: Could work, but TypeScript is better for API/WebSocket handling

---

### 6. AI Auto-Fill System

**Decision**: Automatically add AI player to empty seat after 10s timeout

**Rationale**:
- **Guarantee 4 players**: Guandan requires exactly 4 players, low traffic would prevent games
- **Instant matchmaking**: Players don't wait indefinitely for others to join
- **Configurable**: 10s is short enough to feel responsive, long enough to let humans join first

**Trade-offs**:
- ❌ **AI quality matters**: Bad AI would ruin experience (mitigated with 6-tier priority system)
- ❌ **False start**: What if 4th player joins at 9.9s? (accept AI, let human replace in future)
- ✅ **Always playable**: Solo player can play with 3 AI immediately
- ✅ **Scalable**: Works at 1 user or 10,000 users

**Algorithm**:
```typescript
// Per-seat countdown (not global)
for (const seat of ['North', 'West', 'East']) {
  if (seat.isEmpty) {
    seat.countdown = 10; // seconds
    seat.timer = setInterval(() => {
      seat.countdown--;
      if (seat.countdown === 0) {
        addAIPlayer(seat);
      }
    }, 1000);
  }
}

// Reset on human join
function onPlayerJoin(seat) {
  clearInterval(seat.timer);
  seat.countdown = 10;
}
```

**Alternatives Considered**:
- **No AI, wait for 4 humans**: Would fail in low-traffic scenarios
- **Global 40s timeout**: Too long, players would leave before game starts
- **AI always fills immediately**: No chance for humans to join, less social

---

### 7. State Machine for Room Lifecycle

**Decision**: Use explicit finite state machine for room lifecycle

**Rationale**:
- **Clarity**: Complex state transitions (6 states) are error-prone without explicit FSM
- **Validation**: Prevent invalid transitions (e.g., CLOSING → PLAYING)
- **Debugging**: Easy to log and visualize state history
- **Testing**: Each transition can be unit tested

**States**:
```typescript
enum RoomState {
  CREATED = 'CREATED',       // Room just created
  WAITING = 'WAITING',       // Accepting players
  STARTING = 'STARTING',     // Countdown to game start
  PLAYING = 'PLAYING',       // Game in progress
  ENDING = 'ENDING',         // Settlement and ranking
  CLOSING = 'CLOSING',       // Cleanup and teardown
}
```

**Transitions**:
```typescript
const allowedTransitions: Record<RoomState, RoomState[]> = {
  CREATED: [WAITING],
  WAITING: [STARTING, CLOSING], // Start or cancel
  STARTING: [PLAYING, WAITING], // Start game or abort
  PLAYING: [ENDING],            // Game ends
  ENDING: [WAITING, CLOSING],   // Play again or close
  CLOSING: [],                  // Terminal state
};
```

**Enforcement**:
```typescript
function transitionState(room: Room, newState: RoomState) {
  if (!allowedTransitions[room.state].includes(newState)) {
    throw new Error(`Invalid transition: ${room.state} → ${newState}`);
  }
  room.state = newState;
  room.stateHistory.push({ state: newState, timestamp: Date.now() });
  logger.info('Room state transition', { roomId: room.id, from: room.state, to: newState });
}
```

**Trade-offs**:
- ❌ **Boilerplate**: More code than simple `room.state = 'playing'`
- ✅ **Correctness**: Prevents bugs from invalid state transitions
- ✅ **Auditability**: Full state history for debugging

**Alternatives Considered**:
- **Implicit state**: Just set `room.state` directly (error-prone)
- **XState library**: Overkill for 6 states, adds dependency

---

### 8. Seat Position System

**Decision**: Use absolute directional positions (N/S/E/W) with player always at South

**Rationale**:
- **Consistent perspective**: Player always sees themselves at bottom (South)
- **Team clarity**: Teammate (North) always at top, opponents (East/West) on sides
- **Cultural standard**: Matches traditional Chinese card game conventions
- **Rotation logic**: Easy to rotate display without changing data model

**Seat Assignment**:
```typescript
type SeatPosition = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

interface Room {
  seats: {
    SOUTH: Player | null;  // Host, always current player's perspective
    NORTH: Player | null;  // Teammate
    EAST: Player | null;   // Opponent 1
    WEST: Player | null;   // Opponent 2
  };
}
```

**Priority**:
1. Host → SOUTH (automatic)
2. First joiner → NORTH (teammate)
3. Second joiner → WEST (opponent)
4. Third joiner → EAST (opponent)

**Rotation Logic**:
```typescript
// Each client sees themselves at SOUTH
function rotateSeats(room: Room, currentPlayerId: string) {
  const players = [SOUTH, EAST, NORTH, WEST].map(pos => room.seats[pos]);
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  return [
    players[(currentIndex + 0) % 4], // SOUTH (me)
    players[(currentIndex + 1) % 4], // EAST
    players[(currentIndex + 2) % 4], // NORTH (teammate)
    players[(currentIndex + 3) % 4], // WEST
  ];
}
```

**Trade-offs**:
- ❌ **Cognitive load**: Developers must understand perspective rotation
- ✅ **UX consistency**: Players never confused about where they are
- ✅ **Team visualization**: Teammate always opposite, clear at a glance

**Alternatives Considered**:
- **Numbered seats (1-4)**: Confusing, no spatial intuition
- **Dynamic rotation in UI only**: Would work, but harder to debug

---

### 9. Card Type Hierarchy

**Decision**: Implement 13 distinct card types with explicit validators

**Rationale**:
- **Rule accuracy**: 掼蛋 has complex rules, explicit types prevent bugs
- **Validation clarity**: Each type has dedicated validator, easy to test
- **Comparison logic**: Type hierarchy (Bomb > Normal) built into comparison

**Hierarchy**:
```typescript
enum CardTypeClass {
  SPECIAL = 'SPECIAL',  // Four Kings (highest)
  BOMB = 'BOMB',        // 8+ bomb, Straight Flush, 5-7 bomb, 4 bomb
  COMBO = 'COMBO',      // Triple Pair Straight, Triple Straight, etc.
  BASIC = 'BASIC',      // Three, Pair, Single
}

enum CardType {
  // SPECIAL
  FOUR_KINGS = 'FOUR_KINGS',
  
  // BOMB (ordered by strength)
  EIGHT_PLUS_BOMB = 'EIGHT_PLUS_BOMB',
  STRAIGHT_FLUSH = 'STRAIGHT_FLUSH',
  FIVE_TO_SEVEN_BOMB = 'FIVE_TO_SEVEN_BOMB',
  FOUR_BOMB = 'FOUR_BOMB',
  
  // COMBO
  TRIPLE_PAIR_STRAIGHT = 'TRIPLE_PAIR_STRAIGHT',
  TRIPLE_STRAIGHT = 'TRIPLE_STRAIGHT',
  STRAIGHT = 'STRAIGHT',
  THREE_WITH_TWO = 'THREE_WITH_TWO',
  
  // BASIC
  THREE = 'THREE',
  PAIR = 'PAIR',
  SINGLE = 'SINGLE',
}
```

**Validation**:
```typescript
interface CardTypeValidator {
  identify(cards: Card[]): CardType | null;
  compare(a: Card[], b: Card[]): number; // -1, 0, 1
}

// Example: Straight validator
class StraightValidator implements CardTypeValidator {
  identify(cards: Card[]): CardType | null {
    if (cards.length < 5) return null;
    const ranks = cards.map(c => c.rank).sort();
    const isConsecutive = ranks.every((r, i) => i === 0 || r === ranks[i-1] + 1);
    return isConsecutive ? CardType.STRAIGHT : null;
  }
  
  compare(a: Card[], b: Card[]): number {
    return maxRank(a) - maxRank(b);
  }
}
```

**Trade-offs**:
- ❌ **Code volume**: 13 validators = ~1000 lines of code
- ✅ **Correctness**: Each rule is isolated and testable
- ✅ **Maintainability**: Easy to add new types or fix bugs in one place

**Alternatives Considered**:
- **Single giant validator**: Would be 500+ line function, unmaintainable
- **Regex-based matching**: Not expressive enough for card game rules

---

### 10. AI Decision Priority System

**Decision**: Implement 6-tier weighted priority system for AI decisions

**Rationale**:
- **Human-like play**: Pure random is too dumb, pure optimal is too robotic
- **Configurable difficulty**: Adjust weights per tier to tune difficulty
- **Explainable**: Can log which priority tier triggered decision

**Priority Tiers** (highest to lowest):
1. **Kill Shot** (10,000 pts): Can win the round immediately
2. **Max Value** (5,000-9,999 pts): Play that maximizes expected score
3. **Defense** (1,000-4,999 pts): Save big cards when losing
4. **Teamwork** (500-999 pts): Help teammate if possible
5. **Risk Management** (-1,000 to +1,000 pts): Adjust by game state
6. **Special Cases** (varies): 接风, 抗贡, etc.

**Scoring Algorithm**:
```python
def score_play(play: Play, game_state: GameState, difficulty: Difficulty) -> float:
    score = 0.0
    
    # Priority 1: Kill shot
    if can_win_round(play, game_state):
        score += 10000
    
    # Priority 2: Max value
    expected_value = calculate_expected_value(play, game_state)
    score += expected_value * 100
    
    # Priority 3: Defense
    if is_losing_position(game_state):
        score += value_of_cards_saved(play) * 10
    
    # Priority 4: Teamwork
    if helps_teammate(play, game_state):
        score += 500
    
    # Priority 5: Risk
    risk_factor = assess_risk(play, game_state)
    score += risk_factor  # -1000 to +1000
    
    # Priority 6: Special cases
    if is_jiefeng_opportunity(game_state):
        score += 2000
    
    # Difficulty modulation
    if difficulty == Difficulty.SIMPLE:
        score += random.uniform(-2000, 2000)  # High noise
    elif difficulty == Difficulty.NORMAL:
        score += random.uniform(-500, 500)    # Medium noise
    else:  # HARD
        score += random.uniform(-100, 100)    # Low noise
    
    return score
```

**Trade-offs**:
- ❌ **Tuning effort**: Weights need testing to balance difficulty
- ❌ **Compute time**: Evaluating all plays can be slow (mitigated with pruning)
- ✅ **Quality**: Produces intelligent, varied gameplay
- ✅ **Debuggable**: Can see which priority influenced decision

**Alternatives Considered**:
- **Rule-based (if-else tree)**: Brittle, hard to extend
- **Monte Carlo Tree Search**: Too slow for real-time (<3s requirement)
- **Neural network**: Requires training data, overkill for v1

---

## Data Flow Examples

### Example 1: Player Joins Room

```
1. Client sends JOIN_ROOM (WebSocket)
   ↓
2. API Gateway routes to Lambda handler
   ↓
3. Lambda validates room exists and has space
   ↓
4. Lambda assigns seat (priority: N > W > E)
   ↓
5. Lambda updates DynamoDB (Room table)
   ↓
6. Lambda broadcasts PLAYER_JOINED to all connections in room
   ↓
7. All clients update UI with new player
```

### Example 2: AI Auto-Fill

```
1. Room created with 1 human (SOUTH)
   ↓
2. NORTH seat empty → start 10s timer
   ↓
3. Timer expires (no human joined)
   ↓
4. Lambda generates AI player (random attrs)
   ↓
5. Lambda assigns AI to NORTH seat
   ↓
6. Lambda updates DynamoDB (Room table)
   ↓
7. Lambda broadcasts AI_JOINED event
   ↓
8. Repeat for WEST and EAST if still empty
   ↓
9. All 4 seats filled → transition to STARTING
```

### Example 3: Card Play

```
1. Player selects cards and clicks "Play"
   ↓
2. Client sends CARD_PLAYED (WebSocket)
   ↓
3. Lambda validates play is legal
   ↓
4. Lambda updates game state (remove cards from hand)
   ↓
5. Lambda checks if round ended (all others passed)
   ↓
6. Lambda determines next player
   ↓
7. Lambda updates DynamoDB (Games table)
   ↓
8. Lambda broadcasts CARD_PLAYED + TURN_CHANGED
   ↓
9. All clients update UI (cards fly to center, next player highlighted)
   ↓
10. If next player is AI, Lambda invokes AI decision engine
   ↓
11. AI returns play in 1-3s
   ↓
12. Loop back to step 3
```

---

## Security Considerations

### 1. **Authentication** (Phase 2+)
- Start with **anonymous sessions** (session tokens in DynamoDB)
- Add **OAuth** later (Google, Apple, WeChat)
- Never trust client-provided `userId`, always validate session token

### 2. **Authorization**
- Players can only join rooms they have access to (public or invited)
- Players can only play cards from their own hand (validate in Lambda)
- Spectators (future) have read-only access

### 3. **Input Validation**
- Validate all WebSocket messages against JSON schema
- Reject invalid card plays (client could be compromised)
- Rate limit WebSocket messages (10 per second per connection)

### 4. **Cheating Prevention**
- **Card shuffle**: Use `crypto.randomBytes()`, not `Math.random()`
- **Hand hiding**: Never send other players' hands to client
- **Server authority**: All game logic runs on server, client is just display
- **Replay detection**: Track play history, detect impossible plays

### 5. **DDoS Protection**
- API Gateway throttling (1000 req/s per IP)
- Lambda concurrency limits (prevent runaway costs)
- WebSocket connection limits (100 per IP)

---

## Performance Optimization

### 1. **Lambda Cold Starts**
- Use **provisioned concurrency** (5-10 instances) for:
  - WebSocket handler (always active)
  - Game engine (frequent calls)
- Use **on-demand** for:
  - AI engine (less frequent, can tolerate 1-2s delay)
  - Stats/rankings (infrequent)

### 2. **DynamoDB Query Patterns**
- Use **single-table design** to minimize cross-table joins
- Use **GSIs** for secondary access patterns (e.g., "get rooms by state")
- Use **batch operations** for multi-item reads/writes
- Enable **DynamoDB Accelerator (DAX)** for hot reads (optional)

### 3. **WebSocket Optimization**
- **Batch events**: Send multiple events in one message when possible
- **Compress payloads**: Use gzip for game state snapshots (>1KB)
- **Debounce broadcasts**: If 3 players pass in 1s, send 1 update not 3

### 4. **Frontend Performance**
- **Code splitting**: Lazy load game board until needed
- **Image optimization**: Use Next.js Image component for avatars
- **Virtual scrolling**: Use FlatList (RN) for long room lists
- **Memoization**: Use `React.memo` for card components (54 cards × 4 players)

---

## Monitoring & Observability

### Metrics to Track
- **WebSocket latency** (p50, p95, p99)
- **Lambda duration** (per function)
- **DynamoDB read/write capacity**
- **AI decision time** (p50, p95, p99)
- **Game completion rate** (started vs finished)
- **Error rate** (by error type)

### Logging Strategy
- **Structured JSON logs** with correlation IDs
- **Log levels**: ERROR (always), WARN (production), INFO (debug), DEBUG (local only)
- **Sensitive data**: Never log hands, cards, or user IDs in plain text

### Alerts
- **Critical**: WebSocket latency > 500ms, error rate > 5%
- **Warning**: Cold start rate > 20%, DynamoDB throttling

---

## Future Enhancements

### Phase 2 (Post-MVP)
- **Chat system**: Text chat in rooms
- **Friends system**: Add friends, invite to rooms
- **Tournaments**: Bracket-based competitions
- **Replay system**: Watch past games
- **Achievements**: Badges for milestones

### Phase 3 (Scale)
- **Global leaderboard**: Top 1000 players worldwide
- **Clan system**: Teams with shared stats
- **Custom rooms**: Private tournaments with buy-ins
- **Spectator mode**: Watch live games
- **Mobile push notifications**: "Your turn!"

### Technical Debt to Address
- **Connection pooling**: Reuse DynamoDB connections across Lambda invocations
- **GraphQL API**: Replace REST with GraphQL for flexible queries
- **Event sourcing**: Store all game events for replay and analytics
- **CDN**: Use CloudFront for static assets (card images, avatars)

---

## Appendix

### Technology Choices Summary

| Component | Technology | Reason |
|-----------|-----------|--------|
| Web Frontend | Next.js 16 + TypeScript | SSR, type safety, excellent DX |
| Mobile Frontend | Expo + React Native | Cross-platform, fast iteration |
| Backend Compute | AWS Lambda | Auto-scale, serverless |
| Backend Language | TypeScript + Python | TS for APIs, Python for AI |
| Real-Time | API Gateway WebSocket | Native AWS integration |
| Database | DynamoDB | Serverless, scalable, fast |
| Monorepo | Turborepo + pnpm | Code sharing, build caching |
| Testing | Jest + Vitest + Playwright | Comprehensive coverage |
| CI/CD | GitHub Actions | Free for open source, flexible |

### References
- 掼蛋 Official Rules: `docs/phase_1/guandan_rules_corrected.md`
- Game Flow Spec: `docs/phase_1/guandan_v2.1_spec.md`
- AWS Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- DynamoDB Single-Table Design: https://www.alexdebrie.com/posts/dynamodb-single-table/
