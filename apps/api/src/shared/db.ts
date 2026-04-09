import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

let _db: PostgresJsDatabase | null = null;

export function setDb(db: PostgresJsDatabase) {
  _db = db;
}

export function getDb(): PostgresJsDatabase {
  if (!_db) throw new Error("Database not initialized");
  return _db;
}
