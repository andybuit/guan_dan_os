# Game UI Capability

**Capability ID**: `game-ui`  
**Owner**: Frontend Team  
**Status**: New (Added)  

## Overview

The Game UI capability provides responsive, accessible user interfaces for web (Next.js) and mobile (React Native) platforms. It includes lobby, room waiting, game board, and settlement screens with real-time updates and touch-friendly interactions.

## ADDED Requirements

### Requirement: Lobby Screen

The system SHALL provide a lobby interface for browsing and joining rooms.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Display available rooms

**Given** multiple rooms exist in WAITING state  
**When** a player opens the lobby  
**Then** the UI must display a list of available rooms showing:
- Room code (6 digits)
- Player count (e.g., "3/4")
- Host nickname
- Current rank being played  
**And** rooms must be sorted by creation time (newest first)

#### Scenario: Create room button

**Given** a player is on the lobby screen  
**When** the player clicks "Create Room"  
**Then** a modal must appear with options:
- Bet amount (default 20 coins)
- Starting rank (default 2)  
**And** submit button creates room and navigates to room waiting page

#### Scenario: Join room by code input

**Given** a player has a room code "123456"  
**When** the player enters the code in "Join Room" input  
**And** presses Enter or "Join" button  
**Then** the system must validate the code  
**And** navigate to room waiting page if valid  
**Or** show error toast "Room not found" if invalid

#### Scenario: Responsive layout

**Given** the lobby is displayed on different devices  
**When** viewing on mobile (375px width)  
**Then** rooms must display in single column with stacked info  
**When** viewing on desktop (1920px width)  
**Then** rooms must display in grid (3 columns) with side-by-side info

---

### Requirement: Room Waiting Screen

The system SHALL display the room waiting area with 4-seat layout and countdown timers.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Display 4-seat layout (N/S/E/W)

**Given** a player is in a room  
**When** the room waiting screen loads  
**Then** the UI must show 4 seat positions:
- SOUTH (bottom): Current player (you)
- NORTH (top): Teammate
- WEST (left): Opponent
- EAST (right): Opponent  
**And** each seat must show player avatar, nickname, level, coins

#### Scenario: Show empty seat with countdown

**Given** EAST seat is empty  
**And** 10-second countdown is active  
**When** rendering EAST seat  
**Then** display:
- "等待玩家中..." text
- Countdown timer: "5秒后AI加入"
- Progress bar showing remaining time  
**And** update every second

#### Scenario: Display AI player with [AI] tag

**Given** an AI player is assigned to NORTH seat  
**When** rendering NORTH seat  
**Then** display:
- 🤖 robot icon
- Nickname: "AI玩家1"
- [AI] tag badge
- Level and coins (虚拟)
- "已准备" ready indicator  
**And** style differently from human players (e.g., gray background)

#### Scenario: Room code copy button

**Given** the room code is "123456"  
**When** displayed in header  
**Then** show code with copy icon button  
**And** clicking copies code to clipboard  
**And** show success toast "已复制房间号"

#### Scenario: Ready toggle button

**Given** the current player is in room (not host)  
**When** ready button is displayed  
**Then** show toggle with states:
- Not ready: "确认准备" (gray)
- Ready: "已准备" (green)  
**And** clicking toggles state and sends PLAYER_READY event

#### Scenario: Host start button

**Given** current player is the host  
**And** all 4 players are ready  
**When** rendering action buttons  
**Then** show "开始游戏" button (enabled)  
**And** clicking immediately starts game (skips countdown)

#### Scenario: Starting countdown display

**Given** room transitioned to STARTING state  
**And** 10-second countdown is active  
**When** rendering countdown  
**Then** show:
- "房间已满，游戏将在 X 秒后开始"
- Large countdown number (10 → 9 → 8 → ...)
- Progress bar  
**And** auto-transition to game when countdown reaches 0

---

### Requirement: Game Board Screen

The system SHALL provide an interactive game board for playing cards.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Render 4-player board layout

