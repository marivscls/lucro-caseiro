import { fileURLToPath } from "node:url";
import postgres from "postgres";

export async function runTrialReminderMigration(databaseUrl: string): Promise<void> {
  const connection = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await connection.file(
      fileURLToPath(
        new URL(
          "../../../../../packages/database/src/migrations/20260928190000_trial_reminder_jobs.sql",
          import.meta.url,
        ),
      ),
    );
  } finally {
    await connection.end({ timeout: 5 });
  }
}
