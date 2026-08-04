import { config } from "./config";
import { runSecurityMigrations } from "./security-migrations";

await runSecurityMigrations(config.databaseUrl);
await import("./main");
