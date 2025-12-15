#!/usr/bin/env ts-node
/**
 * DynamoDB Table Setup Script
 *
 * Creates all required tables in LocalStack or AWS
 * Run: pnpm setup:db
 */

import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import { ALL_TABLE_SCHEMAS } from '../src/shared/dynamodb-schemas';

const LOCALSTACK_ENDPOINT =
  process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT = process.env.ENVIRONMENT || 'local';

const client = new DynamoDBClient({
  region: AWS_REGION,
  ...(ENVIRONMENT === 'local' && {
    endpoint: LOCALSTACK_ENDPOINT,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
});

async function listExistingTables(): Promise<string[]> {
  try {
    const result = await client.send(new ListTablesCommand({}));
    return result.TableNames || [];
  } catch (error) {
    console.error('Error listing tables:', error);
    return [];
  }
}

async function deleteTable(tableName: string): Promise<void> {
  try {
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`✓ Deleted table: ${tableName}`);
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      console.error(`✗ Error deleting table ${tableName}:`, error.message);
    }
  }
}

async function createTable(schema: any): Promise<void> {
  try {
    await client.send(new CreateTableCommand(schema));
    console.log(`✓ Created table: ${schema.TableName}`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`  Table ${schema.TableName} already exists`);
    } else {
      console.error(
        `✗ Error creating table ${schema.TableName}:`,
        error.message
      );
      throw error;
    }
  }
}

async function setupTables(recreate: boolean = false): Promise<void> {
  console.log(
    `\n🔧 Setting up DynamoDB tables (${ENVIRONMENT} environment)...`
  );
  console.log(
    `   Endpoint: ${ENVIRONMENT === 'local' ? LOCALSTACK_ENDPOINT : 'AWS'}`
  );
  console.log(`   Region: ${AWS_REGION}\n`);

  const existingTables = await listExistingTables();
  console.log(`Found ${existingTables.length} existing tables\n`);

  if (recreate) {
    console.log('🗑️  Recreating tables (delete + create)...\n');
    for (const schema of ALL_TABLE_SCHEMAS) {
      if (existingTables.includes(schema.TableName!)) {
        await deleteTable(schema.TableName!);
        // Wait a bit for deletion to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.log('📦 Creating tables...\n');
  for (const schema of ALL_TABLE_SCHEMAS) {
    await createTable(schema);
  }

  console.log('\n✅ Database setup complete!\n');

  // List final tables
  const finalTables = await listExistingTables();
  console.log('📋 Tables in database:');
  finalTables.forEach((table) => console.log(`   - ${table}`));
  console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
const recreate = args.includes('--recreate') || args.includes('-r');

setupTables(recreate)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
