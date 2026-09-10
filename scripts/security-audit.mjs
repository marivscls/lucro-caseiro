import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const patches = [
  {
    name: "image-size",
    version: "1.2.1",
    advisories: ["GHSA-w3rx-r6r6-pgpr", "GHSA-5p2g-fcmc-qvqq"],
    patch: "patches/image-size@1.2.1.patch",
    sha256: "248589a23516c70b626a899355a519a6695217ad37e9119d99b87e15c3593943",
    lockHash: "7nkpq2w5t5gopn2cejyueliega",
    files: {
      "dist/types/icns.js":
        "2fcbb9dfb52b0d8da93ec4dd2ca11a0bf3248dbd492c0607abf24c6b2411f526",
      "dist/types/utils.js":
        "a1c478d0464d400488f535bb509907fd7256efa86d84b9ae7dac8575e1f7e42d",
    },
  },
  {
    name: "decode-uri-component",
    version: "0.2.2",
    advisories: ["GHSA-vcc3-ghjq-m6fr"],
    patch: "patches/decode-uri-component@0.2.2.patch",
    sha256: "9d529ee3aba2ea02bb0e381865454cdd8741a1a86a55707797108c884830413a",
    lockHash: "3tanumu5odptjjc6gcztesr4ju",
    files: {
      "index.js": "d35494c86958cc1ddea58bf179940c5732954210282e188a4a2e71ce4d11b6bc",
    },
  },
];

function text(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}
function hash(path) {
  return createHash("sha256").update(text(path)).digest("hex");
}
function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function verifyPatch(root, patch, findings) {
  const manifest = JSON.parse(text(join(root, "package.json")));
  const key = `${patch.name}@${patch.version}`;
  check(
    manifest.pnpm?.patchedDependencies?.[key] === patch.patch,
    `Patch ausente: ${key}`,
  );
  check(hash(join(root, patch.patch)) === patch.sha256, `Hash de patch alterado: ${key}`);
  const lock = text(join(root, "pnpm-lock.yaml"));
  check(
    lock.includes(`  ${key}:\n    hash: ${patch.lockHash}\n    path: ${patch.patch}\n`),
    `Patch divergente no lockfile: ${key}`,
  );
  const references = [...lock.matchAll(new RegExp(`^\\s+${patch.name}: (.+)$`, "gm"))];
  check(
    references.length > 0 &&
      references.every(
        (match) => match[1] === `${patch.version}(patch_hash=${patch.lockHash})`,
      ),
    `Referencia sem patch no lockfile: ${key}`,
  );

  const cache = new Map();
  const checkedPackages = new Set();
  for (const finding of findings) {
    check(
      finding.version === patch.version && finding.paths?.length > 0,
      `Versao ou caminho inesperado: ${key}`,
    );
    // Follow every advisory path from its actual workspace importer, resolving
    // manifests without executing dependency code or relying on package exports.
    for (const path of finding.paths) {
      const [importer, ...chain] = path.split(" > ");
      const importerPath = resolve(root, importer.replaceAll("\\", "/"));
      const withinRoot = relative(root, importerPath);
      check(
        !isAbsolute(withinRoot) &&
          withinRoot !== ".." &&
          !withinRoot.startsWith(`..${sep}`),
        "Importer fora do projeto",
      );
      let packageFile = join(importerPath, "package.json");
      for (const entry of chain) {
        const name = entry.slice(0, entry.lastIndexOf("@"));
        check(
          /^(@[^/]+\/)?[^/@]+$/.test(name) && !name.includes(".."),
          "Nome de dependencia invalido",
        );
        const cacheKey = `${packageFile}:${name}`;
        if (!cache.has(cacheKey)) {
          const candidates = createRequire(packageFile).resolve.paths(name) || [];
          const resolved = candidates
            .map((dir) => join(dir, name, "package.json"))
            .find(existsSync);
          check(resolved, `Dependencia nao instalada: ${name}`);
          cache.set(cacheKey, realpathSync(resolved));
        }
        packageFile = cache.get(cacheKey);
      }
      if (checkedPackages.has(packageFile)) continue;
      const installed = JSON.parse(text(packageFile));
      check(
        installed.name === patch.name && installed.version === patch.version,
        `Pacote instalado divergente: ${key}`,
      );
      for (const [file, expected] of Object.entries(patch.files)) {
        check(
          hash(join(dirname(packageFile), file)) === expected,
          `Codigo instalado sem patch ou alterado: ${key}/${file}`,
        );
      }
      checkedPackages.add(packageFile);
    }
  }
  check(checkedPackages.size > 0, `Nenhuma instalacao verificada: ${key}`);
}

