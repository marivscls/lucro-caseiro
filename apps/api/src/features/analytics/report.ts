import postgres from "postgres";

import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.includes("<") || databaseUrl.includes(">")) {
  throw new Error(
    "DATABASE_URL real não configurada; substitua os placeholders do apps/api/.env para consultar as métricas",
  );
}

const db = postgres(databaseUrl, { max: 1, prepare: false });

try {
  const [metrics] = await db.unsafe(ANALYTICS_DASHBOARD_QUERY);
  console.warn(JSON.stringify(metrics, null, 2));
} finally {
  await db.end();
}
