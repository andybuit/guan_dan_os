# Lambda Functions (Python)

AWS Lambda functions built with Python 3.13, AWS PowerTools, and tested with LocalStack.

## Structure

```
functions/
  hello/          - Example hello world Lambda
  user/           - Example user management Lambda
shared/           - Shared utilities and types
```

## Development

### Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) - Fast Python package installer
- Docker (for LocalStack)
- AWS CLI (for deployment)

### Setup

Install dependencies with uv:

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup project (creates venv and installs deps)
npm run setup

# Or manually:
uv venv
uv sync --dev
```

### Build Functions

Build all functions:
```bash
npm run build
```

Build a specific function:
```bash
npm run build:hello
npm run build:user
```

### Testing

Run unit tests:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:cov
```

### Testing with LocalStack

Start LocalStack:
```bash
npm run localstack:start
```

Run integration tests against LocalStack:
```bash
npm run test:localstack
```

Stop LocalStack:
```bash
npm run localstack:stop
```

### Code Quality

Lint code:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

Type checking:
```bash
npm run type-check
```

### Deploy to AWS

Deploy all functions:
```bash
npm run deploy
```

Deploy a specific function:
```bash
npm run deploy:hello
npm run deploy:user
```

## Adding a New Lambda Function

1. Create a new directory under `functions/<function-name>/`
2. Add `handler.py` with your handler
3. Add `requirements.txt` if you need function-specific dependencies
4. Add build script in `package.json`: `"build:<name>": "python scripts/build.py <name>"`
5. Add deploy script in `package.json`: `"deploy:<name>": "python scripts/deploy.py <name>"`
6. Build and deploy!

## AWS PowerTools

This project uses AWS Lambda PowerTools for:
- **Logger**: Structured logging with correlation IDs
- **Tracer**: X-Ray tracing
- **Metrics**: Custom CloudWatch metrics
- **Event Handler**: API Gateway event parsing
- **Parameters**: SSM/Secrets Manager integration

See the example functions for usage patterns.
