import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const detectors = [
  ["chave privada", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["chave Stripe live", /sk_live_[A-Za-z0-9]{16,}/g],
  ["segredo de webhook Stripe", /whsec_[A-Za-z0-9]{16,}/g],
  ["chave Google", /AIza[0-9A-Za-z_-]{30,}/g],
  ["token GitHub", /(?:ghp|github_pat)_[0-9A-Za-z_]{20,}/g],
  ["access key AWS", /AKIA[0-9A-Z]{16}/g],
];
const findings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (content.includes("\0")) continue;

  for (const [label, pattern] of detectors) {
    for (const match of content.matchAll(pattern)) {
      const testPlaceholder =
        label === "chave privada" &&
        /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file) &&
        /\\+ntest\\+n/.test(content.slice(match.index, match.index + 100));
      if (testPlaceholder) continue;
      const line = content.slice(0, match.index).split("\n").length;
      findings.push(`${file}:${line}: possível ${label}`);
    }
  }
}

if (findings.length) {
  console.error("Possíveis segredos rastreados pelo git:\n" + findings.join("\n"));
  process.exit(1);
}
console.log(
  `Nenhum segredo conhecido encontrado em ${files.length} arquivos rastreados.`,
);
