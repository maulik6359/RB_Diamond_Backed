// ============================================================================
// DATABASE CONNECTION - DRIZZLE ORM
// ============================================================================

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import * as schema from "./schema/schema.js";

// ============================================================================
// DATABASE INSTANCE
// ============================================================================

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: Pool | null = null;

export function initializeDbConnection(): ReturnType<
  typeof drizzle<typeof schema>
> | null {
  if (db) {
    return db;
  }

  try {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: config.DATABASE_POOL_MAX,
      min: config.DATABASE_POOL_MIN,
    });

    db = drizzle(pool, {
      schema,
      logger: config.NODE_ENV === "development",
    });

    return db;
  } catch (error) {
    logger.error("Error initializing database connection", { error });
    return null;
  }
}

// ============================================================================
// CONNECTION VERIFICATION
// ============================================================================

export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    await initializeDbConnection();
    // logger.info("Database connection verified");
    return true;
  } catch (error) {
    logger.error("Database connection failed", { error });
    return false;
  }
}

// ============================================================================
// CLOSE CONNECTIONS
// ============================================================================

export async function closeAllConnections() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      db = null;
    }
    logger.info("Database connections closed");
  } catch (error) {
    logger.error("Error closing database connections", { error });
  }
}
