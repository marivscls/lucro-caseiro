import { fileURLToPath } from "node:url";

import postgres from "postgres";

export const securityMigrationFiles = [
  "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
  "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
] as const;

export function getSecurityMigrationPaths(baseUrl = import.meta.url): string[] {
  return securityMigrationFiles.map((file) => fileURLToPath(new URL(file, baseUrl)));
}

export async function runSecurityMigrations(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    for (const migrationPath of getSecurityMigrationPaths()) {
      await sql.file(migrationPath);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
