import {
  CreateTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';

// LocalStack endpoint
const LOCALSTACK_ENDPOINT =
  process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';

// Configure AWS SDK to use LocalStack
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
process.env.LOCALSTACK_ENDPOINT = LOCALSTACK_ENDPOINT;

// Wait for LocalStack to be ready
async function waitForLocalStack(): Promise<void> {
  const maxAttempts = 30;
  const delayMs = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const client = new DynamoDBClient({
        endpoint: LOCALSTACK_ENDPOINT,
        region: 'us-east-1',
      });

      await client.send(new ListTablesCommand({}));
      console.log('✅ LocalStack is ready');
      return;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(`LocalStack not ready after ${maxAttempts} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Setup DynamoDB tables
async function setupDynamoDB(): Promise<void> {
  const client = new DynamoDBClient({
    endpoint: LOCALSTACK_ENDPOINT,
    region: 'us-east-1',
  });

  try {
    // Create Users table
    await client.send(
      new CreateTableCommand({
        TableName: 'Users',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      })
    );

    console.log('✅ Created Users table in LocalStack');
  } catch (error) {
    // Table might already exist, ignore error
    console.log('ℹ️  Users table might already exist');
  }
}

// Global setup function
async function setup() {
  console.log('🔧 Setting up LocalStack environment...');
  await waitForLocalStack();
  await setupDynamoDB();
  console.log('✅ LocalStack setup complete\n');
}

// Run setup before tests
await setup();
