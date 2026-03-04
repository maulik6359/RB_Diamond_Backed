// ============================================================================
// MIDDLEWARE LAYER
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthUser, JWTPayload, UnauthorizedError } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId: string;
      startTime: number;
    }
  }
}

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(
      token,
      config.JWT_SECRET!,
      { algorithms: ['HS256'] }
    ) as JWTPayload;

    req.user = {
      userId: decoded.sub,
      username: decoded.username,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Unauthorized',
      },
    });
  }
};

function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new UnauthorizedError('Invalid authorization header format');
  }

  return parts[1];
}

// ============================================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================================

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalJson = res.json;

  res.json = function(data: any) {
    const duration = Date.now() - req.startTime;

    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.userId,
    });

    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalJson.call(this, data);
  };

  next();
};

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;

  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    error: {
      code: error.code,
      message: error.message,
      stack: config.NODE_ENV === 'development' ? error.stack : undefined,
    },
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: config.NODE_ENV === 'development' ? error.details : undefined,
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  });
};
