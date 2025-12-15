# Project Context

## Purpose
Build a comprehensive online 掼蛋 (Guandan) card game platform supporting web and mobile clients with real-time multiplayer gameplay, AI opponents, and competitive ranking features. The platform targets both casual players and competitive enthusiasts of this popular Chinese card game.

## Tech Stack
- **Frontend (Web)**: Next.js 16, TypeScript, Tailwind CSS v4, App Router, Turbopack
- **Frontend (Mobile)**: Expo, React Native, TypeScript
- **Shared**: pnpm monorepo with Turborepo, shared utilities package
- **Backend**: AWS Lambda (Python & TypeScript), LocalStack for local dev
- **Real-time**: WebSocket for game state synchronization
- **Data**: DynamoDB (player data, game history, rankings)
- **Deployment**: Serverless architecture on AWS

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, explicit return types for public APIs
- **Naming**: PascalCase for types/components, camelCase for functions/variables, SCREAMING_SNAKE_CASE for constants
- **File naming**: kebab-case for files, index.ts for barrel exports
- **Formatting**: Prettier with 2-space indentation, 80-char line width for code

### Architecture Patterns
- **Monorepo**: Apps in `apps/`, shared packages in `packages/`
- **Backend**: Serverless functions organized by domain (user, game, room)
- **State management**: Local state for UI, WebSocket events for game state
- **Component structure**: Atomic design (atoms, molecules, organisms)
- **API contracts**: Shared TypeScript types between frontend and backend

### Testing Strategy
- **Unit tests**: Jest for business logic, vitest for Lambda functions
- **Integration tests**: LocalStack for AWS service integration
- **E2E tests**: Playwright for critical user flows (web)
- **Mobile tests**: React Native Testing Library
- **Coverage target**: 80% for game logic, 60% for UI components

### Git Workflow
- **Branches**: `main` (production), `develop` (integration), feature branches `feature/[change-id]`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **PRs**: Require 1 approval, passing tests, and OpenSpec validation
- **Releases**: Semantic versioning, automated deployment via CI/CD

## Domain Context

### 掼蛋 Game Rules (Guandan)
A 4-player Chinese card game using 2 decks (108 cards total) played in pairs:
- **Teams**: North-South vs East-West (座位: 南北 vs 东西)
- **Objective**: Be first to finish all 27 cards, advance through ranks (2→3→...→K→A)
- **Key mechanics**: 
  - Trump cards (主牌) and wildcards (逢人配 - red heart trump cards)
  - Tribute system (进贡/还贡) between winners and losers
  - Wind-catching (接风) - partner gets play priority
  - Rank progression: Win as 头游 (1st) to advance 1-3 ranks based on partner's position

### Card Types (牌型)
1. **Bombs/Special**: Four Kings (四王), 8+ same cards, Straight Flush, 5+ same cards, 4 same cards
2. **Combos**: Triple Pair Straight (三连对), Triple Straight (三顺), Straight (顺子), Three-of-a-kind + Pair (三带二)
3. **Basic**: Three-of-a-kind, Pair, Single

### Game Phases
1. **Room Creation**: Host creates room, gets seat assignment (always South/下)
2. **Waiting**: Players join (N/W/E seats), AI fills empty seats after 10s timeout
3. **Starting**: 10s countdown when 4 players ready
4. **Playing**: Turn-based card playing with 30s decision timeout
5. **Ending**: Rank settlement, tribute exchange, rank advancement
6. **Closing**: Save results, return to lobby

### AI System
- **Difficulty levels**: Simple (30% win), Normal (45% win, default), Hard (55% win)
- **Decision engine**: 6-tier priority system (kill shot, max value, defense, teamwork, risk, special)
- **Behavior**: 1-3s think delay, randomized attributes (level 8-18, coins 50k-200k)
- **Limitations**: Marked with [AI] tag, stats don't count toward leaderboards

## Important Constraints
- **Performance**: Game state updates must sync within 200ms across all clients
- **Fairness**: Card shuffling must use cryptographically secure randomness
- **Scalability**: Support 100+ concurrent rooms without degradation
- **Mobile**: UI must work on screens ≥375px width (iPhone SE)
- **Offline**: Handle network interruptions gracefully with reconnection (30s timeout)
- **Accessibility**: Colorblind-friendly card designs, screen reader support
- **Compliance**: GDPR-compliant data handling, age verification (13+)

## External Dependencies
- **AWS Services**: Lambda, DynamoDB, API Gateway, S3 (assets), CloudWatch (logs)
- **LocalStack**: Local AWS emulation for development
- **WebSocket**: For real-time game state synchronization
- **Analytics**: Optional integration for gameplay metrics
- **Social**: Future OAuth integration (WeChat, Google, Apple)
