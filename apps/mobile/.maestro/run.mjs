#!/usr/bin/env node
// Runner cross-platform pro Maestro.
// Carrega credenciais de .maestro/.env (ou variáveis de ambiente) e injeta nos
// flows via `-e EMAIL=... -e PASSWORD=...`, sem deixar a senha hardcoded no repo.
//
// Uso (dentro de apps/mobile):
//   pnpm e2e                         # roda a suíte inteira (.maestro/config.yaml)
//   pnpm e2e:smoke                   # só o smoke (não precisa de credenciais)
//   node .maestro/run.mjs flows/03-tabs-navigation.yaml
//   node .maestro/run.mjs --device emulator-5554            # escolhe o device
//
// Credenciais (procura nesta ordem): variáveis de ambiente -> .maestro/.env
//   E2E_EMAIL  | EMAIL
//   E2E_PASSWORD | PASSWORD

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadEnvFile(join(here, ".env"));
const pick = (...keys) =>
  keys.map((k) => process.env[k] ?? fileEnv[k]).find((v) => v != null && v !== "");

const EMAIL = pick("E2E_EMAIL", "EMAIL") ?? "";
const PASSWORD = pick("E2E_PASSWORD", "PASSWORD") ?? "";

// Caminhos de flow (.yaml/.yml) são resolvidos relativos ao diretório .maestro,
// pra poder rodar `node .maestro/run.mjs flows/02-login.yaml` de dentro de apps/mobile.
const passthrough = process.argv.slice(2).map((a) =>
  /\.ya?ml$/i.test(a) && !isAbsolute(a) ? join(here, a) : a,
);
// Se o usuário não passou nenhum arquivo/pasta de flow, roda o workspace inteiro.
const hasTarget = passthrough.some((a) => !a.startsWith("-"));

if (!EMAIL || !PASSWORD) {
  console.warn(
    "[e2e] AVISO: EMAIL/PASSWORD não definidos — flows de login vão falhar.\n" +
      "      Crie apps/mobile/.maestro/.env (veja .env.example) ou exporte E2E_EMAIL/E2E_PASSWORD.\n",
  );
}

// Monta um ÚNICO comando string (com shell:true). Passar array+shell:true no Windows
// faz o Maestro ignorar os -e (vira ${EMAIL} literal). Os -e vêm ANTES do flow.
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const cmdParts = ["maestro", "test", "-e", q(`EMAIL=${EMAIL}`), "-e", q(`PASSWORD=${PASSWORD}`)];
if (!hasTarget) cmdParts.push(q(here));
cmdParts.push(...passthrough.map((a) => (a.startsWith("-") ? a : q(a))));
const command = cmdParts.join(" ");

const child = spawn(command, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, EMAIL, PASSWORD },
});

child.on("error", (err) => {
  console.error(
    "[e2e] Não consegui executar 'maestro'. Ele está no PATH?\n" +
      "      Abra um terminal novo (o PATH foi atualizado na instalação) ou rode:\n" +
      '      & "$env:USERPROFILE\\maestro\\bin\\maestro.bat" --version\n',
    err.message,
  );
  process.exit(1);
});
child.on("exit", (code) => process.exit(code ?? 1));
