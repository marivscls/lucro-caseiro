import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", [
  "food",
  "beauty",
  "crafts",
  "services",
  "other",
]);

// "premium" é legado (assinantes antigos) — mantido no enum porque valores de
// enum não são removíveis no Postgres; o repo normaliza premium → professional.
export const planTypeEnum = pgEnum("plan_type", [
  "free",
  "premium",
  "essential",
  "professional",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  businessType: businessTypeEnum("business_type"),
  avatarUrl: text("avatar_url"),
  plan: planTypeEnum("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  // true enquanto o plano veio do teste grátis do Essencial (sem pagamento).
  planIsTrial: boolean("plan_is_trial").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  // Pix de quem vende: vai pronto (com valor) na cobrança, no recibo e no orçamento.
  pixKeyType: text("pix_key_type"),
  pixKey: text("pix_key"),
  pixCity: text("pix_city"),
  // Indicação: código próprio, quem indicou e quando as duas contas ganharam o prêmio.
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by"),
  referredAt: timestamp("referred_at", { withTimezone: true }),
  referralRewardedAt: timestamp("referral_rewarded_at", { withTimezone: true }),
  // Cantinho do MEI: atividade do relatório mensal (null = ainda não configurou).
  meiActivity: text("mei_activity"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
