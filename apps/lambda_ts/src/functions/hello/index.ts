import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { createResponse } from '../../shared/utils.js';

const logger = new Logger({ serviceName: 'hello-lambda' });
const tracer = new Tracer({ serviceName: 'hello-lambda' });
const metrics = new Metrics({
  namespace: 'GuanDanOS',
  serviceName: 'hello-lambda',
});

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Start a new segment for tracing
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('HelloHandler');

  try {
    logger.info('Processing hello request', {
      requestId: context.requestId,
      path: event.path,
    });

    // Add custom metric
    metrics.addMetric('HelloInvocations', MetricUnit.Count, 1);

    const name = event.queryStringParameters?.name || 'World';
    const message = `Hello, ${name}!`;

    logger.info('Successfully generated greeting', { name, message });

    // Publish metrics
    metrics.publishStoredMetrics();

    subsegment?.close();

    return createResponse(200, {
      message,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    });
  } catch (error) {
    logger.error('Error processing request', { error });
    metrics.addMetric('HelloErrors', MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    subsegment?.close();

    return createResponse(500, {
      error: 'Internal server error',
      requestId: context.requestId,
    });
  }
};
