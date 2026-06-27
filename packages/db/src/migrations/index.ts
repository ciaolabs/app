import { DROP_USER_API_KEYS_SQL, RAG_SCHEMA_SQL, SHARED_SCHEMA_SQL } from "../schema";

export type Migration = { id: string; sql: string };

export const MIGRATIONS: Migration[] = [
  { id: "0001", sql: SHARED_SCHEMA_SQL },
  { id: "0002", sql: RAG_SCHEMA_SQL },
  { id: "0003", sql: DROP_USER_API_KEYS_SQL },
];
