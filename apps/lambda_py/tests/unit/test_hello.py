"""Unit tests for hello Lambda function."""

import json

import pytest

from functions.hello.handler import handler


def test_hello_default_name(lambda_context):
    """Test hello function with default name."""
    event = {
        "httpMethod": "GET",
        "path": "/hello",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Hello, World!"
    assert body["requestId"] == "test-request-id"
    assert "timestamp" in body


def test_hello_custom_name(lambda_context):
    """Test hello function with custom name."""
    event = {
        "httpMethod": "GET",
        "path": "/hello",
        "headers": {},
        "queryStringParameters": {"name": "Alice"},
        "pathParameters": None,
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Hello, Alice!"


def test_hello_response_headers(lambda_context):
    """Test hello function response headers."""
    event = {
        "httpMethod": "GET",
        "path": "/hello",
        "headers": {},
        "queryStringParameters": None,
        "pathParameters": None,
        "body": None,
    }
    
    response = handler(event, lambda_context)
    
    assert response["headers"]["Content-Type"] == "application/json"
    assert response["headers"]["Access-Control-Allow-Origin"] == "*"
