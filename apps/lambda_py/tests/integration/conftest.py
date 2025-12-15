"""Integration test fixtures for LocalStack."""

import os
import time

import boto3
import pytest


@pytest.fixture(scope="session")
def localstack_endpoint():
    """Get LocalStack endpoint."""
    endpoint = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
    
    # Wait for LocalStack to be ready
    dynamodb = boto3.client(
        "dynamodb",
        endpoint_url=endpoint,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
    
    max_attempts = 30
    for _ in range(max_attempts):
        try:
            dynamodb.list_tables()
            print("✅ LocalStack is ready")
            break
        except Exception:
            time.sleep(1)
    else:
        raise RuntimeError("LocalStack not ready after 30 seconds")
    
    return endpoint


@pytest.fixture(scope="session")
def dynamodb_table_localstack(localstack_endpoint):
    """Create DynamoDB table in LocalStack."""
    dynamodb = boto3.client(
        "dynamodb",
        endpoint_url=localstack_endpoint,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
    
    table_name = "Users"
    
    # Delete table if exists
    try:
        dynamodb.delete_table(TableName=table_name)
        time.sleep(2)
    except dynamodb.exceptions.ResourceNotFoundException:
        pass
    
    # Create table
    dynamodb.create_table(
        TableName=table_name,
        KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "user_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    
    # Wait for table to be active
    time.sleep(2)
    
    print(f"✅ Created {table_name} table in LocalStack")
    
    yield table_name
    
    # Cleanup
    try:
        dynamodb.delete_table(TableName=table_name)
    except Exception:
        pass


@pytest.fixture
def lambda_context_localstack():
    """Create a mock Lambda context for LocalStack tests."""
    
    class MockLambdaContext:
        def __init__(self):
            self.function_name = "test-function-localstack"
            self.function_version = "$LATEST"
            self.invoked_function_arn = (
                "arn:aws:lambda:us-east-1:123456789012:function:test-function"
            )
            self.memory_limit_in_mb = "512"
            self.request_id = f"test-request-{int(time.time())}"
            self.log_group_name = "/aws/lambda/test-function"
            self.log_stream_name = "2024/01/01/[$LATEST]test"
            self.aws_request_id = self.request_id
        
        def get_remaining_time_in_millis(self):
            return 30000
    
    return MockLambdaContext()
