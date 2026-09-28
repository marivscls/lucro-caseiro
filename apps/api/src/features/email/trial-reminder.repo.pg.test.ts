import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "../../shared/db";
import { TrialReminderRepoPg } from "./trial-reminder.repo.pg";
import type { TrialReminderPayload } from "./trial-reminder.types";

const MIGRATION =
  "../../packages/database/src/migrations/20260928190000_trial_reminder_jobs.sql";
const USER = "11111111-1111-4111-8111-111111111111";
const payload: TrialReminderPayload = {
  from: "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
  message: {
    to: "ana@example.com",
    subject: "Teste",
    text: "Teste",
    html: "<p>Teste</p>",
    idempotencyKey: `essential-trial-three_days-v1-${USER}`,
  },
};

describe("Essential trial reminder queue in PostgreSQL", () => {
  let pg: PGlite;
  let repo: TrialReminderRepoPg;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (
        id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz,
        deleted_at timestamptz, banned_until timestamptz
      );
      CREATE TABLE public.users (
        id uuid PRIMARY KEY, name text NOT NULL, plan text NOT NULL,
        plan_is_trial boolean NOT NULL, plan_expires_at timestamptz,
        is_active boolean NOT NULL DEFAULT true
      );
      CREATE TABLE public.app_memberships (
        user_id uuid NOT NULL, brand_id text NOT NULL, status text NOT NULL
      );
    `);
    await pg.exec(readFileSync(MIGRATION, "utf8"));
    await pg.exec(readFileSync(MIGRATION, "utf8"));
    repo = new TrialReminderRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  beforeEach(async () => {
    await pg.exec(
      "DELETE FROM app_email.trial_reminder_jobs; DELETE FROM auth.users; DELETE FROM public.users;",
    );
    await pg.exec(`
      INSERT INTO auth.users(id,email,email_confirmed_at)
      VALUES ('${USER}','ana@example.com',now());
      INSERT INTO public.users(id,name,plan,plan_is_trial,plan_expires_at)
      VALUES ('${USER}','Ana','essential',true,now()+interval '2 days 12 hours');
    `);
  });

  afterAll(async () => {
    await pg?.close();
  });

  it("selects the three gentle stages only in their windows", async () => {
    expect((await repo.candidates()).map(({ stage }) => stage)).toEqual(["three_days"]);
    await pg.exec(
      `UPDATE public.users SET plan_expires_at=now()+interval '1 day 12 hours' WHERE id='${USER}'`,
    );
    expect(await repo.candidates()).toEqual([]);
    await pg.exec(
      `UPDATE public.users SET plan_expires_at=now()+interval '12 hours' WHERE id='${USER}'`,
    );
    expect((await repo.candidates()).map(({ stage }) => stage)).toEqual(["one_day"]);
    await pg.exec(
      `UPDATE public.users SET plan_expires_at=now()-interval '1 hour' WHERE id='${USER}'`,
    );
    expect((await repo.candidates()).map(({ stage }) => stage)).toEqual(["ended"]);
  });

  it("sends a stage once and cancels a queued reminder after purchase", async () => {
    const [candidate] = await repo.candidates();
    await repo.enqueue(candidate!, payload);
    await repo.enqueue(candidate!, payload);
    expect(await repo.candidates()).toEqual([]);
    const job = await repo.claim();
    expect(job).toMatchObject({ userId: USER, stage: "three_days" });
    await repo.sent(job!, "provider-1");
    const sent = await pg.query<{ status: string; provider_message_id: string }>(
      "SELECT status,provider_message_id FROM app_email.trial_reminder_jobs",
    );
    expect(sent.rows).toEqual([{ status: "sent", provider_message_id: "provider-1" }]);

    await pg.exec(
      `UPDATE public.users SET plan_expires_at=now()+interval '12 hours' WHERE id='${USER}'`,
    );
    const [next] = await repo.candidates();
    await repo.enqueue(next!, {
      ...payload,
      message: { ...payload.message, idempotencyKey: "one-day" },
    });
    await pg.exec(
      `UPDATE public.users SET plan='professional',plan_is_trial=false WHERE id='${USER}'`,
    );
    expect(await repo.claim()).toBeNull();
    const cancelled = await pg.query<{ status: string }>(
      "SELECT status FROM app_email.trial_reminder_jobs WHERE stage='one_day'",
    );
    expect(cancelled.rows[0]?.status).toBe("cancelled");
  });

  it("does not send after the confirmed email address changes", async () => {
    const [candidate] = await repo.candidates();
    await repo.enqueue(candidate!, payload);
    await pg.exec(`UPDATE auth.users SET email='other@example.com' WHERE id='${USER}'`);
    expect(await repo.claim()).toBeNull();
  });

  it("keeps the private queue out of authenticated clients", async () => {
    await expect(
      pg.exec("SET ROLE authenticated; SELECT * FROM app_email.trial_reminder_jobs;"),
    ).rejects.toThrow();
    await pg.exec("RESET ROLE");
  });
});
