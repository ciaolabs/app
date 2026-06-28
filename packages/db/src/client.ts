import postgres, { type Sql } from "postgres";

import { runMigrations } from "./migrate";

let client: Sql | null = null;
let schemaReady: Promise<void> | null = null;

export class DatabaseConfigurationError extends Error {
  constructor() {
    super(
      "A Postgres connection string is required. Set DATABASE_URL or POSTGRES_URL in the environment.",
    );
    this.name = "DatabaseConfigurationError";
  }
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "\"\"" || trimmed === "''") {
    return undefined;
  }
  return trimmed;
}

function getDatabaseUrl(): string | undefined {
  return (
    normalizeEnvValue(process.env.DATABASE_URL) ||
    normalizeEnvValue(process.env.POSTGRES_URL) ||
    normalizeEnvValue(process.env.POSTGRES_PRISMA_URL)
  );
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getDb(): Sql {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new DatabaseConfigurationError();
  }

  if (!client) {
    client = postgres(databaseUrl, {
      max: 1,
      prepare: false,
      ssl: "require",
      // Fail fast instead of hanging the request when the database or the
      // Supavisor pooler is unreachable (e.g. paused/saturated). Without a
      // bound, a stalled connection leaves server renders (notably /app, which
      // loads threads + preferences before rendering) pending until the
      // platform kills the function — surfacing as a timeout / blank page.
      connect_timeout: 10, // seconds
      idle_timeout: 20, // seconds — release idle pooled connections
    });
  }

  return client;
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runMigrations(getDb()).catch((error) => {
      schemaReady = null; // allow retry on next request
      throw error;
    });
  }

  return schemaReady;
}

/** Alias kept for callers that previously called ensureRagSchema() separately. */
export function ensureRagSchema(): Promise<void> {
  return ensureSchema();
}

export async function getReadyDb(): Promise<Sql> {
  await ensureSchema();
  return getDb();
}

export type { Sql };
