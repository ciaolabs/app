import postgres, { type Sql } from "postgres";

import { SHARED_SCHEMA_SQL } from "./schema";

let client: Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function getDb(): Sql {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for postgres storage.");
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
  }

  return client;
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getDb().unsafe(SHARED_SCHEMA_SQL).then(() => undefined);
  }

  return schemaReady;
}

export type { Sql };
