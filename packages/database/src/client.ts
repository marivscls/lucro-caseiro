import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";

export function createClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, { prepare: false });
  return drizzle(sql, { schema });
}
