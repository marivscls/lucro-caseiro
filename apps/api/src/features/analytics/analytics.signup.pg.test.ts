import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { AnalyticsRepoPg } from "./analytics.repo.pg";

const USER = "11111111-1111-4111-8111-111111111111";
const INSTALLATION = "22222222-2222-4222-8222-222222222222";
const OTHER_INSTALLATION = "33333333-3333-4333-8333-333333333333";
const openedAt = new Date("2026-09-28T12:00:00Z");
const open = {
  installationId: INSTALLATION,
  platform: "android" as const,
  appVersion: "1.2.1",
  appBuild: "30",
  openedAt,
  activityDate: "2026-09-28",
};

describe("signup analytics from authenticated accounts", () => {
  let pg: PGlite;
  let repo: AnalyticsRepoPg;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`
      SET TIME ZONE 'UTC';
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE users(id uuid PRIMARY KEY);
      CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, created_at timestamptz NOT NULL);
      INSERT INTO users VALUES ('${USER}');
      INSERT INTO auth.users VALUES ('${USER}', '2026-09-28T11:59:00Z');
    `);
    for (const migration of [
      "034_product_analytics.sql",
      "035_analytics_behavior_events.sql",
    ]) {
      await pg.exec(
        readFileSync(`../../packages/database/src/migrations/${migration}`, "utf8"),
      );
    }
    await pg.exec(`ALTER TABLE analytics_installations
      ADD COLUMN utm_source text, ADD COLUMN utm_medium text,
      ADD COLUMN utm_campaign text, ADD COLUMN utm_content text;`);
    repo = new AnalyticsRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  beforeEach(async () => {
    await pg.exec(`TRUNCATE analytics_installations CASCADE;
      UPDATE auth.users SET created_at='2026-09-28T11:59:00Z';`);
  });

  afterAll(async () => {
    await pg?.close();
  });

  it("accepts late attribution but preserves the original campaign on future opens", async () => {
    await repo.recordOpen(null, open);
    await repo.recordOpen(USER, {
      ...open,
      attribution: {
        source: "instagram",
        medium: "social",
        campaign: "retomada_202609",
        content: "preco",
      },
    });
    await repo.recordOpen(USER, {
      ...open,
      attribution: {
        source: "whatsapp",
        medium: "social",
        campaign: "outra",
      },
    });
    expect(
      (
        await pg.query(`SELECT utm_source, utm_medium, utm_campaign, utm_content
      FROM analytics_installations`)
      ).rows,
    ).toEqual([
      {
        utm_source: "instagram",
        utm_medium: "social",
        utm_campaign: "retomada_202609",
        utm_content: "preco",
      },
    ]);
  });

  it("records signup when Google identifies the app without a register-screen event", async () => {
    await repo.recordOpen(null, open);
    await repo.recordOpen(USER, open);
    expect(
      (
        await pg.query(`SELECT user_id, event_name, occurred_at::text
      FROM analytics_events`)
      ).rows,
    ).toEqual([
      {
        user_id: USER,
        event_name: "signup_completed",
        occurred_at: "2026-09-28 11:59:00+00",
      },
    ]);
  });

  it("counts the same account only once across repeated opens and two installations", async () => {
    await Promise.all([
      repo.recordOpen(USER, open),
      repo.recordOpen(USER, { ...open, installationId: OTHER_INSTALLATION }),
    ]);
    await repo.recordOpen(USER, open);
    expect(
      (await pg.query("SELECT count(*)::int AS count FROM analytics_events")).rows,
    ).toEqual([{ count: 1 }]);
  });

  it("does not turn an old account returning today into a signup today", async () => {
    await pg.exec("UPDATE auth.users SET created_at='2026-08-10T10:00:00Z'");
    await repo.recordOpen(USER, open);
    expect(
      (await pg.query("SELECT occurred_at::date::text AS day FROM analytics_events"))
        .rows,
    ).toEqual([{ day: "2026-08-10" }]);
  });

  it("ignores client signup claims while preserving other actions", async () => {
    await repo.recordEvents(null, {
      ...open,
      occurredAt: openedAt,
      events: [
        { type: "action", name: "signup_completed" },
        { type: "action", name: "pricing_completed" },
      ],
    });
    expect((await pg.query("SELECT event_name FROM analytics_events")).rows).toEqual([
      { event_name: "pricing_completed" },
    ]);
    await repo.recordEvents(USER, {
      ...open,
      occurredAt: openedAt,
      events: [{ type: "action", name: "signup_completed" }],
    });
    expect(
      (
        await pg.query(
          "SELECT count(*)::int AS count FROM analytics_events WHERE event_name='signup_completed'",
        )
      ).rows,
    ).toEqual([{ count: 1 }]);
  });
});
