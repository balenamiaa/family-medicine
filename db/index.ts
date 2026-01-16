import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment
const connectionString = process.env.STUDY_POSTGRES_PRISMA_URL;

// Prevent multiple instances in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

function createConnection() {
  if (!connectionString) {
    throw new Error(
      "STUDY_POSTGRES_PRISMA_URL is not set. Please configure your database connection."
    );
  }

  // Reuse connection in development
  if (globalForDb.conn) {
    return globalForDb.conn;
  }

  const conn = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
  }

  return conn;
}

// Create the database client
// In build/static generation, we don't want to fail
let db: ReturnType<typeof drizzle<typeof schema>>;

try {
  const conn = createConnection();
  db = drizzle(conn, { schema });
} catch (error) {
  // During build time without DB, create a proxy that throws helpful errors
  console.warn("[DB] Database not configured - operations will fail at runtime");
  db = new Proxy({} as any, {
    get(_, prop) {
      return () => {
        throw new Error("Database not configured. Set STUDY_POSTGRES_PRISMA_URL.");
      };
    },
  });
}

export { db };
export * from "./schema";
