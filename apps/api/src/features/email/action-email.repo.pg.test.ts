import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AppDatabase } from "../../shared/db";
import { ActionEmailRepoPg } from "./action-email.repo.pg";

const USER = "11111111-1111-4111-8111-111111111111";

describe("action email eligibility in PostgreSQL", () => {
  let pg: PGlite;
  let repo: ActionEmailRepoPg;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE TABLE public.users(id uuid PRIMARY KEY, name text NOT NULL, business_type text, created_at timestamptz NOT NULL, is_active boolean NOT NULL DEFAULT true);
      CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz, created_at timestamptz NOT NULL, deleted_at timestamptz, banned_until timestamptz, raw_user_meta_data jsonb);
      CREATE TABLE public.products(user_id uuid);
      CREATE TABLE public.sales(user_id uuid);
      CREATE TABLE public.analytics_events(user_id uuid, event_type text, event_name text, occurred_at timestamptz);
      CREATE TABLE public.app_memberships(user_id uuid, brand_id text, status text);`);
    await pg.exec(
      readFileSync(
        "../../packages/database/src/migrations/20260928182000_action_email_automation.sql",
        "utf8",
      ),
    );
    await pg.exec(`INSERT INTO public.users(id,name,business_type,created_at) VALUES ('${USER}','Maria','food',now()-interval '10 days');
      INSERT INTO auth.users(id,email,email_confirmed_at,created_at) VALUES ('${USER}','maria@example.com',now()-interval '10 days',now()-interval '10 days');`);
    repo = new ActionEmailRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  afterAll(async () => {
    await pg?.close();
  });

  it("requires explicit consent and allows one-click unsubscribe", async () => {
    expect(await repo.getPreference(USER)).toBe(false);
    expect(await repo.candidates()).toEqual([]);
    await repo.setPreference(USER, true);
    expect(await repo.getPreference(USER)).toBe(true);
    const { rows } = await pg.query<{ unsubscribe_token: string }>(
      `SELECT unsubscribe_token FROM app_email.action_preferences WHERE user_id='${USER}'`,
    );
    expect(rows[0]?.unsubscribe_token).toMatch(/^[a-f0-9]{64}$/);
    expect(await repo.unsubscribe(rows[0]!.unsubscribe_token)).toBe(true);
    expect(await repo.getPreference(USER)).toBe(false);
  });

  it("adopts only an explicit signup opt-in and never restores it after unsubscribe", async () => {
    const newcomer = "22222222-2222-4222-8222-222222222222";
    await pg.exec(`INSERT INTO public.users(id,name,business_type,created_at) VALUES ('${newcomer}','Ana','food',now());
      INSERT INTO auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data)
      VALUES ('${newcomer}','ana@example.com',now(),now(),'{"action_email_opt_in":true}');`);
    expect(await repo.getPreference(newcomer)).toBe(true);
    await repo.setPreference(newcomer, false);
    expect(await repo.getPreference(newcomer)).toBe(false);
    expect(await repo.getPreference(USER)).toBe(false);
  });

  it("finds signup consent during the worker scan without requiring an app settings visit", async () => {
    const newcomer = "33333333-3333-4333-8333-333333333333";
    await pg.exec(`INSERT INTO public.users(id,name,business_type,created_at) VALUES ('${newcomer}','Bia','crafts',now()-interval '10 days');
      INSERT INTO auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data)
      VALUES ('${newcomer}','bia@example.com',now()-interval '10 days',now()-interval '10 days','{"action_email_opt_in":true}');`);

    await repo.candidates();

    const { rows } = await pg.query<{ enabled: boolean; consented_at: Date }>(
      `SELECT enabled, consented_at FROM app_email.action_preferences WHERE user_id='${newcomer}'`,
    );
    expect(rows[0]?.enabled).toBe(true);
    expect(rows[0]?.consented_at).toBeTruthy();
  });

  it("excludes completed pricing and recent app activity", async () => {
    await repo.setPreference(USER, true);
    await pg.exec(
      `UPDATE app_email.action_preferences SET consented_at=now()-interval '5 days' WHERE user_id='${USER}';`,
    );
    expect(await repo.candidates()).toHaveLength(1);
    await pg.exec(
      `INSERT INTO analytics_events(user_id,event_type,event_name,occurred_at) VALUES ('${USER}','screen_view','home',now());`,
    );
    expect(await repo.candidates()).toEqual([]);
    await pg.exec(`DELETE FROM analytics_events;
      INSERT INTO analytics_events(user_id,event_type,event_name,occurred_at) VALUES ('${USER}','action','pricing_completed',now()-interval '5 days');`);
    expect(await repo.candidates()).toEqual([]);
  });

  it("does not send product pricing guidance to a service business", async () => {
    await pg.exec("DELETE FROM analytics_events;");
    await repo.setPreference(USER, true);
    await pg.exec(`UPDATE app_email.action_preferences SET consented_at=now()-interval '5 days' WHERE user_id='${USER}';
      UPDATE public.users SET business_type='services' WHERE id='${USER}';`);
    expect(await repo.candidates()).toEqual([]);
    await pg.exec(`UPDATE public.users SET business_type='food' WHERE id='${USER}';`);
    expect(await repo.candidates()).toHaveLength(1);
  });

  it("checks consent and action completion again just before a queued send", async () => {
    await pg.exec("DELETE FROM analytics_events;");
    const candidate = (await repo.candidates())[0];
    expect(candidate?.userId).toBe(USER);
    await repo.enqueue(USER, {
      from: "sender@example.com",
      message: {
        to: "maria@example.com",
        subject: "Preços",
        text: "Oi",
        html: "<p>Oi</p>",
        idempotencyKey: `first-price-v1-${USER}`,
      },
    });
    const job = await repo.claim();
    expect(job?.userId).toBe(USER);
    expect(await repo.stillEligible(job!)).toBe(true);
    await pg.exec(`UPDATE public.users SET business_type='services' WHERE id='${USER}';`);
    expect(await repo.stillEligible(job!)).toBe(false);
    await pg.exec(`UPDATE public.users SET business_type='food' WHERE id='${USER}';`);
    await pg.exec(
      `INSERT INTO analytics_events(user_id,event_type,event_name,occurred_at) VALUES ('${USER}','action','pricing_completed',now());`,
    );
    expect(await repo.stillEligible(job!)).toBe(false);
    await repo.cancelled(job!);
    expect(await repo.claim()).toBeNull();
  });

  it("keeps one sent job per person across worker polls", async () => {
    await pg.exec(
      "DELETE FROM analytics_events; DELETE FROM app_email.first_price_jobs;",
    );
    await repo.enqueue(USER, {
      from: "sender@example.com",
      message: {
        to: "maria@example.com",
        subject: "Preços",
        text: "Oi",
        html: "<p>Oi</p>",
        idempotencyKey: `first-price-v1-${USER}`,
      },
    });
    const job = await repo.claim();
    expect(job?.userId).toBe(USER);
    await repo.sent(job!, "resend-1");
    expect(await repo.candidates()).toEqual([]);
    expect(await repo.claim()).toBeNull();
  });
});
