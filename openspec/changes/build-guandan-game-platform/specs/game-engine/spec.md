# Game Engine Capability

**Capability ID**: `game-engine`  
**Owner**: Backend Team  
**Status**: New (Added)  

## Overview

The Game Engine capability provides the core game logic for 掼蛋 (Guandan), including card type validation, play validation, game state management, and settlement calculation. It enforces all official game rules and ensures fair, accurate gameplay.

## ADDED Requirements

### Requirement: Card Deck Management

The system SHALL create, shuffle, and deal cards according to standard 掼蛋 rules.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Create standard deck

**Given** the system needs to initialize a new game  
**When** creating a card deck  
**Then** the deck must contain exactly 108 cards:
- 2 complete decks (52 cards each)
- 4 jokers (2 big, 2 small)
**And** each rank (2-A) must appear 8 times (4 per deck × 2 decks)
**And** each suit (♠♥♣♦) must appear 26 times

#### Scenario: Shuffle deck cryptographically

**Given** a deck of 108 cards  
**When** shuffling the deck  
**Then** the system must use cryptographically secure randomness (crypto.randomBytes or equivalent)
**And** the shuffle must produce a uniform distribution (pass Chi-square test at p<0.05)
**And** the shuffle must be deterministic given a seed (for replay functionality)

#### Scenario: Deal cards to 4 players

**Given** a shuffled deck of 108 cards  
**And** 4 players in the game  
**When** dealing cards  
**Then** each player must receive exactly 27 cards  
**And** all 108 cards must be distributed (no cards left in deck)
**And** no player may see another player's cards

---

### Requirement: Card Type Identification

The system SHALL identify and validate all 13 distinct card types defined in 掼蛋 rules.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Identify Four Kings

**Given** a player plays 4 cards  
**When** the cards are: [Big Joker, Big Joker, Small Joker, Small Joker] (any order)  
**Then** the system must identify the play as "Four Kings" (四王)  
**And** this play must beat any other card type

#### Scenario: Identify 8+ Bomb

**Given** a player plays 8 or more cards  
**When** all cards have the same rank (e.g., eight 3s)  
**Then** the system must identify the play as "8+ Bomb"  
**And** the bomb strength must be calculated by: (card count × 100) + rank value

#### Scenario: Identify Straight Flush

**Given** a player plays 5 cards  
**When** all cards are consecutive ranks (e.g., 7-8-9-10-J)  
**And** all cards are the same suit (e.g., all ♠)  
**Then** the system must identify the play as "Straight Flush" (同花顺)  
**And** the system must compare by highest card rank

#### Scenario: Identify Straight with A as 1

**Given** a player plays 5 cards: [A♠, 2♥, 3♣, 4♦, 5♠]  
**When** validating the play  
**Then** the system must accept this as a valid Straight (顺子)  
**And** the A must be treated as rank 1 (not 14)  
**And** this Straight must be the lowest possible Straight

#### Scenario: Identify Three with Two (specify big/small)

**Given** a player plays 5 cards: [3♠, 3♥, 3♣, A♠, A♥]  
**When** the player declares "big pair" or "small pair"  
**Then** the system must record which pair is declared as high  
**And** comparison with other Three-with-Two must use the declared pair

#### Scenario: Reject invalid card type

**Given** a player plays 4 cards: [3♠, 5♥, 7♣, 9♦] (non-consecutive)  
**When** validating the play  
**Then** the system must reject the play as invalid  
**And** return error message: "Invalid card combination"

---

### Requirement: Wildcard (逢人配) Support

The system SHALL support 逢人配 (wildcard) mechanics where red heart trump cards can substitute for any card.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Determine wildcard for current rank

**Given** the game is at rank 5 (打5)  
**When** determining wildcards  
**Then** the two red heart 5s (5♥) must be designated as wildcards  
**And** these wildcards can substitute for any card except jokers

#### Scenario: Use wildcard in Straight

**Given** the game is at rank 7  
**And** a player holds: [5♠, 6♥, 7♥, 8♣, 9♦]  
**When** the player plays these 5 cards  
**Then** the system must accept 7♥ as a wildcard  
**And** treat the play as a valid Straight (5-6-7-8-9)

#### Scenario: Use wildcard in Bomb

**Given** the game is at rank 3  
**And** a player holds: [8♠, 8♥, 8♣, 3♥] (3♥ is wildcard)  
**When** the player plays these 4 cards  
**Then** the system must accept this as a 4-Bomb of 8s  
**And** the wildcard must substitute for 8♦

#### Scenario: Wildcard cannot replace jokers

