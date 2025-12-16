# Game UI Capability

**Capability ID**: `game-ui`  
**Owner**: Frontend Team  
**Status**: New (Added)  

## Overview

The Game UI capability provides a lively, vivid, and high-fidelity user interface for the Web3 Guandan platform, targeting overseas Chinese players. It features a dynamic Chinese-style Mahjong parlor theme with neon lights and golden accents, cartoon "Egg" character avatars, and smooth 60 FPS animations powered by React Native and Skia (on mobile). The interface includes Lobby, Room, Game Board, and Settlement screens with deep Web3 integration.

## ADDED Requirements

### Requirement: Visual Theme & Style

The system SHALL implement a "Chinese Cyberpunk/Festive" visual theme.

**Priority**: P0 (Critical)  
**Category**: Visual Design  
**Platform**: Web + Mobile  

#### Scenario: Dynamic Background
**Given** the user is in the app  
**When** viewing the main background  
**Then** display a dynamic "Chinese Mahjong Parlor" scene  
**And** include neon signs flashing with golden glow  
**And** simulate a "Night Peak (8-11pm)" atmosphere with warm lighting

#### Scenario: Cartoon Egg Avatars
**Given** players are displayed  
**When** rendering avatars  
**Then** use "Cartoon Egg" characters  
**And** characters must have animations (jumping, cheering) based on game events

#### Scenario: Color Palette
**Given** the UI is rendered  
**When** applying global styles  
**Then** use a "Red-Gold Gradient" primary theme  
**And** ensure a festive, celebratory atmosphere

---

### Requirement: Lobby Screen

The system SHALL provide a feature-rich lobby with navigation and social features.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Bottom Navigation
**Given** the user is in the lobby  
**When** viewing the bottom bar  
**Then** display tabs: "Lobby", "Wallet", "DAO Vote", "NFT Market"  
**And** switching tabs must have smooth sliding animations

#### Scenario: Sidebars
**Given** the user is in the lobby  
**When** viewing the screen edges  
**Then** display:
- **Left**: Friends list and Voice Chat (with heartbeat animation on active speakers)
- **Right**: VIP Store, Battle Pass progress, and Gacha Machine (rotating wheel)

#### Scenario: Room List
**Given** multiple rooms exist  
**When** displaying the room list  
**Then** show room cards with:
- Room code
- Host "Egg" avatar
- Player count
- Current rank  
**And** sort by creation time

#### Scenario: Web3 Wallet Connection
**Given** the user is not connected  
**When** clicking the "Connect Wallet" button  
**Then** animate a "Magic Door" transformation for the MetaMask icon  
**And** upon connection, display the user's NFT avatar  
**And** show PLAY token balance with a "rolling egg" counter animation

---

### Requirement: Room Waiting Screen

The system SHALL display the room waiting area with 4-seat layout and countdown timers.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Display 4-seat layout (N/S/E/W)
**Given** a player is in a room  
**When** the room waiting screen loads  
**Then** the UI must show 4 seat positions around a **Round Table**  
**And** each seat must show the player's "Egg" avatar, nickname, level, and coins

#### Scenario: Show empty seat with countdown
**Given** a seat is empty  
**When** rendering the seat  
**Then** display:
- "Waiting..." text
- **Cute Egg-shaped Hourglass** dripping sand
- "Hurry up!" speech bubble bouncing

---

### Requirement: Game Board Screen

The system SHALL provide an interactive game board with high-fidelity animations.

**Priority**: P0 (Critical)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Render 2v2 Round Table
**Given** the game has started  
**When** the game board loads  
**Then** display a 2v2 layout around a central round table  
**And** show the 4 "Egg" avatars in their positions

#### Scenario: Auto-Sorting Hand
**Given** the player has cards  
**When** viewing the hand  
**Then** allow toggling between "Horizontal" and "Vertical" sorting  
**And** automatically arrange cards by Rank or Suit

#### Scenario: Special Card Animations
**Given** a player plays a special combo  
**When** the cards are revealed  
**Then** play the corresponding animation:
- **Rocket/Bomb**: Colorful fireworks explosion with particle effects and "Boom!" sound
- **Straight**: Tornado effect spinning out
- **Straight Flush**: Golden Lotus blooming effect

