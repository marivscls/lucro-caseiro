import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getSecurityMigrationPaths, securityMigrationFiles } from "./security-migrations";

describe("security migrations", () => {
  it("loads required startup migrations in order", () => {
    expect(securityMigrationFiles).toEqual([
      "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
      "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
      "../../../packages/database/src/migrations/052_professional_trial_campaign.sql",
      "../../../packages/database/src/migrations/056_vertical_apps_foundation.sql",
      "../../../packages/database/src/migrations/057_end_professional_trial_campaign.sql",
      "../../../packages/database/src/migrations/058_catalog_promo_visibility.sql",
      "../../../packages/database/src/migrations/059_catalog_text_colors.sql",
    ]);
  });

  it("locks the vertical tables behind the API", () => {
    const migrationPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("056_vertical_apps_foundation.sql"),
    );
    const migration = readFileSync(migrationPath!, "utf8");
    for (const table of [
      "app_memberships",
      "vertical_documents",
      "vertical_document_items",
      "vertical_events",
      "vertical_assets",
      "resale_serials",
    ]) {
      expect(migration).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
    expect(migration).toContain("FROM anon, authenticated");
  });

  it("ends the professional trial only for future grants", () => {
    const migrationPath = getSecurityMigrationPaths().find((path) =>
      path.endsWith("057_end_professional_trial_campaign.sql"),
    );
    const migration = readFileSync(migrationPath!, "utf8");

    expect(migration).toContain("SET active = false");
    expect(migration).not.toContain("DELETE FROM");
    expect(migration).not.toContain("UPDATE public.users");
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
