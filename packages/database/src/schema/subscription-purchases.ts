import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * Vincula uma compra verificada no provedor a exatamente uma conta.
 * O token bruto nunca e persistido: apenas SHA-256 em hexadecimal.
 */
export const subscriptionPurchaseClaims = pgTable(
  "subscription_purchase_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("subscription_purchase_claims_provider_token_uidx").on(
      table.provider,
      table.tokenHash,
    ),
    index("subscription_purchase_claims_user_idx").on(table.userId),
  ],
).enableRLS();

/**
 * Teste de 7 dias com cartão: uma vez por e-mail. Guarda só o SHA-256 do e-mail
 * normalizado (minúsculas, sem espaços), para que excluir a conta e criar outra
 * com o mesmo e-mail não dê um teste novo. Não referencia `users`: sobrevive à
 * exclusão da conta.
 */
export const premiumTrialClaims = pgTable("premium_trial_claims", {
  emailHash: text("email_hash").primaryKey(),
  userId: uuid("user_id").notNull(),
  provider: text("provider").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
