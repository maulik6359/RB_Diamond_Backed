// ============================================================================
// REPOSITORY LAYER - DATA ACCESS (DRIZZLE ORM)
// ============================================================================

import { eq, sql } from "drizzle-orm";
import { initializeDbConnection } from "../database/db.js";
import * as schema from "../database/schema/schema.js";

// ============================================================================
// USER REPOSITORY
// ============================================================================

export class UserRepository {
  private get db(): any {
    return initializeDbConnection();
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByUsername(username: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return result[0] || null;
  }

  async create(data: {
    username: string;
    password: string;
    email: string;
    phone?: string | null;
  }) {
    const result = await this.db.insert(schema.users).values(data).returning();
    return result[0];
  }
}

// ============================================================================
// EMPLOYEE REPOSITORY
// ============================================================================

export class EmployeeRepository {
  private get db(): any {
    return initializeDbConnection();
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findAll(skip = 0, take = 20) {
    return await this.db
      .select()
      .from(schema.employees)
      .offset(skip)
      .limit(take);
  }

  async findByType(type: string) {
    return await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.type, type));
  }

  async create(data: { name: string; type: string; phone?: string | null }) {
    const result = await this.db
      .insert(schema.employees)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{ name: string; type: string; phone: string | null }>,
  ) {
    const result = await this.db
      .update(schema.employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.employees.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(schema.employees).where(eq(schema.employees.id, id));
  }

  async count() {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.employees);
    return result[0]?.count || 0;
  }
  async findByName(name: string) {
    const result = await this.db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.name, name))
      .limit(1);
    return result[0] || null;
  }
}

// ============================================================================
// CLIENT REPOSITORY
// ============================================================================

export class ClientRepository {
  private get db(): any {
    return initializeDbConnection();
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findAll(skip = 0, take = 20) {
    return await this.db
      .select()
      .from(schema.clients)
      .offset(skip)
      .limit(take);
  }

  async findByName(name: string) {
    const result = await this.db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.name, name))
      .limit(1);
    return result[0] || null;
  }

  async create(data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }) {
    const result = await this.db
      .insert(schema.clients)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
    }>,
  ) {
    const result = await this.db
      .update(schema.clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.clients.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(schema.clients).where(eq(schema.clients.id, id));
  }

  async count() {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.clients);
    return result[0]?.count || 0;
  }
}

// ============================================================================
// PACKET REPOSITORY
// ============================================================================

export class PacketRepository {
  private get db(): any {
    return initializeDbConnection();
  }

  async findById(id: string) {
    const result = await this.db.query.packets.findFirst({
      where: eq(schema.packets.id, id),
      with: {
        user: true,
        employee: true,
        client: true,
      },
    });
    return result || null;
  }

  async findAll(skip = 0, take = 20) {
    return await this.db.query.packets.findMany({
      offset: skip,
      limit: take,
      with: { user: true, employee: true, client: true },
      // orderBy: (packets, { desc }) => [desc(packets.createdAt)],
    });
  }

  async findByUserId(userId: string, skip = 0, take = 20) {
    return await this.db.query.packets.findMany({
      where: eq(schema.packets.userId, userId),
      offset: skip,
      limit: take,
      with: { user: true, employee: true, client: true },
      // orderBy: (packets, { desc }) => [desc(packets.createdAt)],
    });
  }

  async findByStatus(status: string, skip = 0, take = 20) {
    return await this.db.query.packets.findMany({
      where: eq(schema.packets.status, status),
      offset: skip,
      limit: take,
      with: { user: true, employee: true, client: true },
    });
  }

  async findByEmployeeId(employeeId: string) {
    return await this.db.query.packets.findMany({
      where: eq(schema.packets.employeeId, employeeId),
      with: { user: true, employee: true, client: true },
    });
  }

  async create(data: {
    userId: string;
    clientId?: string | null;
    description?: string | null;
    weight?: string;
    carat?: string;
    tyareWeight?: string;
    color?: string | null;
    kasuWeight?: string;
    peroty?: string;
    shape?: string | null;
    cut?: string | null;
    polishWeight?: string;
  }) {
    const result = await this.db
      .insert(schema.packets)
      .values({ ...data, status: "created" })
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{
      employeeId: string | null;
      clientId: string | null;
      status: string;
      description: string | null;
      weight: string;
      carat: string;
      tyareWeight: string;
      color: string | null;
      kasuWeight: string;
      peroty: string;
      shape: string | null;
      cut: string | null;
      polishWeight: string;
    }>,
  ) {
    const result = await this.db
      .update(schema.packets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.packets.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    await this.db.delete(schema.packets).where(eq(schema.packets.id, id));
  }

  async count(status?: string) {
    const conditions = status ? eq(schema.packets.status, status) : undefined;
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.packets)
      .where(conditions);
    return result[0]?.count || 0;
  }

  async getStatusSummary() {
    return await this.db
      .select({
        status: schema.packets.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(schema.packets)
      .groupBy(schema.packets.status);
  }
}

// ============================================================================
// DASHBOARD REPOSITORY
// ============================================================================

export class DashboardRepository {
  private get db(): any {
    return initializeDbConnection();
  }

  async getDashboard() {
    // Fetch all packets with related data
    const packets = await this.db.query.packets.findMany({
      with: {
        user: true,
        employee: true,
        client: true,
      },
      orderBy: (packets: any, { desc }: any) => [desc(packets.createdAt)],
    });

    // Calculate stats in memory to avoid multiple DB calls
    const stats = {
      total: packets.length,
      byStatus: {
        created: packets.filter((p: any) => p.status === 'created').length,
        assigned: packets.filter((p: any) => p.status === 'assigned').length,
        done: packets.filter((p: any) => p.status === 'done').length,
        reviewed: packets.filter((p: any) => p.status === 'reviewed').length,
      }
    };

    return { stats, packets };
  }
}