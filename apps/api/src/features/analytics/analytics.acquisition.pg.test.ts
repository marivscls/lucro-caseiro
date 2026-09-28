import { PGlite } from "@electric-sql/pglite";
import { PgDialect } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { acquisitionQuery } from "./analytics.acquisition-query";

const admin = "99999999-9999-4999-8999-999999999999";
const asOf = new Date("2026-09-28T12:00:00Z");

describe("account cohorts and first value", () => {
  let pg: PGlite;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`SET TIME ZONE 'UTC'; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid, created_at timestamptz, confirmed_at timestamptz);
      CREATE TABLE analytics_user_activity_days(user_id uuid, activity_date date);
      CREATE TABLE analytics_events(user_id uuid,event_type text,event_name text,occurred_at timestamptz);
      CREATE TABLE products(user_id uuid,created_at timestamptz);
      CREATE TABLE sales(user_id uuid,created_at timestamptz);
      CREATE TABLE pricing_calculations(user_id uuid,created_at timestamptz);
      CREATE TABLE orders(user_id uuid,created_at timestamptz);
      CREATE TABLE analytics_installations(id uuid,first_opened_at timestamptz,utm_source text,utm_medium text,utm_campaign text);
      INSERT INTO auth.users VALUES
        ('11111111-1111-4111-8111-111111111111','2026-09-20T12:00:00Z','2026-09-20T12:00:00Z'),
        ('22222222-2222-4222-8222-222222222222','2026-09-21T12:00:00Z','2026-09-21T12:00:00Z'),
        ('33333333-3333-4333-8333-333333333333','2026-09-27T12:00:00Z','2026-09-27T12:00:00Z'),
        ('44444444-4444-4444-8444-444444444444','2026-09-20T12:00:00Z',NULL),
        ('${admin}','2026-09-20T12:00:00Z','2026-09-20T12:00:00Z');
      INSERT INTO sales VALUES
        ('11111111-1111-4111-8111-111111111111','2026-09-20T12:10:00Z'),
        ('11111111-1111-4111-8111-111111111111','2026-09-20T12:20:00Z');
      INSERT INTO products VALUES ('11111111-1111-4111-8111-111111111111','2026-09-20T12:30:00Z');
      INSERT INTO analytics_user_activity_days VALUES
        ('11111111-1111-4111-8111-111111111111','2026-09-21'),
        ('11111111-1111-4111-8111-111111111111','2026-09-27'),
        ('33333333-3333-4333-8333-333333333333','2026-09-28');
      INSERT INTO analytics_installations VALUES
        ('55555555-5555-4555-8555-555555555555','2026-09-20',NULL,NULL,NULL);`);
  }, 30000);
  afterAll(async () => {
    await pg?.close();
  });
  async function report() {
    const query = new PgDialect().sqlToQuery(acquisitionQuery([admin], asOf));
    const { rows } = await pg.query<{ report: Record<string, unknown> }>(
      query.sql,
      query.params,
    );
    return rows[0]!.report;
  }

  it("counts real accounts, excludes administrators and unconfirmed registrations", async () => {
    expect(await report()).toMatchObject({ accounts: 3, eligible7Days: 2 });
  });
  it("counts direct sales once per account and measures the time from signup", async () => {
    expect(await report()).toMatchObject({
      milestones: expect.arrayContaining([
        { action: "sale", users: 1, eligible: 2, percent: 50, medianMinutes: 10 },
        { action: "product", users: 1, eligible: 2, percent: 50, medianMinutes: 30 },
        { action: "first_value", users: 1, eligible: 2, percent: 50, medianMinutes: 10 },
      ]),
    });
  });
  it("only includes completed UTC days in D1 and D7, across account activity", async () => {
    expect(await report()).toMatchObject({
      retention: {
        day1: { eligible: 2, retained: 1, percent: 50 },
        day7: { eligible: 1, retained: 1, percent: 100 },
      },
    });
  });
  it("shows missing attribution explicitly instead of inventing organic traffic", async () => {
    expect(await report()).toMatchObject({
      sources: [{ source: null, medium: null, campaign: null, installations: 1 }],
    });
  });
});
