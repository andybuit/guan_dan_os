# Guan Dan OS

A turborepo + pnpm monorepo workspace.

## Structure

```
guan_dan_os/
├── apps/
│   ├── web/           # Next.js 16 app
│   └── mobile/        # Expo app (React Native)
├── packages/
│   └── shared/        # Shared utilities and types
└── docs/
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9.15.0+

### Installation

Dependencies are already installed. To reinstall:

```bash
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

### Build

Build all apps:

```bash
pnpm build
```

### Lint

Lint all packages:

```bash
pnpm lint
```

## Apps

### Web (`apps/web`)

Next.js 16 application with:
- TypeScript
- Tailwind CSS v4
- ESLint
- App Router
- Turbopack

Run: `cd apps/web && pnpm dev`

### Mobile (`apps/mobile`)

Expo application with:
- TypeScript
- React Native

Run: `cd apps/mobile && pnpm start`

## Packages

### Shared (`packages/shared`)

Shared utilities and types used across apps.
