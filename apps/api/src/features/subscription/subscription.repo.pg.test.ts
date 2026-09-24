import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { ESSENTIAL_TRIAL_DAYS } from "@lucro-caseiro/contracts";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { SubscriptionRepoPg } from "./subscription.repo.pg";

const TRIAL_MIGRATION =
  "../../packages/database/src/migrations/20260924100000_essential_trial_signup.sql";
const NEW_USER = "11111111-1111-4111-8111-111111111111";
const OLD_USER = "22222222-2222-4222-8222-222222222222";
const DAY = 24 * 60 * 60 * 1000;

// Tabela users como estava antes da migration do teste (sem plan_is_trial).
const BASE_SCHEMA = `
  CREATE SCHEMA auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
  CREATE TYPE business_type AS ENUM ('food','beauty','crafts','services','other');
  CREATE TYPE plan_type AS ENUM ('free','premium','essential','professional');
  CREATE TABLE public.users(
    id uuid PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    phone text,
    business_name text,
    business_type business_type,
    avatar_url text,
    plan plan_type NOT NULL DEFAULT 'free',
    plan_expires_at timestamptz,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`;

function readTrialMigration(): string {
  return readFileSync(TRIAL_MIGRATION, "utf8");
}

describe("Essential trial persistence in PostgreSQL", () => {
  let pg: PGlite;
  let repo: SubscriptionRepoPg;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(BASE_SCHEMA);
    await pg.exec(`INSERT INTO public.users(id, email, name, plan, plan_expires_at)
      VALUES ('${OLD_USER}', 'antiga@email.com', 'Antiga', 'free', NULL);`);
    // Roda duas vezes: a API reaplica a migration a cada boot.
    await pg.exec(readTrialMigration());
    await pg.exec(readTrialMigration());
    await pg.exec(`CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`);
    repo = new SubscriptionRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  beforeEach(async () => {
    await pg.exec(
      `DELETE FROM auth.users; DELETE FROM public.users WHERE id <> '${OLD_USER}';`,
    );
  });

  afterAll(async () => {
    await pg?.close();
  });

  it("keeps existing accounts untouched", async () => {
    const profile = await repo.getProfile(OLD_USER);

    expect(profile).toMatchObject({
      plan: "free",
      planExpiresAt: null,
      planIsTrial: false,
    });
  });

  it("signup trigger starts the 7-day Essential trial", async () => {
    await pg.exec(`INSERT INTO auth.users(id, email, raw_user_meta_data)
      VALUES ('${NEW_USER}', 'nova@email.com', '{"name":"Nova"}');`);

    const profile = await repo.getProfile(NEW_USER);

    expect(profile).toMatchObject({ plan: "essential", planIsTrial: true, name: "Nova" });
    const days = (new Date(profile!.planExpiresAt!).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(ESSENTIAL_TRIAL_DAYS - 0.01);
    expect(days).toBeLessThanOrEqual(ESSENTIAL_TRIAL_DAYS);
  });

  it("upsertProfile grants the trial only on insert", async () => {
    const created = await repo.upsertProfile(NEW_USER, {
      email: "nova@email.com",
      name: "Nova",
    });
    expect(created).toMatchObject({ plan: "essential", planIsTrial: true });

    const bought = await repo.updatePlan(NEW_USER, "professional", null);
    expect(bought).toMatchObject({ plan: "professional", planIsTrial: false });

    const updated = await repo.upsertProfile(NEW_USER, {
      email: "nova@email.com",
      name: "Nova Confeitaria",
    });
    expect(updated).toMatchObject({
      name: "Nova Confeitaria",
      plan: "professional",
      planExpiresAt: null,
      planIsTrial: false,
    });

    const old = await repo.upsertProfile(OLD_USER, {
      email: "antiga@email.com",
      name: "Antiga",
    });
    expect(old).toMatchObject({ plan: "free", planExpiresAt: null, planIsTrial: false });
  });
});
