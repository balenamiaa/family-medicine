import { defineConfig } from "drizzle-kit";

const rawDatabaseUrl = process.env.STUDY_POSTGRES_PRISMA_URL!;
const drizzleSslMode = process.env.DRIZZLE_SSLMODE;

function withQueryParam(url: string, key: string, value?: string) {
  if (!value) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: withQueryParam(rawDatabaseUrl, "sslmode", drizzleSslMode),
  },
});
