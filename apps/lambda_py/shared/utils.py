"""Shared utilities for Lambda functions."""

from typing import Any, Dict, Optional


def create_response(
    status_code: int,
    body: Any,
    headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body (will be JSON serialized)
        headers: Optional additional headers
        
    Returns:
        API Gateway response dictionary
    """
    import json
    
    default_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    }
    
    if headers:
        default_headers.update(headers)
    
    return {
        "statusCode": status_code,
        "headers": default_headers,
        "body": json.dumps(body),
    }


def parse_body(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Parse the body from an API Gateway event.
    
    Args:
        event: API Gateway event dictionary
        
    Returns:
        Parsed body dictionary or None if parsing fails
    """
    import json
    
    body = event.get("body")
    if not body:
        return None
    
    try:
        return json.loads(body)
    except (json.JSONDecodeError, TypeError):
        return None
