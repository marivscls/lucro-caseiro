import { fileURLToPath } from "node:url";

import postgres from "postgres";

export const securityMigrationFiles = [
  "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
  "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
  "../../../packages/database/src/migrations/052_professional_trial_campaign.sql",
  "../../../packages/database/src/migrations/058_catalog_promo_visibility.sql",
  "../../../packages/database/src/migrations/059_catalog_text_colors.sql",
  "../../../packages/database/src/migrations/060_storefront_customization.sql",
  "../../../packages/database/src/migrations/061_supplier_management.sql",
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
