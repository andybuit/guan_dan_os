import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, '../.build');
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

interface DeployConfig {
  functionName: string;
  handler: string;
  runtime: string;
  role: string;
  timeout?: number;
  memorySize?: number;
  environment?: Record<string, string>;
}

async function deployFunction(name: string): Promise<void> {
  const buildPath = path.join(BUILD_DIR, name);
  const handlerPath = path.join(buildPath, 'index.mjs');

  if (!fs.existsSync(handlerPath)) {
    console.error(
      `❌ Build not found for ${name}. Run 'pnpm build:${name}' first.`
    );
    process.exit(1);
  }

  // Load deployment config if it exists
  const configPath = path.join(__dirname, '../deploy-config.json');
  let config: Record<string, DeployConfig> = {};

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  const functionConfig = config[name] || {
    functionName: `guandan-${name}`,
    handler: 'index.handler',
    runtime: 'nodejs20.x',
    role:
      process.env.LAMBDA_ROLE_ARN ||
      'arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role',
    timeout: 30,
    memorySize: 256,
  };

  console.log(`🚀 Deploying ${name} to AWS Lambda...`);
  console.log(`   Function name: ${functionConfig.functionName}`);
  console.log(`   Region: ${AWS_REGION}`);

  // Create a zip file
  const zipPath = path.join(BUILD_DIR, `${name}.zip`);

  try {
    // Create zip
    execSync(`cd ${buildPath} && zip -r ${zipPath} .`, { stdio: 'inherit' });

    // Check if function exists
    let functionExists = false;
    try {
      execSync(
        `aws lambda get-function --function-name ${functionConfig.functionName} --region ${AWS_REGION}`,
        { stdio: 'pipe' }
      );
      functionExists = true;
    } catch {
      functionExists = false;
    }

    if (functionExists) {
      // Update existing function
      console.log('   Updating existing function...');
      execSync(
        `aws lambda update-function-code --function-name ${functionConfig.functionName} --zip-file fileb://${zipPath} --region ${AWS_REGION}`,
        { stdio: 'inherit' }
      );
    } else {
      // Create new function
      console.log('   Creating new function...');
      const envVars = functionConfig.environment
        ? `--environment Variables={${Object.entries(functionConfig.environment)
            .map(([k, v]) => `${k}=${v}`)
            .join(',')}}`
        : '';

      execSync(
        `aws lambda create-function \
          --function-name ${functionConfig.functionName} \
          --runtime ${functionConfig.runtime} \
          --role ${functionConfig.role} \
          --handler ${functionConfig.handler} \
          --zip-file fileb://${zipPath} \
          --timeout ${functionConfig.timeout} \
          --memory-size ${functionConfig.memorySize} \
          --region ${AWS_REGION} \
          ${envVars}`,
        { stdio: 'inherit' }
      );
    }

    console.log(`✅ Deployed ${name} successfully`);
  } catch (error) {
    console.error(`❌ Failed to deploy ${name}:`, error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Please specify a function name to deploy');
    console.error('   Usage: pnpm deploy <function-name>');
    process.exit(1);
  }

  const functionName = args[0];
  await deployFunction(functionName);
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
