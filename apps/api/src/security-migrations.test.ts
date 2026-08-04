import { describe, expect, it } from "vitest";

import { securityMigrationFiles } from "./security-migrations";

describe("security migrations", () => {
  it("loads the purchase claim and persistent rate-limit migrations in order", () => {
    expect(securityMigrationFiles).toEqual([
      "../../../packages/database/src/migrations/049_subscription_purchase_claims.sql",
      "../../../packages/database/src/migrations/050_api_rate_limit_buckets.sql",
    ]);
  });
});