**Given** a player has wildcard cards  
**When** attempting to use wildcard as a joker  
**Then** the system must reject this usage  
**And** wildcards can only substitute non-joker cards

---

### Requirement: Card Play Validation

The system SHALL validate whether a play is legal based on game state and previous plays.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: First play of round (any card type)

**Given** a new round has started  
**And** no cards have been played yet  
**When** the current player plays any valid card type  
**Then** the system must accept the play  
**And** set this as the current play to beat

#### Scenario: Follow with same type and higher value

**Given** Player A played a Pair of 3s  
**When** Player B plays a Pair of 5s  
**Then** the system must accept the play (5 > 3)  
**And** Player B's play becomes the new current play

#### Scenario: Reject different card type

**Given** Player A played a Straight (5 cards)  
**When** Player B attempts to play a Pair (2 cards)  
**Then** the system must reject the play  
**And** return error: "Must play same card type or bomb"

#### Scenario: Bomb beats any normal card type

**Given** Player A played a Straight (5-6-7-8-9)  
**When** Player B plays a 4-Bomb (four 3s)  
**Then** the system must accept the play (bomb beats non-bomb)  
**And** Player B wins the round

#### Scenario: Player passes when cannot beat

**Given** Player A played a Pair of Aces  
**And** Player B has no pairs higher than Aces  
**When** Player B chooses to pass  
**Then** the system must record the pass  
**And** move to the next player

---

### Requirement: Game State Management

The system SHALL maintain accurate game state throughout the game lifecycle.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Track turn order

**Given** 4 players: South, East, North, West  
**When** the game starts  
**Then** play order must be: South → East → North → West → South (循环)  
**And** the system must track whose turn it is at all times

#### Scenario: Detect round end (all others passed)

**Given** Player A played a card  
**And** Players B, C, and D all passed  
**When** checking round status  
**Then** the system must detect round ended  
**And** Player A wins the round and plays next  
**And** reset the "current play to beat" to null

#### Scenario: Implement 接风 (wind-catching)

**Given** Player A (South) plays their last card  
**And** Players B, C, D all pass (cannot beat)  
**When** determining next player  
**Then** Player A's partner (North) must get priority to play next  
**And** this is called "接风" (wind-catching)  
**And** the partner can play any card type (new round)

#### Scenario: Handle 30s inactivity timeout

**Given** it is Player A's turn  
**And** 30 seconds have elapsed since turn started  
**When** the timeout expires  
**Then** the system must automatically pass for Player A  
**And** move to the next player  
**And** broadcast PLAYER_AUTO_PASSED event

---

### Requirement: Rank and Settlement System

The system SHALL calculate final rankings and apply tribute/counter-tribute rules.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Determine final rankings

**Given** all 4 players have finished playing  
**And** finish order was: Player A, Player B, Player C, Player D  
**When** calculating rankings  
**Then** rankings must be:
- Player A: 头游 (1st)
- Player B: 二游 (2nd)
- Player C: 三游 (3rd)
- Player D: 末游 (4th/last)

#### Scenario: Calculate tribute (进贡) for double-down

**Given** Team 1 has 头游 (1st) and 二游 (2nd)  
**And** Team 2 has 三游 (3rd) and 末游 (4th) (双下)  
**When** calculating tribute  
**Then** both Team 2 players must tribute their largest non-trump card  
**And** Team 1 players must return a card ≤10

#### Scenario: Detect counter-tribute (抗贡) with 2 big jokers

**Given** Player A (末游) must tribute  
**And** Player A has 2 Big Jokers  
**When** checking for counter-tribute  
**Then** the system must allow Player A to refuse tribute (抗贡)  
**And** the 头游 must play first next game (loses advantage)

#### Scenario: Calculate rank advancement (双下 = +3 ranks)

**Given** Team A achieved 头游 and 二游  
**And** Team B had both players as 末游 (双下)  
**When** calculating rank progression  
**Then** Team A must advance 3 ranks  
**And** Team B must stay at current rank

#### Scenario: Calculate rank advancement (单下 = +2 ranks)

**Given** Team A achieved 头游 and 二游  
**And** Team B had one player as 末游 (单下)  
**When** calculating rank progression  
**Then** Team A must advance 2 ranks

#### Scenario: Calculate rank advancement (no 末游 = +1 rank)

**Given** Team A achieved 头游 and 三游  
**And** Team B achieved 二游 and 末游  
**When** calculating rank progression  
**Then** Team A must advance 1 rank (minimum)

#### Scenario: Special A-rank rules (must have partner non-末游)

