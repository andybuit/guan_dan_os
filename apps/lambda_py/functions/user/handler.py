"""User management Lambda function."""

import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from pydantic import BaseModel, EmailStr, ValidationError

from shared.utils import create_response, parse_body

logger = Logger(service="user-lambda")
tracer = Tracer(service="user-lambda")
metrics = Metrics(namespace="GuanDanOS", service="user-lambda")

# Initialize DynamoDB
dynamodb = boto3.resource(
    "dynamodb",
    region_name=os.environ.get("AWS_REGION", "us-east-1"),
    endpoint_url=os.environ.get("LOCALSTACK_ENDPOINT"),
)
table_name = os.environ.get("USERS_TABLE_NAME", "Users")
table = dynamodb.Table(table_name)


class UserCreate(BaseModel):
    """User creation request model."""
    
    username: str
    email: EmailStr


class User(BaseModel):
    """User model."""
    
    user_id: str
    username: str
    email: EmailStr
    created_at: str


@tracer.capture_method
def create_user(username: str, email: str) -> User:
    """
    Create a new user in DynamoDB.
    
    Args:
        username: User's username
        email: User's email
        
    Returns:
        Created user
    """
    user = User(
        user_id=str(uuid.uuid4()),
        username=username,
        email=email,
        created_at=datetime.now().isoformat(),
    )
    
    table.put_item(Item=user.model_dump())
    logger.info("User created", extra={"user_id": user.user_id})
    
    return user


@tracer.capture_method
def get_user(user_id: str) -> Optional[User]:
    """
    Get a user from DynamoDB.
    
    Args:
        user_id: User ID
        
    Returns:
        User or None if not found
    """
    response = table.get_item(Key={"user_id": user_id})
    item = response.get("Item")
    
    if not item:
        logger.warning("User not found", extra={"user_id": user_id})
        return None
    
    return User(**item)


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    User management Lambda handler.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    method = event.get("httpMethod")
    logger.info("Processing user request", extra={"method": method, "path": event.get("path")})
    
    try:
        if method == "POST":
            # Create user
            body = parse_body(event)
            if not body:
                return create_response(400, {"error": "Invalid request body"})
            
            try:
                user_create = UserCreate(**body)
            except ValidationError as e:
                return create_response(400, {"error": "Validation error", "details": e.errors()})
            
            user = create_user(user_create.username, user_create.email)
            metrics.add_metric(name="UserCreated", unit=MetricUnit.Count, value=1)
            
            return create_response(201, user.model_dump())
            
        elif method == "GET":
            # Get user
            path_params = event.get("pathParameters") or {}
            user_id = path_params.get("userId")
            
            if not user_id:
                return create_response(400, {"error": "Missing userId parameter"})
            
            user = get_user(user_id)
            
            if not user:
                metrics.add_metric(name="UserNotFound", unit=MetricUnit.Count, value=1)
                return create_response(404, {"error": "User not found"})
            
            metrics.add_metric(name="UserRetrieved", unit=MetricUnit.Count, value=1)
            return create_response(200, user.model_dump())
            
        else:
            return create_response(405, {"error": "Method not allowed"})
            
    except Exception as e:
        logger.exception("Error processing request")
        metrics.add_metric(name="UserErrors", unit=MetricUnit.Count, value=1)
        return create_response(
            500,
            {"error": "Internal server error", "requestId": context.request_id},
        )
