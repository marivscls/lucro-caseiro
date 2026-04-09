import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("*"),
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
};