**Given** the game has started  
**When** the game board loads  
**Then** display:
- **Center**: Play area (last played cards)
- **Bottom**: Current player's hand (sorted)
- **Top**: North player (card count, avatar)
- **Left**: West player (card count, avatar)
- **Right**: East player (card count, avatar)  
**And** maintain N/S/E/W positions consistently

#### Scenario: Display player hand with card images

**Given** the current player has 27 cards  
**When** rendering the hand  
**Then** display all cards with:
- Clear rank and suit (♠♥♣♦)
- Colorblind-friendly designs
- Sorted by rank (default) or suit (toggle)  
**And** cards must be clickable/tappable

#### Scenario: Multi-select cards for combo

**Given** the current player is selecting cards  
**When** tapping/clicking cards  
**Then** selected cards must:
- Lift up 20px (visual feedback)
- Show selected border (blue glow)
- Stay selected until tapped again (toggle)  
**And** allow selecting multiple cards (up to 27)

#### Scenario: Play button (enabled/disabled)

**Given** the current player has selected 3 cards  
**When** checking play validity  
**Then** if cards form valid type (e.g., Three-of-a-kind):
- Enable "出牌" button (green)  
**Else** if invalid combo:
- Disable "出牌" button (gray)
- Show tooltip: "请选择有效的牌型"

#### Scenario: Pass button

**Given** it is the current player's turn  
**And** the current play is not empty (someone played before)  
**When** "过牌" button is displayed  
**Then** button must be enabled  
**And** clicking sends PLAYER_PASSED event  
**And** move to next player

#### Scenario: Display current play in center

**Given** Player A played 5 cards (Straight: 5-6-7-8-9)  
**When** rendering play area  
**Then** display:
- Player A's avatar
- 5 cards face-up in center
- Label: "Player A 出牌"  
**And** cards must be visible to all players

#### Scenario: Turn indicator and countdown

**Given** it is Player B's turn  
**When** rendering turn status  
**Then** display:
- "Player B 的回合" label
- 30-second countdown timer (29 → 28 → ...)
- Progress bar showing remaining time  
**And** highlight Player B's position (yellow glow)

#### Scenario: AI thinking indicator

**Given** it is AI's turn  
**And** AI is deciding (1-3s delay)  
**When** rendering AI status  
**Then** display:
- "AI正在思考..." text
- Animated thinking icon (dots)  
**And** show for 1-3 seconds before AI plays

#### Scenario: Card play animation

**Given** a player plays cards  
**When** cards are submitted  
**Then** animate:
- Cards fly from hand to center (500ms)
- Fade in effect
- Sound effect (card whoosh)  
**And** remove cards from hand after animation

#### Scenario: Round end notification

**Given** all 3 other players passed  
**And** current player wins the round  
**When** round ends  
**Then** display:
- Toast notification: "你赢了本轮"
- Clear play area
- Highlight current player (can play any card type)

---

### Requirement: Settlement Screen

The system SHALL display game results, rankings, and rank progression.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Display final rankings

**Given** the game has ended  
**And** rankings are determined  
**When** the settlement screen loads  
**Then** display 4 player cards in ranking order:
1. 头游 (1st) - Gold medal 🥇
2. 二游 (2nd) - Silver medal 🥈
3. 三游 (3rd) - Bronze medal 🥉
4. 末游 (4th) - No medal  
**And** show each player's avatar, nickname, final card count (0 or remaining)

#### Scenario: Show coin changes

**Given** rankings are determined  
**When** displaying results  
**Then** show coin changes:
- 头游: +80 coins (green)
- 二游: +40 coins (green)
- 三游: -20 coins (red)
- 末游: -100 coins (red)  
**And** animate coin count changes

#### Scenario: Display tribute flow

**Given** 末游 must tribute to 头游  
**When** rendering tribute section  
**Then** show:
- 末游 → 头游: [Card image] (largest card)
- 头游 → 末游: [Card image] (≤10)  
**And** animate cards moving between players

#### Scenario: Show rank progression

