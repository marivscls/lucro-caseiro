import type * as schema from "@lucro-caseiro/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

let _db: AppDatabase | null = null;

export function setDb(db: AppDatabase) {
  _db = db;
}

export function getDb(): AppDatabase {
  if (!_db) throw new Error("Database not initialized");
  return _db;
}
