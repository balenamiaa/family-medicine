import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // For build time or when DB is not configured
  if (!connectionString) {
    console.warn("[DB] DATABASE_URL not set - using no-op client");
    // Return a client that will throw clear errors at runtime
    const handler = {
      get(_target: any, prop: string) {
        if (prop === "$connect" || prop === "$disconnect") {
          return () => Promise.resolve();
        }
        return () => {
          throw new Error(`Database not configured. Set DATABASE_URL environment variable.`);
        };
      },
    };
    return new Proxy({} as PrismaClient, handler);
  }

  // Create or reuse connection pool
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 10, // Max connections in pool
      idleTimeoutMillis: 30000,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
