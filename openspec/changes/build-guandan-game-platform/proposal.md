# Change: Build Guandan Game Platform

## Why

掼蛋 is an extremely popular card game in China with millions of players, but existing implementations often have inaccurate rule implementations (missing 逢人配, 接风, etc.), poor mobile experience, unreliable AI opponents, and no cross-platform support. This project provides a production-ready, specification-driven platform with accurate game rules, serverless architecture, and native web/mobile support.

## What Changes

- **NEW capability: game-engine** - Core game logic for card validation, play validation, game state management, and settlement calculation
- **NEW capability: room-management** - Room lifecycle, seat allocation, player joining, and AI auto-fill system  
- **NEW capability: real-time-sync** - WebSocket communication for sub-200ms state synchronization
- **NEW capability: game-ui** - Responsive web (Next.js) and mobile (React Native) interfaces
- Implement complete 掼蛋 rules (13 card types, 逢人配, 接风, 进贡/抗贡, rank progression)
- Serverless backend on AWS Lambda with DynamoDB persistence
- AI decision engine with 6-tier priority system (Simple/Normal/Hard difficulty)
- Monorepo structure (Turborepo + pnpm) for code sharing

## Impact

- **Affected specs**: 4 new capabilities (game-engine, room-management, real-time-sync, game-ui)
- **Affected code**: 
  - `apps/web/` - Complete Next.js application (lobby, room, game, settlement)
  - `apps/mobile/` - Complete Expo/React Native application
  - `apps/lambda_ts/` - TypeScript Lambda functions (game engine, room manager, WebSocket handlers)
  - `apps/lambda_py/` - Python Lambda functions (AI decision engine)
  - `packages/shared/` - Shared types, validators, utilities
- **Infrastructure**: AWS Lambda, API Gateway (WebSocket), DynamoDB, LocalStack (local dev)
- **Timeline**: 18 weeks (4.5 months) to production launch
- **Breaking changes**: None (new project)

---

## Additional Context

See the following files for detailed design and implementation planning:
- `design.md` - Technical architecture, key design decisions, data flow examples
- `tasks.md` - Comprehensive implementation checklist (18 weeks, 8 phases)
- `/docs/phase_1/guandan_rules_corrected.md` - Official game rules
- `/docs/phase_1/guandan_v2.1_spec.md` - Detailed game flow and UI design

### Key Features
- **Game Engine**: 13 card types, wildcard support, tribute/counter-tribute, rank progression
- **Room System**: 6-state lifecycle, automatic AI fill (10s timeout), N/S/E/W seat allocation
- **Real-Time**: WebSocket events, sub-200ms sync, reconnection handling
- **AI**: 6-tier decision priority (kill shot, max value, defense, teamwork, risk, special cases)
- **UI**: Responsive design (375px-1920px), accessibility (ARIA, keyboard nav, colorblind-friendly)

### Success Metrics
- Game state sync < 200ms (p95)
- AI decision time < 3s (p99)
- Unit test coverage > 80% (game logic)
- API availability > 99.5%
- AI win rate matches target (30%/45%/55% by difficulty)

### Open Questions
1. Authentication: Start with anonymous sessions or require accounts? → **Anonymous first**
2. Game history retention: How long? → **30 days active, 7 days anonymous**
3. Reconnection timeout: How long to hold player slot? → **30s grace period**
4. Mobile landscape mode: Support or force portrait? → **Force portrait for v1**

### Approval Required
- [ ] Product Owner (confirms requirements)
- [ ] Tech Lead (validates architecture)
- [ ] DevOps (reviews infrastructure)
