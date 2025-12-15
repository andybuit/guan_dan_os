"""Unit tests for user Lambda function."""

import json
import os

import pytest
from moto import mock_aws

# Set environment variable before importing handler
os.environ["USERS_TABLE_NAME"] = "Users"

from functions.user.handler import handler


@mock_aws
def test_create_user(lambda_context, dynamodb_table):
    """Test creating a new user."""
    event = {
        "httpMethod": "POST",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps({"username": "testuser", "email": "test@example.com"}),
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    assert body["username"] == "testuser"
    assert body["email"] == "test@example.com"
    assert "user_id" in body
    assert "created_at" in body


@mock_aws
def test_create_user_validation_error(lambda_context, dynamodb_table):
    """Test creating user with invalid email."""
    event = {
        "httpMethod": "POST",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps({"username": "testuser", "email": "invalid-email"}),
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert "error" in body


@mock_aws
def test_create_user_missing_fields(lambda_context, dynamodb_table):
    """Test creating user with missing fields."""
    event = {
        "httpMethod": "POST",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps({"username": "testuser"}),
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 400


@mock_aws
def test_get_user(lambda_context, dynamodb_table):
    """Test retrieving a user."""
    # First create a user
    create_event = {
        "httpMethod": "POST",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps({"username": "getuser", "email": "get@example.com"}),
    }
    
    create_response = handler(create_event, lambda_context)
    created_user = json.loads(create_response["body"])
    
    # Now retrieve the user
    get_event = {
        "httpMethod": "GET",
        "path": f"/users/{created_user['user_id']}",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": {"userId": created_user["user_id"]},
        "body": None,
    }
    
    get_response = handler(get_event, lambda_context)
    
    assert get_response["statusCode"] == 200
    body = json.loads(get_response["body"])
    assert body["user_id"] == created_user["user_id"]
    assert body["username"] == "getuser"
    assert body["email"] == "get@example.com"


@mock_aws
def test_get_user_not_found(lambda_context, dynamodb_table):
    """Test retrieving a non-existent user."""
    event = {
        "httpMethod": "GET",
        "path": "/users/non-existent-id",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": {"userId": "non-existent-id"},
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert body["error"] == "User not found"


@mock_aws
def test_get_user_missing_id(lambda_context, dynamodb_table):
    """Test retrieving user without ID."""
    event = {
        "httpMethod": "GET",
        "path": "/users",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 400


@mock_aws
def test_method_not_allowed(lambda_context, dynamodb_table):
    """Test unsupported HTTP method."""
    event = {
        "httpMethod": "DELETE",
        "path": "/users/123",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": {"userId": "123"},
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 405
    body = json.loads(response["body"])
    assert body["error"] == "Method not allowed"
