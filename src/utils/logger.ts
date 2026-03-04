// ============================================================================
// UTILITIES & HELPERS
// ============================================================================

import winston from 'winston';
import { config } from '../config/index.js';

// ============================================================================
// LOGGER
// ============================================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'ek-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

import bcrypt from 'bcrypt';

export const passwordUtils = {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  validateStrength(password: string): {
    valid: boolean;
    errors: string[];
    isStrong: boolean;
    feedback: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain a special character');
    }

    return {
      valid: errors.length === 0,
      errors,
      isStrong: errors.length === 0,
      feedback: errors,
    };
  },
};

// ============================================================================
// JWT UTILITIES
// ============================================================================

import jwt from 'jsonwebtoken';

export const jwtUtils = {
  generateAccessToken(data: { userId: string; username: string; email: string }): string {
    const payload = {
      sub: data.userId,
      username: data.username,
      email: data.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    return jwt.sign(payload, config.JWT_SECRET!, { algorithm: 'HS256' });
  },

  generateRefreshToken(data: { userId: string }): string {
    const payload = {
      sub: data.userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    return jwt.sign(payload, config.JWT_REFRESH_SECRET!, { algorithm: 'HS256' });
  },

  verify(token: string, secret: string = config.JWT_SECRET!): any {
    try {
      return jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (error) {
      logger.debug('JWT verification failed', { error });
      return null;
    }
  },
};

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

export const responseUtils = {
  success<T>(data: T, meta?: any) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  },

  paginated<T>(data: T[], page: number, pageSize: number, total: number) {
    return {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },

  error(code: string, message: string, details?: any) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validationUtils = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

// ============================================================================
// DATE UTILITIES
// ============================================================================

export const dateUtils = {
  now(): Date {
    return new Date();
  },

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  isExpired(expiryDate: Date): boolean {
    return expiryDate < new Date();
  },

  daysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },
};

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export const paginationUtils = {
  getPagination(page: number = 1, pageSize: number = 20) {
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (validPage - 1) * validPageSize;

    return {
      skip,
      take: validPageSize,
      page: validPage,
      pageSize: validPageSize,
    };
  },

  calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  },
};

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export const errorUtils = {
  getStatusCode(error: any): number {
    if (error.statusCode) return error.statusCode;
    if (error.code === '23505') return 409; // PostgreSQL unique constraint
    return 500;
  },

  getErrorMessage(error: any): string {
    if (error.message) return error.message;
    if (error.code === '23505') return 'This value is already taken';
    return 'An unexpected error occurred';
  },
};
