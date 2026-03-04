import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema/schema.ts",
  out: "./src/database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
});
