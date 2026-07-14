import { spawnSync } from "node:child_process";

const mode = process.argv[2];
const service =
  process.env.RAILWAY_SERVICE_NAME === "@lucro-caseiro/web"
    ? "@lucro-caseiro/web"
    : "@lucro-caseiro/api";

if (mode === "build" && service !== "@lucro-caseiro/web") {
  process.exit(0);
}

if (mode !== "build" && mode !== "start") {
  console.error("Usage: node scripts/railway-service.mjs <build|start>");
  process.exit(1);
}

const result = spawnSync("pnpm", ["--filter", service, mode], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