**Given** Team A advanced 2 ranks (双下)  
**When** displaying rank changes  
**Then** show:
- "升级: 3 → 5" (animated level up)
- Fireworks animation
- Congratulations message  
**And** highlight team members

#### Scenario: Mark AI stats as non-leaderboard

**Given** NORTH seat is occupied by AI  
**When** displaying AI in settlement  
**Then** show:
- AI's ranking and coins (虚拟)
- [AI] tag
- Grayed out stats
- Footnote: "AI战绩仅供参考，不计入排行榜"

#### Scenario: Play again and exit buttons

**Given** the settlement screen is displayed  
**When** rendering action buttons  
**Then** show:
- "再来一局" button (primary, green)
- "返回大厅" button (secondary, gray)  
**And** clicking "再来一局" returns to WAITING (keep players)  
**And** clicking "返回大厅" navigates to lobby

---

### Requirement: Mobile-Specific Features

The system SHALL provide optimized mobile interactions.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Mobile Only  

#### Scenario: Portrait orientation lock

**Given** the app is running on mobile  
**When** device orientation changes  
**Then** force portrait mode (no rotation)  
**And** optimize layout for vertical screen

#### Scenario: Touch-friendly card selection

**Given** cards are displayed in hand  
**When** user taps a card  
**Then** card must:
- Respond instantly (< 100ms)
- Have large tap target (≥ 44×44 points)
- Show haptic feedback (vibration)  
**And** work with gloves (large touch areas)

#### Scenario: Swipe to sort hand

**Given** the hand is displayed  
**When** user swipes left on hand area  
**Then** toggle sort mode:
- By rank (default)
- By suit  
**And** animate card rearrangement (300ms)

#### Scenario: Safe area handling

**Given** the app runs on iPhone with notch  
**When** rendering UI  
**Then** respect safe area insets:
- Top: below status bar/notch
- Bottom: above home indicator  
**And** no content obscured by device features

#### Scenario: Haptic feedback on actions

**Given** user performs key actions  
**When** action occurs  
**Then** provide haptic feedback:
- Card select: light impact
- Play cards: medium impact
- Win round: success notification
- Error: error notification

---

### Requirement: Accessibility

The system SHALL be accessible to users with disabilities.

**Priority**: P1 (High)  
**Category**: Accessibility  
**Platform**: Web + Mobile  

#### Scenario: Screen reader support

**Given** a blind user uses screen reader  
**When** navigating the UI  
**Then** all interactive elements must have:
- ARIA labels (e.g., "Play cards button")
- Role attributes (button, link, etc.)
- State announcements (selected, disabled)  
**And** card names must be spoken (e.g., "Ace of Spades")

#### Scenario: Keyboard navigation (web)

**Given** a user navigates with keyboard only  
**When** pressing Tab key  
**Then** focus must move through elements in logical order:
1. Create/Join room buttons
2. Room list items
3. Ready button
4. Cards in hand
5. Play/Pass buttons  
**And** focus indicator must be clearly visible (blue outline)

#### Scenario: Colorblind-friendly cards

**Given** a colorblind user plays the game  
**When** viewing cards  
**Then** cards must use distinguishable patterns:
- ♠ Spades: Black + spade symbol
- ♥ Hearts: Red + heart symbol (plus pattern)
- ♣ Clubs: Black + club symbol (plus pattern)
- ♦ Diamonds: Red + diamond symbol (plus pattern)  
**And** not rely solely on color

#### Scenario: High contrast mode

**Given** a user enables high contrast mode  
**When** viewing the UI  
**Then** increase contrast ratios:
- Text: 7:1 minimum (AAA standard)
- Borders: 3:1 minimum
- Focus indicators: 4.5:1 minimum  
**And** remove decorative gradients

---

### Requirement: Responsive Design

The system SHALL adapt to various screen sizes and resolutions.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Web  

#### Scenario: Mobile breakpoint (375px - 767px)

**Given** viewport width is 375px (iPhone SE)  
**When** rendering UI  
**Then** use mobile layout:
- Single column
- Stacked components
- Full-width cards
- Bottom-sheet modals  
**And** minimum font size 14px

