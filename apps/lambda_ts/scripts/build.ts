import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FUNCTIONS_DIR = path.join(__dirname, '../src/functions');
const BUILD_DIR = path.join(__dirname, '../.build');

async function getAllFunctions(): Promise<string[]> {
  const entries = await fs.promises.readdir(FUNCTIONS_DIR, {
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function buildFunction(functionName: string): Promise<void> {
  const entryPoint = path.join(FUNCTIONS_DIR, functionName, 'index.ts');
  const outDir = path.join(BUILD_DIR, functionName);

  // Check if entry point exists
  if (!fs.existsSync(entryPoint)) {
    console.error(`❌ Entry point not found: ${entryPoint}`);
    process.exit(1);
  }

  console.log(`📦 Building ${functionName}...`);

  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: path.join(outDir, 'index.mjs'),
      external: [
        // AWS SDK v3 is available in Lambda runtime
        '@aws-sdk/*',
      ],
      sourcemap: true,
      minify: true,
      treeShaking: true,
      banner: {
        js: `
// AWS Lambda ESM handler compatibility
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
      },
    });

    console.log(`✅ Built ${functionName} successfully`);
    console.log(`   Output: ${path.join(outDir, 'index.mjs')}`);
  } catch (error) {
    console.error(`❌ Failed to build ${functionName}:`, error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    await fs.promises.rm(BUILD_DIR, { recursive: true });
  }
  await fs.promises.mkdir(BUILD_DIR, { recursive: true });

  if (args.length === 0) {
    // Build all functions
    console.log('🏗️  Building all Lambda functions...\n');
    const functions = await getAllFunctions();

    for (const fn of functions) {
      await buildFunction(fn);
    }

    console.log(`\n✨ Built ${functions.length} function(s) successfully`);
  } else {
    // Build specific function
    const functionName = args[0];
    await buildFunction(functionName);
  }
}

main().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
