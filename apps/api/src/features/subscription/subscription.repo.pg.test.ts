import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { SubscriptionRepoPg } from "./subscription.repo.pg";

const TRIAL_MIGRATION =
  "../../packages/database/src/migrations/20260924100000_essential_trial_signup.sql";
// Migrations de 28/09 que também mexem em users (rodam a cada boot, depois do teste).
const LATER_USER_MIGRATIONS = [
  "20260928220000_pix_fiado_links.sql",
  "20260928220100_referrals.sql",
  "20260928220200_mei_settings.sql",
  "20260928220300_assistant_usage.sql",
  // Teste só com cartão: conta nova volta a nascer no Gratuito.
  "20261120100000_trial_with_card.sql",
].map((file) => `../../packages/database/src/migrations/${file}`);
const NEW_USER = "11111111-1111-4111-8111-111111111111";
const OLD_USER = "22222222-2222-4222-8222-222222222222";
// Conta criada depois de 24/09/2026: já ganhou o teste sem cartão do cadastro.
const LEGACY_TRIAL_USER = "33333333-3333-4333-8333-333333333333";

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
  CREATE TABLE public.subscription_purchase_claims(user_id uuid);
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE TABLE public.clients(id uuid PRIMARY KEY, user_id uuid);
  CREATE TABLE public.sale_items(
    product_id uuid,
    service_id uuid,
    item_name text,
    CONSTRAINT sale_items_source_required CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
  );
`;

function readTrialMigration(): string {
  return readFileSync(TRIAL_MIGRATION, "utf8");
}

describe("Plan and trial persistence in PostgreSQL", () => {
  let pg: PGlite;
  let repo: SubscriptionRepoPg;

  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(BASE_SCHEMA);
    await pg.exec(`INSERT INTO public.users(id, email, name, plan, plan_expires_at, created_at)
      VALUES ('${OLD_USER}', 'antiga@email.com', 'Antiga', 'free', NULL, '2026-08-01T12:00:00Z');`);
    // Roda duas vezes: a API reaplica a migration a cada boot.
    await pg.exec(readTrialMigration());
    await pg.exec(readTrialMigration());
    // Conta que entrou no teste sem cartão antes da troca (já acabou o teste).
    await pg.exec(`INSERT INTO public.users(id, email, name, plan, plan_expires_at, plan_is_trial, created_at)
      VALUES ('${LEGACY_TRIAL_USER}', ' Legado@Email.com', 'Legado', 'essential', '2026-10-08T12:00:00Z', true, '2026-10-01T12:00:00Z');`);
    for (let run = 0; run < 2; run++) {
      for (const file of LATER_USER_MIGRATIONS) {
        // Caminhos fixos da lista acima.
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await pg.exec(readFileSync(file, "utf8"));
      }
    }
    await pg.exec(`CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`);
    repo = new SubscriptionRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  beforeEach(async () => {
    await pg.exec(
      `DELETE FROM auth.users; DELETE FROM public.users WHERE id NOT IN ('${OLD_USER}', '${LEGACY_TRIAL_USER}');`,
    );
  });

  afterAll(async () => {
    await pg?.close();
  });

  it("keeps existing accounts untouched and still offers them the card trial", async () => {
    const profile = await repo.getProfile(OLD_USER);

    expect(profile).toMatchObject({
      plan: "free",
      planExpiresAt: null,
      planIsTrial: false,
      planProvider: null,
      trialAvailable: true,
    });
  });

  it("does not offer a second trial to accounts that had the old no-card trial", async () => {
    const profile = await repo.getProfile(LEGACY_TRIAL_USER);

    expect(profile?.trialAvailable).toBe(false);
  });

  it("signup trigger starts new accounts on Free", async () => {
    await pg.exec(`INSERT INTO auth.users(id, email, raw_user_meta_data)
      VALUES ('${NEW_USER}', 'nova@email.com', '{"name":"Nova"}');`);

    const profile = await repo.getProfile(NEW_USER);

    expect(profile).toMatchObject({
      plan: "free",
      planExpiresAt: null,
      planIsTrial: false,
      name: "Nova",
      trialAvailable: true,
    });
  });

  it("upsertProfile creates Free accounts and never touches the plan on update", async () => {
    const created = await repo.upsertProfile(NEW_USER, {
      email: "nova@email.com",
      name: "Nova",
    });
    expect(created).toMatchObject({ plan: "free", planIsTrial: false });

    const bought = await repo.updatePlan(NEW_USER, "professional", null);
    expect(bought).toMatchObject({
      plan: "professional",
      planIsTrial: false,
      planProvider: null,
    });

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

  it("records the card trial and its store, then the first charge clears the trial", async () => {
    await repo.upsertProfile(NEW_USER, { email: "nova@email.com", name: "Nova" });
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const onTrial = await repo.updatePlan(NEW_USER, "professional", trialEnd, {
      isTrial: true,
      provider: "stripe",
    });
    expect(onTrial).toMatchObject({ planIsTrial: true, planProvider: "stripe" });

    const charged = await repo.updatePlan(NEW_USER, "professional", trialEnd, {
      provider: "stripe",
    });
    expect(charged).toMatchObject({ planIsTrial: false, planProvider: "stripe" });

    const ended = await repo.updatePlan(NEW_USER, "free", null);
    expect(ended).toMatchObject({ plan: "free", planProvider: null });
  });

  it("gives one card trial per email, even after deleting and recreating the account", async () => {
    await repo.upsertProfile(NEW_USER, { email: "nova@email.com", name: "Nova" });

    expect(await repo.claimPremiumTrial(NEW_USER, "nova@email.com", "stripe")).toBe(true);
    // Mesma conta de novo (webhook repetido): continua valendo.
    expect(await repo.claimPremiumTrial(NEW_USER, "nova@email.com", "stripe")).toBe(true);
    expect((await repo.getProfile(NEW_USER))?.trialAvailable).toBe(false);

    await pg.exec(`DELETE FROM public.users WHERE id = '${NEW_USER}';`);
    const recreated = "44444444-4444-4444-8444-444444444444";
    const profile = await repo.upsertProfile(recreated, {
      email: " NOVA@email.com ",
      name: "Nova",
    });

    expect(profile.trialAvailable).toBe(false);
    expect(await repo.claimPremiumTrial(recreated, "nova@email.com", "google_play")).toBe(
      false,
    );
  });

  it("aceita fiado do caderno só com nome depois da migration do assistente", async () => {
    await pg.exec(
      "INSERT INTO public.sale_items(item_name) VALUES ('Fiado anotado no caderno');",
    );
    await expect(
      pg.exec("INSERT INTO public.sale_items(item_name) VALUES (NULL);"),
    ).rejects.toThrow(/sale_items_source_required/);
  });
});