#### Scenario: Tablet breakpoint (768px - 1023px)

**Given** viewport width is 768px (iPad)  
**When** rendering UI  
**Then** use tablet layout:
- Two-column grid
- Side-by-side cards
- Expanded game board
- Larger touch targets

#### Scenario: Desktop breakpoint (1024px+)

**Given** viewport width is 1920px (desktop)  
**When** rendering UI  
**Then** use desktop layout:
- Three-column grid (lobby)
- Wide game board (16:9 aspect)
- Hover states on cards
- Mouse-optimized interactions

---

## Non-Functional Requirements

### Requirement UI-NFR-001: Performance

**Category**: Performance  

#### Scenario: Initial load time

**Given** a user opens the web app  
**When** loading the lobby  
**Then** First Contentful Paint (FCP) must be < 1.5s (p75)  
**And** Largest Contentful Paint (LCP) must be < 2.5s (p75)  
**And** Time to Interactive (TTI) must be < 3.5s (p75)

#### Scenario: Card rendering performance

**Given** 27 cards are rendered in hand  
**When** selecting/deselecting cards  
**Then** UI must respond < 100ms (p95)  
**And** maintain 60fps during animations  
**And** no jank or frame drops

#### Scenario: Mobile app launch time

**Given** a user opens the mobile app  
**When** app launches  
**Then** splash screen must display instantly  
**And** app must be interactive within 2 seconds (cold start)  
**And** within 500ms (warm start)

---

### Requirement UI-NFR-002: Bundle Size

**Category**: Performance  

#### Scenario: Web bundle size

**Given** the web app is built for production  
**When** measuring bundle sizes  
**Then** initial bundle must be < 500KB (gzipped)  
**And** total bundle must be < 2MB  
**And** code-split by route (lobby, room, game)

#### Scenario: Mobile bundle size

**Given** the mobile app is built for production  
**When** measuring app size  
**Then** iOS app must be < 50MB  
**And** Android APK must be < 50MB  
**And** use on-demand assets for card images

---

### Requirement UI-NFR-003: Browser/Device Support

**Category**: Compatibility  

#### Scenario: Web browser support

**Given** the web app is deployed  
**When** testing on browsers  
**Then** must support:
- Chrome 90+ (Chromium)
- Safari 14+ (iOS/macOS)
- Firefox 88+
- Edge 90+  
**And** show unsupported browser warning for older versions

#### Scenario: Mobile OS support

**Given** the mobile app is released  
**When** testing on devices  
**Then** must support:
- iOS 13+ (iPhone 6S and newer)
- Android 8.0+ (API level 26+)  
**And** gracefully degrade features on older OS

---

## Dependencies

- **Real-Time Sync** (`real-time-sync` capability): For WebSocket events
- **Game Engine** (`game-engine` capability): For card type validation
- **Room Management** (`room-management` capability): For room state
- **Design System** (future): Reusable UI components
- **Asset Library**: Card images (54 unique cards), avatars, icons

## Acceptance Criteria

- [ ] All 4 screens implemented (lobby, room, game, settlement)
- [ ] Responsive design works on 375px - 1920px
- [ ] Card selection and play interactions are smooth (60fps)
- [ ] WebSocket events update UI within 200ms
- [ ] AI players are clearly marked with [AI] tag
- [ ] Accessibility: ARIA labels, keyboard nav, colorblind-friendly
- [ ] Mobile: portrait lock, haptics, safe areas
- [ ] Performance: LCP < 2.5s, TTI < 3.5s
- [ ] Bundle size: web < 500KB initial, mobile < 50MB
- [ ] E2E tests cover all user flows (create, join, play, settle)

## References

- Game Flow Spec: `/docs/phase_1/guandan_v2.1_spec.md` (Sections 3.2, 3.3: UI designs)
- Design Doc: `../design.md` (Section: Frontend Performance)
- Next.js Image: https://nextjs.org/docs/api-reference/next/image
- React Native Accessibility: https://reactnative.dev/docs/accessibility