export function assessAudit(audit, verify) {
  check(
    audit && !audit.error && audit.advisories && audit.metadata?.vulnerabilities,
    "Resposta de auditoria invalida ou indisponivel",
  );
  const result = { mitigated: [], blocking: [], other: [] };
  for (const advisory of Object.values(audit.advisories)) {
    check(
      ["info", "low", "moderate", "high", "critical"].includes(advisory.severity),
      "Severidade desconhecida",
    );
    const patch = patches.find(
      (entry) =>
        entry.name === advisory.module_name &&
        entry.advisories.some(
          (id) => advisory.url === `https://github.com/advisories/${id}`,
        ),
    );
    let verified = false;
    let reason;
    if (patch) {
      try {
        check(
          advisory.findings?.length > 0 &&
            advisory.findings.every((finding) => finding.version === patch.version),
          "Versao de advisory nao coberta pelo patch",
        );
        verify(patch, advisory.findings);
        verified = true;
      } catch (error) {
        reason = error.message;
      }
    }
    const item = {
      package: advisory.module_name,
      severity: advisory.severity,
      url: advisory.url,
      reason,
    };
    if (verified) result.mitigated.push(item);
    // Failed verification of a claimed local mitigation always fails closed,
    // including its moderate advisory. Other advisories keep audit-level=high.
    else if (patch || ["high", "critical"].includes(advisory.severity))
      result.blocking.push(item);
    else result.other.push(item);
  }
  const severeCount =
    Number(audit.metadata.vulnerabilities.high) +
    Number(audit.metadata.vulnerabilities.critical);
  check(Number.isFinite(severeCount), "Contagem de auditoria invalida");
  check(
    severeCount === 0 ||
      [...result.mitigated, ...result.blocking].some((item) =>
        ["high", "critical"].includes(item.severity),
      ),
    "Advisories ausentes na resposta",
  );
  return result;
}

export function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const artifact = join(
    mkdtempSync(join(tmpdir(), "lucro-security-audit-")),
    "pnpm-audit.json",
  );
  const pnpm =
    process.env.npm_execpath ||
    join(dirname(process.execPath), "node_modules/corepack/dist/pnpm.js");
  check(existsSync(pnpm), "Execute por pnpm security:audit para localizar o pnpm");
  const fd = openSync(artifact, "w");
  let run;
  try {
    run = spawnSync(
      process.execPath,
      [pnpm, "audit", "--prod", "--audit-level=high", "--json"],
      { cwd: root, stdio: ["ignore", fd, "inherit"], timeout: 120000 },
    );
  } finally {
    closeSync(fd);
  }
  console.log(`Auditoria original: ${artifact}`);
  check(
    !run.error && [0, 1].includes(run.status),
    "Falha ao executar pnpm audit; nenhuma mitigacao foi aceita",
  );
  const audit = JSON.parse(text(artifact));
  const result = assessAudit(audit, (patch, findings) =>
    verifyPatch(root, patch, findings),
  );
  if (result.mitigated.length > 0) {
    const regression = spawnSync(
      process.execPath,
      ["--test", "scripts/security-dependency-patches.test.mjs"],
      { cwd: root, stdio: "inherit", timeout: 30000 },
    );
    check(
      !regression.error && regression.status === 0,
      "Testes dos patches falharam; mitigacoes rejeitadas",
    );
  }
  console.log(`Advisories mitigados por patches verificados: ${result.mitigated.length}`);
  console.log(
    `Advisories bloqueantes: ${result.blocking.length}; abaixo de high: ${result.other.length}`,
  );
  for (const item of [...result.mitigated, ...result.blocking, ...result.other])
    console.log(
      `${item.severity} ${item.package}: ${item.url}${item.reason ? ` (${item.reason})` : ""}`,
    );
  return result.blocking.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
