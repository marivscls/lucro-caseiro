import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().optional(),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
  GOOGLE_PLAY_PACKAGE_NAME: z.string().default("br.com.orionseven.lucrocaseiro"),
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STRIPE_PRICE_MONTHLY_ID: z.string().default(""),
  STRIPE_PRICE_ANNUAL_ID: z.string().default(""),
  STRIPE_SUCCESS_URL: z.string().default("https://lucrocaseiro.app/checkout/success"),
  STRIPE_CANCEL_URL: z.string().default("https://lucrocaseiro.app/checkout/cancel"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT ?? parsed.data.API_PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
  corsOrigin: parsed.data.CORS_ORIGIN,
  googlePlayPackageName: parsed.data.GOOGLE_PLAY_PACKAGE_NAME,
  googlePlayServiceAccountJson: parsed.data.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
  stripeSecretKey: parsed.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
  stripePriceMonthlyId: parsed.data.STRIPE_PRICE_MONTHLY_ID,
  stripePriceAnnualId: parsed.data.STRIPE_PRICE_ANNUAL_ID,
  stripeSuccessUrl: parsed.data.STRIPE_SUCCESS_URL,
  stripeCancelUrl: parsed.data.STRIPE_CANCEL_URL,
};
