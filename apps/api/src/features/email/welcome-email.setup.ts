import { fileURLToPath } from "node:url";
import postgres from "postgres";

export async function runWelcomeEmailMigration(databaseUrl: string): Promise<void> {
  const connection = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await connection.file(
      fileURLToPath(
        new URL(
          "../../../../../packages/database/src/migrations/20260909155011_welcome_email_automation.sql",
          import.meta.url,
        ),
      ),
    );
  } finally {
    await connection.end({ timeout: 5 });
  }
}
