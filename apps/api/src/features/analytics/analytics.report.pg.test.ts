import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";

describe("dashboard cohort semantics", () => {
  let pg: PGlite;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`SET TIME ZONE 'UTC'; CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE users(id uuid PRIMARY KEY, created_at timestamptz);
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, created_at timestamptz);
      INSERT INTO users VALUES ('11111111-1111-4111-8111-111111111111', now());
      INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111', now() - interval '60 days');`);
    for (const name of [
      "034_product_analytics.sql",
      "035_analytics_behavior_events.sql",
    ]) {
      await pg.exec(
        readFileSync(`../../packages/database/src/migrations/${name}`, "utf8"),
      );
    }
    await pg.exec(`INSERT INTO analytics_installations(id, platform, app_version, first_opened_at, last_opened_at)
      VALUES ('22222222-2222-4222-8222-222222222222', 'android', '1', now()-interval '7 days', now());
      INSERT INTO analytics_events(installation_id,user_id,event_type,event_name,app_version,occurred_at)
      VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','action','sale_completed','1',now());`);
  }, 30000);
  afterAll(async () => {
    await pg?.close();
  });

  it("counts an authenticated account by its original signup date", async () => {
    const { rows } = await pg.query(ANALYTICS_DASHBOARD_QUERY);
    expect(rows[0]).toMatchObject({ signups_total: 1, signups_30d: 0 });
  });
  it("recognizes a direct sale without requiring pricing first", async () => {
    const { rows } = await pg.query(ANALYTICS_DASHBOARD_QUERY);
    expect(rows[0]).toMatchObject({ activated_users_total: 1 });
  });
  it("does not classify today's still-open D7 window as lost", async () => {
    const { rows } = await pg.query(ANALYTICS_DASHBOARD_QUERY);
    expect(rows[0]).toMatchObject({ eligible_d7: 0 });
  });
});
