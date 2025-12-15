# Quick Start Guide

## Setup

1. Install dependencies:
```bash
cd apps/lambda
pnpm install
```

## Building Lambda Functions

Build all functions:
```bash
pnpm build
```

Build a specific function:
```bash
pnpm build:hello
pnpm build:user
```

Builds are output to `.build/<function-name>/index.mjs`

## Testing Locally with LocalStack

### Start LocalStack

```bash
pnpm localstack:start
```

This starts LocalStack with DynamoDB, Lambda, S3, API Gateway, and other AWS services.

### Run Tests

Run unit tests (mocked):
```bash
pnpm test
```

Run integration tests with LocalStack:
```bash
pnpm test:localstack
```

### Stop LocalStack

```bash
pnpm localstack:stop
```

## Deploying to AWS

### Prerequisites

1. AWS CLI configured with credentials
2. IAM role ARN for Lambda execution (update in `deploy-config.json`)

### Deploy

Deploy a specific function:
```bash
pnpm deploy:hello
pnpm deploy:user
```

Or use the general deploy command:
```bash
pnpm deploy hello
pnpm deploy user
```

### Configuration

Edit `deploy-config.json` to configure:
- Function names
- IAM role ARN
- Memory size
- Timeout
- Environment variables

Example:
```json
{
  "hello": {
    "functionName": "guandan-hello",
    "handler": "index.handler",
    "runtime": "nodejs20.x",
    "role": "arn:aws:iam::123456789012:role/lambda-execution-role",
    "timeout": 30,
    "memorySize": 256,
    "environment": {
      "LOG_LEVEL": "INFO",
      "POWERTOOLS_SERVICE_NAME": "hello-lambda"
    }
  }
}
```

## Adding a New Lambda Function

1. Create a new directory: `src/functions/<function-name>/`
2. Create `index.ts` with your handler:

```typescript
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { createResponse } from '../../shared/utils.js';

const logger = new Logger({ serviceName: 'my-lambda' });
const tracer = new Tracer({ serviceName: 'my-lambda' });
const metrics = new Metrics({ namespace: 'GuanDanOS', serviceName: 'my-lambda' });

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing request', { requestId: context.requestId });
  
  // Your logic here
  
  return createResponse(200, { message: 'Success' });
};
```

3. Add build script to `package.json`:
```json
"build:my-function": "tsx scripts/build.ts my-function"
```

4. Add deploy script to `package.json`:
```json
"deploy:my-function": "tsx scripts/deploy.ts my-function"
```

5. Add configuration to `deploy-config.json`

6. Build and deploy:
```bash
pnpm build:my-function
pnpm deploy:my-function
```

## AWS PowerTools Features

### Logger

Structured logging with correlation IDs:

```typescript
logger.info('Message', { key: 'value' });
logger.error('Error occurred', { error });
```

### Tracer

X-Ray tracing for performance monitoring:

```typescript
const segment = tracer.getSegment();
const subsegment = segment?.addNewSubsegment('MyOperation');
// ... your code
subsegment?.close();
```

### Metrics

Custom CloudWatch metrics:

```typescript
metrics.addMetric('MetricName', MetricUnit.Count, 1);
metrics.publishStoredMetrics();
```

## Project Structure

```
apps/lambda/
├── src/
│   ├── functions/         # Lambda function handlers
│   │   ├── hello/        # Example hello function
│   │   └── user/         # Example user management function
│   └── shared/           # Shared utilities and types
├── scripts/
│   ├── build.ts          # Build script
│   └── deploy.ts         # Deployment script
├── tests/                # Test files
│   ├── setup.localstack.ts
│   └── functions/
├── .build/               # Build output (gitignored)
├── package.json
├── tsconfig.json
├── docker-compose.yml    # LocalStack configuration
└── deploy-config.json    # Deployment configuration
```

## Troubleshooting

### Build Errors

- Make sure all dependencies are installed: `pnpm install`
- Check TypeScript errors: `pnpm tsc --noEmit`

### LocalStack Connection Issues

- Ensure Docker is running
- Check LocalStack status: `docker compose ps`
- View logs: `docker compose logs localstack`

### Deployment Errors

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM role exists and has correct permissions
- Ensure region is set: `export AWS_REGION=us-east-1`
