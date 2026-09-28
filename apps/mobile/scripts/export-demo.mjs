// Export web do modo demonstração (sem servidor): liga EXPO_PUBLIC_MOCK_MODE=1
// e gera um site estático. Uso:
//   pnpm --filter @lucro-caseiro/mobile export:demo [-- --output-dir <pasta>]
import { spawnSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputIndex = process.argv.indexOf("--output-dir");
const outputDir = resolve(
  appRoot,
  outputIndex >= 0 && process.argv[outputIndex + 1]
    ? process.argv[outputIndex + 1]
    : "dist/demo",
);

// Mesmo critério do build do PWA: pnpm pode ser um script JS ou um executável.
const pnpmExecutable = process.env.npm_execpath;
const pnpmRunsWithNode = !!pnpmExecutable && /\.(?:c|m)?js$/i.test(pnpmExecutable);
const command = pnpmRunsWithNode
  ? process.execPath
  : (pnpmExecutable ?? (process.platform === "win32" ? "pnpm.cmd" : "pnpm"));
const args = [
  ...(pnpmRunsWithNode ? [pnpmExecutable] : []),
  "exec",
  "expo",
  "export",
  "--platform",
  "web",
  "--output-dir",
  outputDir,
  "--clear",
];

const result = spawnSync(command, args, {
  cwd: appRoot,
  env: { ...process.env, EXPO_PUBLIC_MOCK_MODE: "1" },
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error("O export web do modo demonstração falhou.");
}
// A demo não usa service worker (sem cache antigo entre ajustes de layout) nem
// push: tira o registro do /sw.js do HTML e o worker de push copiado do public/.
const indexPath = resolve(outputDir, "index.html");
const html = await readFile(indexPath, "utf8");
const withoutServiceWorker = html.replace(
  /<script>\s*window\.addEventListener\("load"[\s\S]*?serviceWorker[\s\S]*?<\/script>/,
  "",
);
// O que importa é a demo sair sem registro de worker. Se o HTML já veio sem
// ele (ex.: pasta reaproveitada), segue; se sobrou um registro em outro
// formato, falha para não publicar um worker por engano.
if (withoutServiceWorker.includes("serviceWorker")) {
  throw new Error("O HTML exportado ainda registra um service worker.");
}
if (withoutServiceWorker !== html) {
  await writeFile(indexPath, withoutServiceWorker, "utf8");
}
await rm(resolve(outputDir, "push-worker.js"), { force: true });

console.log(`Demonstração exportada em ${outputDir}`);
