import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
  REVENUECAT_WEBHOOK_SECRET: z.string().default(""),
  MERCADOPAGO_ACCESS_TOKEN: z.string().default(""),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().default(""),
  MERCADOPAGO_PLAN_MONTHLY_ID: z.string().default(""),
  MERCADOPAGO_PLAN_ANNUAL_ID: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.API_PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
  corsOrigin: parsed.data.CORS_ORIGIN,
  revenuecatWebhookSecret: parsed.data.REVENUECAT_WEBHOOK_SECRET,
  mercadopagoAccessToken: parsed.data.MERCADOPAGO_ACCESS_TOKEN,
  mercadopagoWebhookSecret: parsed.data.MERCADOPAGO_WEBHOOK_SECRET,
  mercadopagoPlanMonthlyId: parsed.data.MERCADOPAGO_PLAN_MONTHLY_ID,
  mercadopagoPlanAnnualId: parsed.data.MERCADOPAGO_PLAN_ANNUAL_ID,
};
