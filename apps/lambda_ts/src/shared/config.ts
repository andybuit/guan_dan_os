/**
 * Environment Configuration
 *
 * Type-safe environment variable access with validation
 */

export interface EnvironmentConfig {
  // Environment
  environment: 'local' | 'staging' | 'production';

  // AWS
  awsRegion: string;
  awsAccountId: string;

  // LocalStack
  localstackEndpoint: string;
  useLocalStack: boolean;

  // DynamoDB
  dynamodbEndpoint?: string;

  // WebSocket
  websocketEndpoint: string;

  // Timeouts (milliseconds)
  turnTimeout: number;
  reconnectGracePeriod: number;
  aiAutoFillTimeout: number;
  gameStartCountdown: number;

  // Retention (days)
  activeGameRetention: number;
  anonymousGameRetention: number;

  // Limits
  maxRoomsPerPlayer: number;
  maxGamesPerDay: number;

  // Logging & Monitoring
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableXRay: boolean;
  enableMetrics: boolean;

  // Security
  jwtSecret: string;
  corsAllowedOrigins: string[];
}

/**
 * Load and validate environment configuration
 */
function loadConfig(): EnvironmentConfig {
  const env = process.env;

  return {
    environment: (env.ENVIRONMENT as any) || 'local',

    awsRegion: env.AWS_REGION || 'us-east-1',
    awsAccountId: env.AWS_ACCOUNT_ID || '000000000000',

    localstackEndpoint: env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
    useLocalStack: env.USE_LOCALSTACK === 'true' || env.ENVIRONMENT === 'local',

    dynamodbEndpoint: env.DYNAMODB_ENDPOINT,

    websocketEndpoint: env.WEBSOCKET_API_ENDPOINT || 'ws://localhost:3001',

    turnTimeout: parseInt(env.TURN_TIMEOUT_MS || '30000', 10),
    reconnectGracePeriod: parseInt(
      env.RECONNECT_GRACE_PERIOD_MS || '30000',
      10
    ),
    aiAutoFillTimeout: parseInt(env.AI_AUTO_FILL_TIMEOUT_MS || '10000', 10),
    gameStartCountdown: parseInt(env.GAME_START_COUNTDOWN_MS || '10000', 10),

    activeGameRetention: parseInt(env.ACTIVE_GAME_RETENTION_DAYS || '30', 10),
    anonymousGameRetention: parseInt(
      env.ANONYMOUS_GAME_RETENTION_DAYS || '7',
      10
    ),

    maxRoomsPerPlayer: parseInt(env.MAX_ROOMS_PER_PLAYER || '3', 10),
    maxGamesPerDay: parseInt(env.MAX_GAMES_PER_DAY || '100', 10),

    logLevel: (env.LOG_LEVEL as any) || 'info',
    enableXRay: env.ENABLE_XRAY === 'true',
    enableMetrics: env.ENABLE_METRICS === 'true',

    jwtSecret: env.JWT_SECRET || 'dev-secret-change-in-production',
    corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
  };
}

/**
 * Validate required environment variables
 */
function validateConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];

  if (
    config.environment === 'production' &&
    config.jwtSecret === 'dev-secret-change-in-production'
  ) {
    errors.push('JWT_SECRET must be set in production');
  }

  if (config.turnTimeout < 1000) {
    errors.push('TURN_TIMEOUT_MS must be at least 1000ms');
  }

  if (config.aiAutoFillTimeout < 1000) {
    errors.push('AI_AUTO_FILL_TIMEOUT_MS must be at least 1000ms');
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * Singleton config instance
 */
let config: EnvironmentConfig | null = null;

/**
 * Get environment configuration
 */
export function getConfig(): EnvironmentConfig {
  if (!config) {
    config = loadConfig();
    validateConfig(config);
  }
  return config;
}

/**
 * Check if running in local environment
 */
export function isLocal(): boolean {
  return getConfig().environment === 'local';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getConfig().environment === 'production';
}

/**
 * Get table name with environment prefix
 */
export function getTableName(baseName: string): string {
  const { environment } = getConfig();
  if (environment === 'local') {
    return baseName;
  }
  return `${environment}-${baseName}`;
}
