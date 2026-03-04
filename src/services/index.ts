// ============================================================================
// SERVICE LAYER - BUSINESS LOGIC
// ============================================================================

import { UserRepository, EmployeeRepository, PacketRepository, DashboardRepository } from '../repositories/index.js';
import { ValidationError, NotFoundError, UnauthorizedError, STATUS_TRANSITIONS, PacketStatus } from '../types/index.js';
import { logger, passwordUtils, jwtUtils } from '../utils/logger.js';
import { config } from '../config/index.js';

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService {
  private userRepo = new UserRepository();

  async register(data: { username: string; password: string; email: string; phone?: string }) {
    const existingUsername = await this.userRepo.findByUsername(data.username);
    if (existingUsername) throw new ValidationError('Username already taken');

    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) throw new ValidationError('Email already registered');

    const strength = passwordUtils.validateStrength(data.password);
    if (!strength.isStrong) {
      throw new ValidationError(`Password too weak: ${strength.feedback.join(', ')}`);
    }

    const hashedPassword = await passwordUtils.hash(data.password);

    const user = await this.userRepo.create({
      username: data.username,
      password: hashedPassword,
      email: data.email,
      phone: data.phone || null,
    });

    const accessToken = jwtUtils.generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = jwtUtils.generateRefreshToken({ userId: user.id });

    logger.info('User registered', { userId: user.id });

    return {
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
      tokens: { accessToken, refreshToken, expiresIn: 900 },
    };
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new UnauthorizedError('Invalid username or password');

    const valid = await passwordUtils.verify(password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid username or password');

    const accessToken = jwtUtils.generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });
    const refreshToken = jwtUtils.generateRefreshToken({ userId: user.id });

    logger.info('User logged in', { userId: user.id });

    return {
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
      tokens: { accessToken, refreshToken, expiresIn: 900 },
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = jwtUtils.verify(refreshToken, config.JWT_REFRESH_SECRET!);
    if (!decoded) throw new UnauthorizedError('Invalid refresh token');

    const user = await this.userRepo.findById(decoded.sub);
    if (!user) throw new UnauthorizedError('User not found');

    const newAccessToken = jwtUtils.generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return { accessToken: newAccessToken, expiresIn: 900 };
  }

  async getUser(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  }
}

// ============================================================================
// EMPLOYEE SERVICE
// ============================================================================

export class EmployeeService {
  private employeeRepo = new EmployeeRepository();
  private packetRepo = new PacketRepository();

  /**
   * Create an employee
   */
  async create(data: { name: string; type: string; phone?: string | null }) {
    const existingEmployee = await this.employeeRepo.findByName(data.name);
    if (existingEmployee) throw new ValidationError('Employee name already taken');
    const employee = await this.employeeRepo.create(data);
    logger.info('Employee created', { employeeId: employee.id });
    return employee;
  }

  async getById(id: string) {
    const employee = await this.employeeRepo.findById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} not found`);
    return employee;
  }

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [employees, total] = await Promise.all([
      this.employeeRepo.findAll(skip, pageSize),
      this.employeeRepo.count(),
    ]);
    return { employees, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async update(id: string, data: Partial<{ name: string; type: string; phone: string | null }>) {
    await this.getById(id);
    const updated = await this.employeeRepo.update(id, data);
    logger.info('Employee updated', { employeeId: id });
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const assignedPackets = await this.packetRepo.findByEmployeeId(id);
    const activePackets = assignedPackets.filter((p: any) => p.status !== 'reviewed');
    if (activePackets.length > 0) {
      throw new ValidationError(`Cannot delete employee with ${activePackets.length} active packet(s)`);
    }
    await this.employeeRepo.delete(id);
    logger.info('Employee deleted', { employeeId: id });
  }
}

// ============================================================================
// PACKET SERVICE
// ============================================================================

export class PacketService {
  private packetRepo = new PacketRepository();
  private employeeRepo = new EmployeeRepository();

  async create(userId: string, data: { description?: string; weight?: number; carat?: number }) {
    const packet = await this.packetRepo.create({
      userId,
      description: data.description || null,
      weight: data.weight?.toString(),
      carat: data.carat?.toString(),
    });
    logger.info('Packet created', { packetId: packet.id, userId });
    return packet;
  }

  async getById(id: string) {
    const packet = await this.packetRepo.findById(id);
    if (!packet) throw new NotFoundError(`Packet ${id} not found`);
    return packet;
  }

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [packets, total] = await Promise.all([
      this.packetRepo.findAll(skip, pageSize),
      this.packetRepo.count(),
    ]);
    return { packets, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async update(id: string, data: { description?: string; weight?: number; carat?: number }) {
    await this.getById(id);
    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.weight !== undefined) updateData.weight = data.weight.toString();
    if (data.carat !== undefined) updateData.carat = data.carat.toString();

    const updated = await this.packetRepo.update(id, updateData);
    logger.info('Packet updated', { packetId: id });
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.packetRepo.delete(id);
    logger.info('Packet deleted', { packetId: id });
  }

  async assignEmployee(packetId: string, employeeId: string) {
    const packet = await this.getById(packetId);
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

    if (packet.status !== 'created') {
      throw new ValidationError(
        `Cannot assign employee to packet with status "${packet.status}". Packet must be in "created" status.`
      );
    }

    const updated = await this.packetRepo.update(packetId, {
      employeeId,
      status: 'assigned',
    });
    logger.info('Packet assigned to employee', { packetId, employeeId });
    return updated;
  }

  async updateStatus(packetId: string, newStatus: PacketStatus) {
    const packet = await this.getById(packetId);
    const currentStatus = packet.status as PacketStatus;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedTransitions?.join(', ') || 'none'}`
      );
    }

    const updated = await this.packetRepo.update(packetId, { status: newStatus });
    logger.info('Packet status updated', { packetId, from: currentStatus, to: newStatus });
    return updated;
  }

  async getStatusSummary() {
    return await this.packetRepo.getStatusSummary();
  }

  async getByStatus(status: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [packets, total] = await Promise.all([
      this.packetRepo.findByStatus(status, skip, pageSize),
      this.packetRepo.count(status),
    ]);
    return { packets, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
}

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export class DashboardService {
  private dashboardRepo = new DashboardRepository();

  /**
   * Get dashboard data
   */
  async getDashboard() {
    return await this.dashboardRepo.getDashboard();
  }
}
