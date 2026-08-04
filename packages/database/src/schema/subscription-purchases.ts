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
);
