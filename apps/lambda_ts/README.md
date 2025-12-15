# Lambda Functions

This package contains AWS Lambda functions built with TypeScript, AWS PowerTools, and tested with LocalStack.

## Structure

```
src/
  functions/
    hello/          - Example hello world Lambda
    user/           - Example user management Lambda
  shared/           - Shared utilities and types
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Build Functions

Build all functions:
```bash
pnpm build
```

Build a specific function:
```bash
pnpm build:hello
pnpm build:user
```

### Testing with LocalStack

Start LocalStack:
```bash
pnpm localstack:start
```

Run tests against LocalStack:
```bash
pnpm test:localstack
```

Stop LocalStack:
```bash
pnpm localstack:stop
```

### Deploy to AWS

Deploy all functions:
```bash
pnpm deploy
```

Deploy a specific function:
```bash
pnpm deploy:hello
pnpm deploy:user
```

## Adding a New Lambda Function

1. Create a new directory under `src/functions/<function-name>`
2. Add `index.ts` with your handler
3. Add build script in `package.json`: `"build:<name>": "tsx scripts/build.ts <name>"`
4. Add deploy script in `package.json`: `"deploy:<name>": "tsx scripts/deploy.ts <name>"`
5. Build and deploy!

## AWS PowerTools

This project uses AWS Lambda PowerTools for:
- **Logger**: Structured logging with correlation IDs
- **Tracer**: X-Ray tracing
- **Metrics**: Custom CloudWatch metrics

See the example functions for usage patterns.
