import { fileURLToPath } from "node:url";
import postgres from "postgres";

export async function runWebPushMigration(databaseUrl: string): Promise<void> {
  const connection = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await connection.file(
      fileURLToPath(
        new URL(
          "../../../../../packages/database/src/migrations/20260909183022_browser_push_notifications.sql",
          import.meta.url,
        ),
      ),
    );
  } finally {
    await connection.end({ timeout: 5 });
  }
}