#### Scenario: Interaction Feedback
**Given** the player interacts with controls  
**When** pressing "Play" or "Pass" buttons  
**Then** the button must show a "Spring/Bounce" animation  
**And** provide haptic feedback (on mobile)

#### Scenario: Countdown Timer
**Given** it is a player's turn  
**When** the timer is running  
**Then** display the **Cute Egg Hourglass**  
**And** show a bouncing "Hurry up!" speech bubble when time is low (< 5s)

---

### Requirement: Settlement Screen

The system SHALL display game results with celebratory animations.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: Winner Celebration
**Given** a player is the winner (Head/First)  
**When** the settlement screen loads  
**Then** the winner's "Egg" avatar must wear a **Crown** and fly into the sky  
**And** display a "Trophy Fountain" with gold coins splashing

#### Scenario: Tribute Animation
**Given** tribute is required  
**When** the tribute phase occurs  
**Then** animate the tribute card as a **Gift Box** rotating towards the winner  
**And** animate the return tribute as **Twinkling Stars** returning

#### Scenario: Level Up
**Given** a team levels up  
**When** displaying progress  
**Then** animate the rank badge changing (e.g., Bronze → Diamond)  
**And** play a celebratory sound effect

---

### Requirement: Web3 Features

The system SHALL integrate Web3 functionality seamlessly.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Web + Mobile  

#### Scenario: NFT Avatar Showcase
**Given** the user has connected a wallet  
**When** viewing the profile or lobby  
**Then** allow selecting an NFT from the wallet as the avatar  
**And** display it with a special frame

#### Scenario: Token Balance
**Given** the user has PLAY tokens  
**When** viewing the balance  
**Then** display the amount with a "Rolling Egg" counter animation

#### Scenario: Fiat On-Ramp
**Given** the user wants to buy coins  
**When** opening the store  
**Then** show "Stripe" and "PayPal" icons with a golden shine effect

---

### Requirement: Mobile-Specific Features

The system SHALL provide optimized mobile interactions using high-performance rendering.

**Priority**: P1 (High)  
**Category**: Functional  
**Platform**: Mobile Only  

#### Scenario: Skia Rendering
**Given** the app is running on mobile  
**When** rendering complex animations (fireworks, particles)  
**Then** use the **Skia** rendering engine  
**And** maintain 60 FPS performance

#### Scenario: Portrait Orientation
**Given** the app is running on mobile  
**When** device orientation changes  
**Then** force portrait mode (no rotation)

#### Scenario: Haptic Feedback
**Given** user performs key actions (play, bomb, win)  
**When** action occurs  
**Then** provide haptic feedback (vibration)

---

### Requirement: Accessibility

The system SHALL be accessible to users with disabilities.

**Priority**: P1 (High)  
**Category**: Accessibility  
**Platform**: Web + Mobile  

#### Scenario: Screen reader support
**Given** a blind user uses screen reader  
**When** navigating the UI  
**Then** all interactive elements must have ARIA labels

#### Scenario: Colorblind-friendly cards
**Given** a colorblind user plays the game  
**When** viewing cards  
**Then** cards must use distinguishable patterns (symbols + colors)

---

## Dependencies

- **Real-Time Sync** (`real-time-sync` capability): For WebSocket events
- **Game Engine** (`game-engine` capability): For card type validation
- **Room Management** (`room-management` capability): For room state
- **Web3 Provider**: For wallet connection and token balance
- **Skia Engine**: For high-performance mobile animations

## Acceptance Criteria

- [ ] Visual theme implemented (Red-Gold, Neon, Mahjong Parlor)
- [ ] "Egg" avatars and animations implemented
- [ ] Lobby includes Web3 wallet, DAO, NFT tabs
- [ ] Game board features 2v2 round table and specific animations (Fireworks, Tornado, Lotus)
- [ ] Settlement screen features Crown, Gift Box, and Fountain animations
- [ ] Mobile app uses Skia for 60 FPS animations
- [ ] Web3 wallet connection works with MetaMask
