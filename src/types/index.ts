// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// EMPLOYEE & PACKET CONSTANTS
// ============================================================================

export const EMPLOYEE_TYPES = ['pel', 'dhar', 'ghodi', 'table'] as const;
export type EmployeeType = typeof EMPLOYEE_TYPES[number];

export const PACKET_STATUSES = ['created', 'assigned', 'done', 'reviewed'] as const;
export type PacketStatus = typeof PACKET_STATUSES[number];

export const STATUS_TRANSITIONS: Record<PacketStatus, PacketStatus[]> = {
  created: ['assigned'],
  assigned: ['done'],
  done: ['reviewed'],
  reviewed: [],
};

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// DTO TYPES
// ============================================================================

export interface CreateUserDTO {
  username: string;
  password: string;
  email: string;
  phone?: string;
}

export interface CreateEmployeeDTO {
  name: string;
  type: EmployeeType;
  phone?: string;
}

export interface UpdateEmployeeDTO {
  name?: string;
  type?: EmployeeType;
  phone?: string;
}

export interface CreatePacketDTO {
  description?: string;
  weight?: number;
  carat?: number;
}

export interface UpdatePacketDTO {
  description?: string;
  weight?: number;
  carat?: number;
}

export interface AssignPacketDTO {
  employeeId: string;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class BusinessError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class NotFoundError extends BusinessError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string = 'Validation failed', details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}
