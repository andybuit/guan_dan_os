/**
 * DynamoDB Client Wrapper
 *
 * Provides type-safe, error-handled DynamoDB operations with
 * automatic retries, logging, and environment configuration.
 */

import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  BatchGetCommandInput,
  BatchWriteCommand,
  BatchWriteCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { TableName } from './dynamodb-schemas';

/**
 * Environment configuration
 */
const ENVIRONMENT = process.env.ENVIRONMENT || 'local';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const LOCALSTACK_ENDPOINT =
  process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';

/**
 * DynamoDB client configuration
 */
const clientConfig: DynamoDBClientConfig = {
  region: AWS_REGION,
  maxAttempts: 3, // Automatic retry up to 3 times
  ...(ENVIRONMENT === 'local' && {
    endpoint: LOCALSTACK_ENDPOINT,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
};

/**
 * Create base DynamoDB client
 */
const client = new DynamoDBClient(clientConfig);

/**
 * Create Document client with marshalling/unmarshalling
 */
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false, // Don't convert empty strings to null
  },
  unmarshallOptions: {
    wrapNumbers: false, // Return numbers as native JS numbers
  },
});

/**
 * Custom error class for DynamoDB operations
 */
export class DynamoDBError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly tableName?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DynamoDBError';
  }
}

/**
 * Type-safe DynamoDB operations wrapper
 */
export class DB {
  /**
   * Get a single item by primary key
   */
  static async get<T = any>(
    params: Omit<GetCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<T | null> {
    try {
      const result = await docClient.send(new GetCommand(params));
      return (result.Item as T) || null;
    } catch (error) {
      throw new DynamoDBError(
        `Failed to get item from ${params.TableName}`,
        'get',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Put (create or replace) an item
   */
  static async put(
    params: Omit<PutCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<void> {
    try {
      await docClient.send(new PutCommand(params));
    } catch (error) {
      throw new DynamoDBError(
        `Failed to put item to ${params.TableName}`,
        'put',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Update an existing item
   */
  static async update(
    params: Omit<UpdateCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<any> {
    try {
      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      throw new DynamoDBError(
        `Failed to update item in ${params.TableName}`,
        'update',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Delete an item
   */
  static async delete(
    params: Omit<DeleteCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<void> {
    try {
      await docClient.send(new DeleteCommand(params));
    } catch (error) {
      throw new DynamoDBError(
        `Failed to delete item from ${params.TableName}`,
        'delete',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Query items by key condition
   */
  static async query<T = any>(
    params: Omit<QueryCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<T[]> {
    try {
      const result = await docClient.send(new QueryCommand(params));
      return (result.Items as T[]) || [];
    } catch (error) {
      throw new DynamoDBError(
        `Failed to query ${params.TableName}`,
        'query',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Scan table (use sparingly, prefer query)
   */
  static async scan<T = any>(
    params: Omit<ScanCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<T[]> {
    try {
      const result = await docClient.send(new ScanCommand(params));
      return (result.Items as T[]) || [];
    } catch (error) {
      throw new DynamoDBError(
        `Failed to scan ${params.TableName}`,
        'scan',
        params.TableName,
        error as Error
      );
    }
  }

  /**
   * Batch get multiple items (max 100 per request)
   */
  static async batchGet(
    params: BatchGetCommandInput
  ): Promise<Record<string, any[]>> {
    try {
      const result = await docClient.send(new BatchGetCommand(params));
      return result.Responses || {};
    } catch (error) {
      throw new DynamoDBError(
        'Failed to batch get items',
        'batchGet',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Batch write (put/delete) multiple items (max 25 per request)
   */
  static async batchWrite(params: BatchWriteCommandInput): Promise<void> {
    try {
      await docClient.send(new BatchWriteCommand(params));
    } catch (error) {
      throw new DynamoDBError(
        'Failed to batch write items',
        'batchWrite',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Transactional write (atomic multi-table operations)
   */
  static async transactWrite(params: TransactWriteCommandInput): Promise<void> {
    try {
      await docClient.send(new TransactWriteCommand(params));
    } catch (error) {
      throw new DynamoDBError(
        'Failed to execute transaction',
        'transactWrite',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Query all items with pagination (auto-handles LastEvaluatedKey)
   */
  static async queryAll<T = any>(
    params: Omit<QueryCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<T[]> {
    const items: T[] = [];
    let lastKey: Record<string, any> | undefined;

    do {
      try {
        const result = await docClient.send(
          new QueryCommand({
            ...params,
            ExclusiveStartKey: lastKey,
          })
        );

        if (result.Items) {
          items.push(...(result.Items as T[]));
        }

        lastKey = result.LastEvaluatedKey;
      } catch (error) {
        throw new DynamoDBError(
          `Failed to query all from ${params.TableName}`,
          'queryAll',
          params.TableName,
          error as Error
        );
      }
    } while (lastKey);

    return items;
  }

  /**
   * Scan all items with pagination (use sparingly)
   */
  static async scanAll<T = any>(
    params: Omit<ScanCommandInput, 'TableName'> & { TableName: TableName }
  ): Promise<T[]> {
    const items: T[] = [];
    let lastKey: Record<string, any> | undefined;

    do {
      try {
        const result = await docClient.send(
          new ScanCommand({
            ...params,
            ExclusiveStartKey: lastKey,
          })
        );

        if (result.Items) {
          items.push(...(result.Items as T[]));
        }

        lastKey = result.LastEvaluatedKey;
      } catch (error) {
        throw new DynamoDBError(
          `Failed to scan all from ${params.TableName}`,
          'scanAll',
          params.TableName,
          error as Error
        );
      }
    } while (lastKey);

    return items;
  }
}

/**
 * Export raw client for advanced use cases
 */
export { docClient as rawClient };
