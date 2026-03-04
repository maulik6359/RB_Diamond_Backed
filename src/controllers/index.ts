// ============================================================================
// CONTROLLERS - REQUEST HANDLERS
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { AuthService, PacketService, EmployeeService, ClientService, DashboardService } from '../services/index.js';
import { responseUtils, paginationUtils } from '../utils/logger.js';
import { ValidationError } from '../types/index.js';
import {
  createPacketSchema,
  updatePacketSchema,
  assignPacketSchema,
  updateStatusSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createClientSchema,
  updateClientSchema,
  loginSchema,
  registerSchema,
} from '../schemas/index.js';

// ============================================================================
// AUTH CONTROLLER
// ============================================================================

export class AuthController {
  private authService = new AuthService();

  /**
   * Register a new user
   
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const result = await this.authService.register(value);
      res.status(201).json(responseUtils.success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login a user
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const result = await this.authService.login(value.username, value.password);

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(responseUtils.success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'];
      if (!refreshToken) throw new ValidationError('Refresh token not provided');

      const result = await this.authService.refreshToken(String(refreshToken));
      res.json(responseUtils.success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user
   */
  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.getUser(String(req.user?.userId));
      res.json(responseUtils.success(user));
    } catch (err) {
      next(err);
    }
  }
}

// ============================================================================
// PACKET CONTROLLER
// ============================================================================

export class PacketController {
  private packetService = new PacketService();

  /**
   * Create a new packet
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ValidationError('User not authenticated');
      const { error, value } = createPacketSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const packet = await this.packetService.create(req.user.userId, value);
      res.status(201).json(responseUtils.success(packet));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get packet by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const packet = await this.packetService.getById(String(req.params.id));
      res.json(responseUtils.success(packet));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all packets
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationUtils.getPagination(
        Number(String(req.query.page || 1)),
        Number(String(req.query.pageSize || 20)),
      );
      const result = await this.packetService.getAll(page, pageSize);
      res.json(responseUtils.paginated(result.packets, result.pagination.page, result.pagination.pageSize, result.pagination.total));
    } catch (err) {
      next(err);
    }
  }
  /**
   * Update a packet
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = updatePacketSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const packet = await this.packetService.update(String(req.params.id), value);
      res.json(responseUtils.success(packet));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a packet
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.packetService.delete(String(req.params.id));
      res.json(responseUtils.success({ message: 'Packet deleted' }));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Assign a packet to an employee
   */
  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = assignPacketSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const packet = await this.packetService.assignEmployee(String(req.params.id), value.employeeId);
      res.json(responseUtils.success(packet));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update status of a packet
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = updateStatusSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const packet = await this.packetService.updateStatus(String(req.params.id), value.status);
      res.json(responseUtils.success(packet));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get status summary
   */
  async getStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await this.packetService.getStatusSummary();
      res.json(responseUtils.success(summary));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get packets by status
   */
  async getByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = String(req.query.status || '');
      if (!status) throw new ValidationError('Status query parameter required');

      const { page, pageSize } = paginationUtils.getPagination(
        Number(String(req.query.page || 1)),
        Number(String(req.query.pageSize || 20)),
      );
      const result = await this.packetService.getByStatus(status, page, pageSize);
      res.json(responseUtils.paginated(result.packets, result.pagination.page, result.pagination.pageSize, result.pagination.total));
    } catch (err) {
      next(err);
    }
  }
}

// ============================================================================
// EMPLOYEE CONTROLLER
// ============================================================================

export class EmployeeController {
  private employeeService = new EmployeeService();

  /**
   * Create an employee
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = createEmployeeSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const employee = await this.employeeService.create(value);
      res.status(201).json(responseUtils.success(employee));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get employee by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await this.employeeService.getById(String(req.params.id));
      res.json(responseUtils.success(employee));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all employees
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationUtils.getPagination(
        Number(String(req.query.page || 1)),
        Number(String(req.query.pageSize || 20)),
      );
      const result = await this.employeeService.getAll(page, pageSize);
      res.json(responseUtils.paginated(result.employees, result.pagination.page, result.pagination.pageSize, result.pagination.total));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an employee
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = updateEmployeeSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const employee = await this.employeeService.update(String(req.params.id), value);
      res.json(responseUtils.success(employee));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an employee
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.employeeService.delete(String(req.params.id));
      res.json(responseUtils.success({ message: 'Employee deleted' }));
    } catch (err) {
      next(err);
    }
  }
}

// ============================================================================
// CLIENT CONTROLLER
// ============================================================================

export class ClientController {
  private clientService = new ClientService();

  /**
   * Create a client
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = createClientSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const client = await this.clientService.create(value);
      res.status(201).json(responseUtils.success(client));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get client by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await this.clientService.getById(String(req.params.id));
      res.json(responseUtils.success(client));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all clients
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize } = paginationUtils.getPagination(
        Number(String(req.query.page || 1)),
        Number(String(req.query.pageSize || 20)),
      );
      const result = await this.clientService.getAll(page, pageSize);
      res.json(responseUtils.paginated(result.clients, result.pagination.page, result.pagination.pageSize, result.pagination.total));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update a client
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { error, value } = updateClientSchema.validate(req.body);
      if (error) throw new ValidationError(error.details.map((d: any) => d.message).join(', '));

      const client = await this.clientService.update(String(req.params.id), value);
      res.json(responseUtils.success(client));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a client
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.clientService.delete(String(req.params.id));
      res.json(responseUtils.success({ message: 'Client deleted' }));
    } catch (err) {
      next(err);
    }
  }
}

// ============================================================================
// DASHBOARD CONTROLLER
// ============================================================================

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * Get dashboard data
   */
  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const dashboardData = await this.dashboardService.getDashboard();
      res.json(responseUtils.success(dashboardData));
    } catch (err) {
      next(err);
    }
  }
}
