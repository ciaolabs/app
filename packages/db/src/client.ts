import postgres, { type Sql } from "postgres";

import { RAG_SCHEMA_SQL, SHARED_SCHEMA_SQL } from "./schema";

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

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
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
    });
  }

  return client;
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runEnsureSchema().catch((error) => {
      schemaReady = null; // allow retry on next request
      throw error;
    });
  }

  return schemaReady;
}

async function runEnsureSchema(): Promise<void> {
  const sql = getDb();

  // Fast path: if all required tables exist, skip DDL entirely.
  const check = await sql<{ cnt: string }[]>`
    select count(*) as cnt
    from information_schema.tables
    where table_schema = 'app_private'
      and table_name in ('user_accounts', 'user_api_keys', 'user_preferences',
                         'chat_threads', 'chat_messages')
  `;
  if (Number(check[0]?.cnt ?? 0) >= 5) return;

  // Schema not fully set up — run the full DDL. Split into individual
  // statements so transaction-mode connection poolers handle them correctly.
  const statements = SHARED_SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }
}

export async function getReadyDb(): Promise<Sql> {
  await ensureSchema();
  return getDb();
}

let ragSchemaReady: Promise<void> | null = null;

export function ensureRagSchema(): Promise<void> {
  if (!ragSchemaReady) {
    ragSchemaReady = runEnsureRagSchema().catch((error) => {
      ragSchemaReady = null;
      throw error;
    });
  }
  return ragSchemaReady;
}

async function runEnsureRagSchema(): Promise<void> {
  const sql = getDb();
  const [check] = await sql<{ cnt: string }[]>`
    select count(*) as cnt
    from information_schema.tables
    where table_schema = 'research' and table_name = 'doc_chunks'
  `;
  if (Number(check?.cnt ?? 0) >= 1) return;

  const statements = RAG_SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.unsafe(statement);
  }
}

export type { Sql };
