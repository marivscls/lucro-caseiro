import { config } from "./config";
import { runSecurityMigrations } from "./security-migrations";
import { runWelcomeEmailMigration } from "./features/email/welcome-email.setup";

await runSecurityMigrations(config.databaseUrl);
await runWelcomeEmailMigration(config.databaseUrl);
await import("./main");
