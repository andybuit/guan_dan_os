"""Hello World Lambda function."""

from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

from shared.utils import create_response

logger = Logger(service="hello-lambda")
tracer = Tracer(service="hello-lambda")
metrics = Metrics(namespace="GuanDanOS", service="hello-lambda")


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Hello World Lambda handler.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    logger.info("Processing hello request", extra={"path": event.get("path")})
    
    # Add custom metric
    metrics.add_metric(name="HelloInvocations", unit=MetricUnit.Count, value=1)
    
    # Get name from query parameters
    query_params = event.get("queryStringParameters") or {}
    name = query_params.get("name", "World")
    
    message = f"Hello, {name}!"
    
    logger.info("Successfully generated greeting", extra={"user_name": name, "greeting": message})
    
    return create_response(
        200,
        {
            "message": message,
            "timestamp": __import__("datetime").datetime.now().isoformat(),
            "requestId": context.request_id,
        },
    )
