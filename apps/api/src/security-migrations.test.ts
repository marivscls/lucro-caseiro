import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getSecurityMigrationPaths, securityMigrationFiles } from "./security-migrations";

describe("security migrations", () => {
  it("loads required startup migrations in order", () => {
    expect(securityMigrationFiles).toEqual([
      "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
      "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
      "../../../packages/database/src/migrations/052_professional_trial_campaign.sql",
      "../../../packages/database/src/migrations/058_catalog_promo_visibility.sql",
      "../../../packages/database/src/migrations/059_catalog_text_colors.sql",
      "../../../packages/database/src/migrations/060_storefront_customization.sql",
      "../../../packages/database/src/migrations/061_supplier_management.sql",
    ]);
  });
  it("installs supplier management fields before startup", () => {
    const migrationPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("061_supplier_management.sql"),
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const migration = readFileSync(migrationPath!, "utf8");

    expect(migration).toContain("category text NOT NULL DEFAULT 'other'");
    expect(migration).toContain("has_whatsapp boolean NOT NULL DEFAULT false");
    expect(migration).toContain("is_active boolean NOT NULL DEFAULT true");
  });
  it("installs the catalog promotion visibility columns before the API starts", () => {
    const migrationPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("058_catalog_promo_visibility.sql"),
    );
    // Caminho interno e enumerado por securityMigrationFiles.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const migration = readFileSync(migrationPath!, "utf8");

    expect(migration).toContain("promo_banner_enabled boolean NOT NULL DEFAULT true");
    expect(migration).toContain(
      "service_promo_banner_enabled boolean NOT NULL DEFAULT true",
    );
  });

  it("installs the catalog text color columns before the API starts", () => {
    const migrationPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("059_catalog_text_colors.sql"),
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const migration = readFileSync(migrationPath!, "utf8");

    expect(migration).toContain("title_color text");
    expect(migration).toContain("description_color text");
    expect(migration).toContain("service_title_color text");
    expect(migration).toContain("service_description_color text");
  });
});
it("installs the versioned storefront customization document before startup", () => {
  const migrationPath = getSecurityMigrationPaths().find((path) =>
    path.endsWith("060_storefront_customization.sql"),
  );
  // Caminho interno e enumerado por securityMigrationFiles.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const migration = readFileSync(migrationPath!, "utf8");

  expect(migration).toContain("ADD COLUMN IF NOT EXISTS customization jsonb");
  expect(migration).toContain("ADD COLUMN IF NOT EXISTS published_customization jsonb");
  expect(migration).toContain("ADD COLUMN IF NOT EXISTS published_products jsonb");
  expect(migration).toContain("ADD COLUMN IF NOT EXISTS published_services jsonb");
});
