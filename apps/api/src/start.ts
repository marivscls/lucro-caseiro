import { config } from "./config";
import { runSecurityMigrations } from "./security-migrations";
import { runWelcomeEmailMigration } from "./features/email/welcome-email.setup";
import { runActionEmailMigration } from "./features/email/action-email.setup";
import { runTrialReminderMigration } from "./features/email/trial-reminder.setup";
import { runWebPushMigration } from "./features/notifications/web-push.setup";

await runSecurityMigrations(config.databaseUrl);
await runWelcomeEmailMigration(config.databaseUrl);
await runActionEmailMigration(config.databaseUrl);
await runTrialReminderMigration(config.databaseUrl);
if (config.webPushPublicKey && config.webPushPrivateKey && config.webPushSubject) {
  await runWebPushMigration(config.databaseUrl);
}
await import("./main");
