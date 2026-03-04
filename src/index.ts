// ============================================================================
// MAIN APPLICATION ENTRY POINT
// ============================================================================

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import {
  requestIdMiddleware,
  errorHandler,
  requestLogger,
} from "./middleware/index.js";
import { createRoutes } from "./routes/index.js";
import { logger } from "./utils/logger.js";
import {
  verifyDatabaseConnection,
  closeAllConnections,
  initializeDbConnection,
} from "./database/db.js";
import { sql } from "drizzle-orm";

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

const app: Express = express();

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      (config.CORS_ORIGIN as string | string[]) || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Tracing and logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// ============================================================================
// ROUTES
// ============================================================================

// API routes with version prefix (no longer passing prisma instance)
app.use("/api/v1", createRoutes());

// Health check (no auth required)
app.get("/health", async (_req, res) => {
  try {
    const db = initializeDbConnection();
    if (!db) {
      throw new Error("Database connection not initialized");
    }
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error("Database health check failed", { error });
    res.status(500).json({ status: "database error" });
  }
});

// ============================================================================
// ERROR HANDLING (MUST BE LAST)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function connectDatabase() {
  try {
    await verifyDatabaseConnection();
    // logger.info("✓ Database connected successfully");
  } catch (error) {
    logger.error("✗ Database connection failed", { error });
    process.exit(1);
  }
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

export async function startServer(port?: number) {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    const serverPort = port || config.PORT;
    const server = app.listen(serverPort, () => {
      logger.info(`✓ Server running on port ${serverPort}`);
      logger.info(`✓ Environment: ${config.NODE_ENV}`);
      logger.info(`✓ API: http://localhost:${serverPort}/api/v1`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down gracefully...");
      server.close(async () => {
        await closeAllConnections();
        logger.info("✓ Database disconnected");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server", { error });
    await closeAllConnections();
    process.exit(1);
  }
}

// ============================================================================
// ============================================================================
// START IF CALLED DIRECTLY
// ============================================================================

if (process.env.NODE_ENV === "development") {
  startServer();
}

export { app };
