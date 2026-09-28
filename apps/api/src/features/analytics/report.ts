import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";
import { acquisitionQuery } from "./analytics.acquisition-query";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes("<") || databaseUrl.includes(">")) {
  throw new Error(
    "DATABASE_URL real não configurada; substitua os placeholders do apps/api/.env para consultar as métricas",
  );
}

const db = postgres(databaseUrl, { max: 1, prepare: false });

try {
  const [metrics] = await db.unsafe(ANALYTICS_DASHBOARD_QUERY);
  const excluded = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const [acquisition] = await drizzle(db).execute<{ report: unknown }>(
    acquisitionQuery(excluded),
  );
  console.warn(JSON.stringify({ ...metrics, acquisition: acquisition?.report }, null, 2));
} finally {
  await db.end();
}
