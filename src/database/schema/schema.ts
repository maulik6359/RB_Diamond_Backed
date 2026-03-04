// ============================================================================
// DATABASE SCHEMA - DRIZZLE ORM
// Tables: users, employees, clients, packets
// ============================================================================

import { pgTable, varchar, text, timestamp, decimal, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    username: varchar('username', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('users_username_idx').on(table.username),
    index('users_email_idx').on(table.email),
  ]
);

// ============================================================================
// EMPLOYEES TABLE
// ============================================================================

export const employees = pgTable(
  'employees',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // pel | dhar | ghodi | table
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('employees_type_idx').on(table.type),
  ]
);

// ============================================================================
// CLIENTS TABLE
// ============================================================================

export const clients = pgTable(
  'clients',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('clients_name_idx').on(table.name),
  ]
);

// ============================================================================
// PACKETS TABLE
// ============================================================================

export const packets = pgTable(
  'packets',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    employeeId: varchar('employee_id', { length: 128 })
      .references(() => employees.id, { onDelete: 'set null' }),
    clientId: varchar('client_id', { length: 128 })
      .references(() => clients.id, { onDelete: 'restrict' }),
    status: varchar('status', { length: 20 }).notNull().default('created'),
    description: text('description'),
    weight: decimal('weight', { precision: 10, scale: 4 }),
    carat: decimal('carat', { precision: 10, scale: 4 }),
    tyareWeight: decimal('tyare_weight', { precision: 10, scale: 4 }),
    color: varchar('color', { length: 50 }),
    kasuWeight: decimal('kasu_weight', { precision: 10, scale: 4 }),
    peroty: decimal('peroty', { precision: 10, scale: 4 }),
    shape: varchar('shape', { length: 50 }),
    cut: varchar('cut', { length: 50 }),
    polishWeight: decimal('polish_weight', { precision: 10, scale: 4 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('packets_user_id_idx').on(table.userId),
    index('packets_employee_id_idx').on(table.employeeId),
    index('packets_client_id_idx').on(table.clientId),
    index('packets_status_idx').on(table.status),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  packets: many(packets),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  packets: many(packets),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  packets: many(packets),
}));

export const packetsRelations = relations(packets, ({ one }) => ({
  user: one(users, {
    fields: [packets.userId],
    references: [users.id],
  }),
  employee: one(employees, {
    fields: [packets.employeeId],
    references: [employees.id],
  }),
  client: one(clients, {
    fields: [packets.clientId],
    references: [clients.id],
  }),
}));
