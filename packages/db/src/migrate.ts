import type { Sql } from "postgres";

import { MIGRATIONS } from "./migrations/index";

const MIGRATIONS_TABLE_DDL = `
  create schema if not exists _meta;
  create table if not exists _meta.schema_migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )
`;

async function ensureMigrationsTable(sql: Sql): Promise<void> {
  for (const stmt of MIGRATIONS_TABLE_DDL.split(";")
    .map((s) => s.trim())
    .filter(Boolean)) {
    await sql.unsafe(stmt);
  }
}

async function appliedMigrationIds(sql: Sql): Promise<Set<string>> {
  const rows = await sql<{ id: string }[]>`select id from _meta.schema_migrations`;
  return new Set(rows.map((r) => r.id));
}

export async function runMigrations(sql: Sql): Promise<void> {
  await ensureMigrationsTable(sql);
  const applied = await appliedMigrationIds(sql);

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;

    // Run each statement individually (connection-pooler safe)
    const statements = migration.sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }

    await sql`insert into _meta.schema_migrations (id) values (${migration.id})`;
  }
}
