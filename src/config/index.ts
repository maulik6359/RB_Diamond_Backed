// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_MIN: parseInt(process.env.DATABASE_POOL_MIN || '5', 10),
  DATABASE_POOL_MAX: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

export function validateConfig(): void {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (config.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
}
