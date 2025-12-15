"""Integration tests for user Lambda function with LocalStack."""

import json
import os

import pytest

# Set environment variables for LocalStack
os.environ["USERS_TABLE_NAME"] = "Users"
os.environ["LOCALSTACK_ENDPOINT"] = "http://localhost:4566"

from functions.user.handler import handler


def test_create_and_get_user_localstack(
    localstack_endpoint, dynamodb_table_localstack, lambda_context_localstack
):
    """Test creating and retrieving a user with LocalStack."""
    # Create user
    create_event = {
        "httpMethod": "POST",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps({
            "username": "localstack_user",
            "email": "localstack@example.com",
        }),
    }
    
    create_response = handler(create_event, lambda_context_localstack)
    
    assert create_response["statusCode"] == 201
    created_user = json.loads(create_response["body"])
    assert created_user["username"] == "localstack_user"
    assert created_user["email"] == "localstack@example.com"
    assert "user_id" in created_user
    
    # Get user
    get_event = {
        "httpMethod": "GET",
        "path": f"/users/{created_user['user_id']}",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": {"userId": created_user["user_id"]},
        "body": None,
    }
    
    get_response = handler(get_event, lambda_context_localstack)
    
    assert get_response["statusCode"] == 200
    retrieved_user = json.loads(get_response["body"])
    assert retrieved_user["user_id"] == created_user["user_id"]
    assert retrieved_user["username"] == "localstack_user"
    assert retrieved_user["email"] == "localstack@example.com"


def test_user_not_found_localstack(
    localstack_endpoint, dynamodb_table_localstack, lambda_context_localstack
):
    """Test retrieving non-existent user with LocalStack."""
    event = {
        "httpMethod": "GET",
        "path": "/users/does-not-exist",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": {"userId": "does-not-exist"},
        "body": None,
    }
    
    response = handler(event, lambda_context_localstack)
    
    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert body["error"] == "User not found"