**Given** Team A is playing at A rank  
**And** 头游 is from Team A  
**And** 头游's partner is 末游  
**When** checking if A rank is passed  
**Then** the system must mark A rank as NOT passed  
**And** Team A must play A rank again

#### Scenario: A-rank failure penalty (3 failures → back to 2)

**Given** Team A failed A rank 3 times in a row  
**And** each failure had partner as 末游  
**When** applying penalty  
**Then** Team A must drop back to rank 2  
**And** must progress through all ranks again

---

### Requirement: Card Comparison Logic

The system SHALL accurately compare cards and card types to determine winners.

**Priority**: P0 (Critical)  
**Category**: Functional  

#### Scenario: Compare same basic type (Pair vs Pair)

**Given** Player A played Pair of 5s  
**And** Player B played Pair of 7s  
**When** comparing the plays  
**Then** Player B's play must be higher (7 > 5)

#### Scenario: Compare bombs by count first

**Given** Player A played 5-Bomb of 3s  
**And** Player B played 4-Bomb of Aces  
**When** comparing the plays  
**Then** Player A's play must be higher (5 cards > 4 cards)  
**And** rank is irrelevant when counts differ

#### Scenario: Compare bombs by rank when same count

**Given** Player A played 4-Bomb of 5s  
**And** Player B played 4-Bomb of 9s  
**When** comparing the plays  
**Then** Player B's play must be higher (9 > 5)

#### Scenario: Four Kings beats all

**Given** Player A played any bomb (e.g., 8-Bomb of Aces)  
**And** Player B played Four Kings  
**When** comparing the plays  
**Then** Player B's play must be higher (Four Kings is unbeatable)

#### Scenario: Bomb hierarchy (8+ > Straight Flush > 5-7 > 4)

**Given** various bomb types are played  
**When** comparing them  
**Then** the hierarchy must be:
1. 8+ Bomb (highest within class)
2. Straight Flush
3. 5-7 Bomb
4. 4 Bomb (lowest bomb)

---

## Non-Functional Requirements

### Requirement GE-NFR-001: Performance

**Category**: Performance  

#### Scenario: Card validation latency

**Given** a player plays a card  
**When** validating the play  
**Then** validation must complete within 50ms (p95)  
**And** not block other game operations

#### Scenario: State update latency

**Given** a valid play is made  
**When** updating game state  
**Then** state update must complete within 100ms (p95)  
**And** broadcast to all players within 200ms total

---

### Requirement GE-NFR-002: Reliability

**Category**: Reliability  

#### Scenario: Handle concurrent plays

**Given** two players attempt to play simultaneously  
**When** processing the plays  
**Then** the system must accept only the first valid play  
**And** reject the second with error "Not your turn"  
**And** maintain consistent state across all clients

#### Scenario: Recover from validation failure

**Given** card validation throws an unexpected error  
**When** the error occurs  
**Then** the system must log the error with full context  
**And** reject the play with generic error message  
**And** not corrupt game state

---

### Requirement GE-NFR-003: Testability

**Category**: Testability  

#### Scenario: Unit test all card types

**Given** the 13 card type validators  
**When** running unit tests  
**Then** each validator must have at least 5 test cases:
- Valid positive case
- Valid edge case (e.g., A as 1 in Straight)
- Invalid negative case
- Wildcard integration case
- Comparison case

#### Scenario: Integration test full game

**Given** the game engine  
**When** running integration tests  
**Then** the system must simulate a complete game from start to finish  
**And** verify all state transitions are correct  
**And** verify final rankings and tributes are calculated correctly

---

## Dependencies

- **Shared Types** (`packages/shared`): Card, Player, GameState types
- **Cryptographic Library**: For secure shuffle (crypto module)
- **Logging**: Structured logger for debugging complex game states

## Acceptance Criteria

- [ ] All 13 card types can be identified with 100% accuracy
- [ ] Card comparison logic passes 100+ test cases
- [ ] Game state machine handles all valid transitions
- [ ] Tribute/counter-tribute logic matches official rules
- [ ] Rank progression calculator handles all cases including A-rank
- [ ] Unit test coverage ≥ 80% for all game engine code
- [ ] Integration tests simulate 10+ full games without errors
- [ ] Performance: validation < 50ms, state update < 100ms (p95)

## References

- Official Rules: `/docs/phase_1/guandan_rules_corrected.md`
- Game Flow Spec: `/docs/phase_1/guandan_v2.1_spec.md`
- Design Doc: `../design.md` (Section: Card Type Hierarchy)
