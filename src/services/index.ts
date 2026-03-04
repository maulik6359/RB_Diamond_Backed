// ============================================================================
// SERVICE LAYER - BUSINESS LOGIC
// ============================================================================

import { UserRepository, EmployeeRepository, PacketRepository, ClientRepository, DashboardRepository } from '../repositories/index.js';
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
// CLIENT SERVICE
// ============================================================================

export class ClientService {
  private clientRepo = new ClientRepository();

  /**
   * Create a client
   */
  async create(data: { name: string; email?: string | null; phone?: string | null; address?: string | null }) {
    const existingClient = await this.clientRepo.findByName(data.name);
    if (existingClient) throw new ValidationError('Client name already exists');
    const client = await this.clientRepo.create(data);
    logger.info('Client created', { clientId: client.id });
    return client;
  }

  async getById(id: string) {
    const client = await this.clientRepo.findById(id);
    if (!client) throw new NotFoundError(`Client ${id} not found`);
    return client;
  }

  async getAll(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [clients, total] = await Promise.all([
      this.clientRepo.findAll(skip, pageSize),
      this.clientRepo.count(),
    ]);
    return { clients, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async update(id: string, data: Partial<{ name: string; email: string | null; phone: string | null; address: string | null }>) {
    await this.getById(id);
    const updated = await this.clientRepo.update(id, data);
    logger.info('Client updated', { clientId: id });
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.clientRepo.delete(id);
    logger.info('Client deleted', { clientId: id });
  }
}

// ============================================================================
// PACKET SERVICE
// ============================================================================

export class PacketService {
  private packetRepo = new PacketRepository();
  private employeeRepo = new EmployeeRepository();
  private clientRepo = new ClientRepository();

  async create(userId: string, data: {
    clientId: string;
    description?: string;
    weight?: number;
    carat?: number;
    tyareWeight?: number;
    color?: string;
    kasuWeight?: number;
    peroty?: number;
    shape?: string;
    cut?: string;
    polishWeight?: number;
  }) {
    // Validate client exists
    const client = await this.clientRepo.findById(data.clientId);
    if (!client) throw new NotFoundError(`Client ${data.clientId} not found`);

    // Validate kasu_weight <= tyare_weight
    if (data.kasuWeight !== undefined && data.tyareWeight !== undefined && data.kasuWeight > data.tyareWeight) {
      throw new ValidationError('Kasu weight cannot be greater than Tyare weight');
    }

    const packet = await this.packetRepo.create({
      userId,
      clientId: data.clientId,
      description: data.description || null,
      weight: data.weight?.toString(),
      carat: data.carat?.toString(),
      tyareWeight: data.tyareWeight?.toString(),
      color: data.color || null,
      kasuWeight: data.kasuWeight?.toString(),
      peroty: data.peroty?.toString(),
      shape: data.shape || null,
      cut: data.cut || null,
      polishWeight: data.polishWeight?.toString(),
    });
    logger.info('Packet created', { packetId: packet.id, userId, clientId: data.clientId });
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

  async update(id: string, data: {
    clientId?: string;
    description?: string;
    weight?: number;
    carat?: number;
    tyareWeight?: number;
    color?: string;
    kasuWeight?: number;
    peroty?: number;
    shape?: string;
    cut?: string;
    polishWeight?: number;
  }) {
    await this.getById(id);

    // Validate client exists if clientId is being updated
    if (data.clientId) {
      const client = await this.clientRepo.findById(data.clientId);
      if (!client) throw new NotFoundError(`Client ${data.clientId} not found`);
    }

    // Validate kasu_weight <= tyare_weight
    if (data.kasuWeight !== undefined && data.tyareWeight !== undefined && data.kasuWeight > data.tyareWeight) {
      throw new ValidationError('Kasu weight cannot be greater than Tyare weight');
    }

    const updateData: any = {};
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.weight !== undefined) updateData.weight = data.weight.toString();
    if (data.carat !== undefined) updateData.carat = data.carat.toString();
    if (data.tyareWeight !== undefined) updateData.tyareWeight = data.tyareWeight.toString();
    if (data.color !== undefined) updateData.color = data.color;
    if (data.kasuWeight !== undefined) updateData.kasuWeight = data.kasuWeight.toString();
    if (data.peroty !== undefined) updateData.peroty = data.peroty.toString();
    if (data.shape !== undefined) updateData.shape = data.shape;
    if (data.cut !== undefined) updateData.cut = data.cut;
    if (data.polishWeight !== undefined) updateData.polishWeight = data.polishWeight.toString();

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
