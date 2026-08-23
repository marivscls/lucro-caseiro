import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getSecurityMigrationPaths, securityMigrationFiles } from "./security-migrations";

describe("security migrations", () => {
  it("loads required startup migrations in order", () => {
    expect(securityMigrationFiles).toEqual([
      "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
      "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
      "../../../packages/database/src/migrations/052_professional_trial_campaign.sql",
      "../../../packages/database/src/migrations/057_end_professional_trial_campaign.sql",
      "../../../packages/database/src/migrations/062_disable_professional_trial_signup.sql",
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

  it("disables professional trial grants for new signups after campaign migrations", () => {
    const campaignPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("052_professional_trial_campaign.sql"),
    );
    const disablePath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("062_disable_professional_trial_signup.sql"),
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const campaign = readFileSync(campaignPath!, "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const disable = readFileSync(disablePath!, "utf8");

    expect(campaign).toContain("active = false");
    expect(campaign).not.toContain("grants_count = grants_count + 1");
    expect(disable).toContain("SET active = false");
    expect(disable).not.toContain("grants_count + 1");
    expect(
      securityMigrationFiles.indexOf(
        "../../../packages/database/src/migrations/052_professional_trial_campaign.sql",
      ),
    ).toBeLessThan(
      securityMigrationFiles.indexOf(
        "../../../packages/database/src/migrations/062_disable_professional_trial_signup.sql",
      ),
    );
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
