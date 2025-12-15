# Quick Start Guide - Python Lambda Functions

## Setup

### 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# Or on macOS: brew install uv
# Or on Windows: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Setup Project

```bash
cd apps/lambda_py
npm run setup  # Creates venv and installs all dependencies
```

Or manually:
```bash
uv venv              # Create virtual environment
uv sync --dev        # Install all dependencies
```

## Building Lambda Functions

Build all functions:
```bash
npm run build
```

Build a specific function:
```bash
npm run build:hello
npm run build:user
```

Builds are output to `.build/<function-name>/`

## Testing

### Unit Tests

Run unit tests with moto (mocked AWS services):
```bash
npm run test
```

Run with coverage:
```bash
npm run test:cov
```

### Integration Tests with LocalStack

Start LocalStack:
```bash
npm run localstack:start
```

Run integration tests:
```bash
npm run test:localstack
```

Stop LocalStack:
```bash
npm run localstack:stop
```

## Code Quality

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

## Deploying to AWS

### Prerequisites

1. AWS CLI configured with credentials
2. IAM role ARN for Lambda execution (update in `deploy-config.json`)

### Deploy

Deploy a specific function:
```bash
npm run deploy:hello
npm run deploy:user
```

Or use the Python script directly:
```bash
python scripts/deploy.py hello
python scripts/deploy.py user
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
    "functionName": "guandan-hello-py",
    "handler": "functions.hello.handler.handler",
    "runtime": "python3.13",
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

## Why uv?

This project uses [uv](https://docs.astral.sh/uv/) for Python package management:

- ⚡ **10-100x faster** than pip for dependency resolution and installation
- 🔒 **Deterministic builds** with `uv.lock` for reproducible deployments
- 🎯 **Simplified workflow** - no need to manually activate venv with `uv run`
- 📦 **Better caching** - faster CI/CD and local builds
- 🔄 **Compatible** - works with existing `pyproject.toml` and pip workflows

## Adding a New Lambda Function

1. Create a new directory: `functions/<function-name>/`
2. Create `handler.py` with your handler:

```python
from typing import Any, Dict
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext
from shared.utils import create_response

logger = Logger(service="my-lambda")
tracer = Tracer(service="my-lambda")
metrics = Metrics(namespace="GuanDanOS", service="my-lambda")

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    logger.info("Processing request")
    
    # Your logic here
    
    return create_response(200, {"message": "Success"})
```

3. Create `__init__.py` in the function directory
4. (Optional) Add `requirements.txt` for function-specific dependencies
5. Add build script to `package.json`:
```json
"build:my-function": "python scripts/build.py my-function"
```

6. Add deploy script to `package.json`:
```json
"deploy:my-function": "python scripts/deploy.py my-function"
```

7. Add configuration to `deploy-config.json`
8. Build and deploy:
```bash
npm run build:my-function
npm run deploy:my-function
```

## AWS PowerTools Features

### Logger

Structured logging with correlation IDs:

```python
logger.info("Message", extra={"key": "value"})
logger.error("Error occurred", extra={"error": str(e)})
```

### Tracer

X-Ray tracing for performance monitoring:

```python
@tracer.capture_method
def my_method():
    # Your code
    pass
```

### Metrics

Custom CloudWatch metrics:

```python
from aws_lambda_powertools.metrics import MetricUnit

metrics.add_metric(name="MetricName", unit=MetricUnit.Count, value=1)
```

### Event Handler

API Gateway event parsing:

```python
from aws_lambda_powertools.event_handler import APIGatewayRestResolver

app = APIGatewayRestResolver()

@app.get("/hello")
def hello():
    return {"message": "Hello"}

def handler(event, context):
    return app.resolve(event, context)
```

## Project Structure

```
apps/lambda_py/
├── functions/             # Lambda function handlers
│   ├── hello/            # Example hello function
│   │   ├── handler.py
│   │   └── __init__.py
│   └── user/             # Example user management function
│       ├── handler.py
│       └── __init__.py
├── shared/               # Shared utilities and types
│   ├── utils.py
│   └── __init__.py
├── scripts/
│   ├── build.py          # Build script
│   └── deploy.py         # Deployment script
├── tests/                # Test files
│   ├── conftest.py       # Shared fixtures
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests (LocalStack)
├── .build/               # Build output (gitignored)
├── .venv/                # Virtual environment (gitignored)
├── package.json          # NPM scripts for Turborepo
├── pyproject.toml        # Python project config
├── requirements.txt      # Runtime dependencies
├── requirements-dev.txt  # Development dependencies
├── docker-compose.yml    # LocalStack configuration
└── deploy-config.json    # Deployment configuration
```

## Development Workflow

1. Sync dependencies (if pyproject.toml changed): `npm run sync:dev`
2. Make changes to function code
3. Run tests: `npm run test`
4. Lint code: `npm run lint:fix`
5. Type check: `npm run type-check`
6. Build: `npm run build:function-name`
7. Test with LocalStack: `npm run localstack:start && npm run test:localstack`
8. Deploy: `npm run deploy:function-name`

**Note:** With uv, you don't need to manually activate the virtual environment for npm scripts - `uv run` handles it automatically!

## Troubleshooting

### Build Errors

- Sync dependencies: `npm run sync:dev`
- Check uv installation: `uv --version`
- Check Python version: `python --version` (should be 3.13+)
- Rebuild lock file if needed: `uv lock`

### Test Failures

- Check if dev dependencies are installed: `uv sync --dev`
- Verify moto is installed: `uv pip list | grep moto`
- For LocalStack tests, ensure Docker is running
- Verify LocalStack is up: `docker compose ps`

### Deployment Errors

- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM role exists and has correct permissions
- Ensure region is set: `export AWS_REGION=us-east-1`
- Check build exists: `ls .build/<function-name>/`

### Import Errors

- Make sure you're in the project root when running commands
- Verify PYTHONPATH includes the project root
- Check that all `__init__.py` files exist
