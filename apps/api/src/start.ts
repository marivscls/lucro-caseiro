import { config } from "./config";
import { runSecurityMigrations } from "./security-migrations";
import { runWelcomeEmailMigration } from "./features/email/welcome-email.setup";
import { runWebPushMigration } from "./features/notifications/web-push.setup";

await runSecurityMigrations(config.databaseUrl);
await runWelcomeEmailMigration(config.databaseUrl);
if (config.webPushPublicKey && config.webPushPrivateKey && config.webPushSubject) {
  await runWebPushMigration(config.databaseUrl);
}
await import("./main");
