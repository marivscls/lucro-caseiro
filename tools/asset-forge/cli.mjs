#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CATALOG, resolveIngredient } from "./src/catalog.mjs";
import { buildPrompt } from "./src/prompt.mjs";
import { selectProvider } from "./src/providers.mjs";
import { loadManifest, saveManifest } from "./src/manifest.mjs";
import { generateOne } from "./src/generate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "out");
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");
const CATALOG_PATH = join(OUT_DIR, "catalog.json");

const nowIso = () => new Date().toISOString();

const [command, ...args] = process.argv.slice(2);

function help() {
  console.log(`asset-forge — ilustrações 3D por nome de insumo/produto

Uso:
  node cli.mjs resolve <nome...>   Mostra a entrada do catálogo que casa com o nome
  node cli.mjs catalog             Exporta out/catalog.json (consumo do app) + estatísticas
  node cli.mjs build               Cria/atualiza out/manifest.json (prompts, status pending)
  node cli.mjs gen <nome...>       Gera as ilustrações dos nomes via provider
  node cli.mjs gen --all           Gera para todo o catálogo

Provider (geração real):
  ASSET_FORGE_PROVIDER=http
  ASSET_FORGE_IMAGE_ENDPOINT=https://seu-worker/gerar
  ASSET_FORGE_API_KEY=...          (opcional; vira Bearer)
  Sem isso, roda em modo dry-run (offline, não gera bytes).`);
}

async function cmdResolve() {
  const name = args.join(" ");
  const entry = resolveIngredient(name);
  if (!entry) {
    console.log(`✗ "${name}" — sem correspondência (usará fallback genérico)`);
    return;
  }
  console.log(`✓ "${name}" -> ${entry.slug}`);
  console.log(`  label: ${entry.label}  emoji: ${entry.emoji}  cor: ${entry.color}`);
  console.log(`  prompt: ${buildPrompt(entry)}`);
}

async function cmdCatalog() {
  const items = CATALOG.map(({ slug, label, emoji, color, aliases }) => ({
    slug,
    label,
    emoji,
    color,
    aliases,
  }));
  await saveManifest(CATALOG_PATH, { count: items.length, items });
  console.log(`✓ ${items.length} ilustrações no catálogo -> ${CATALOG_PATH}`);
}

async function cmdBuild() {
  const manifest = await loadManifest(MANIFEST_PATH);
  manifest.items ??= {};
  let added = 0;
  for (const entry of CATALOG) {
    const prev = manifest.items[entry.slug];
    if (prev?.status === "ready") continue;
    manifest.items[entry.slug] = {
      slug: entry.slug,
      label: entry.label,
      emoji: entry.emoji,
      color: entry.color,
      status: prev?.status ?? "pending",
      url: prev?.url ?? null,
      prompt: buildPrompt(entry),
      updatedAt: nowIso(),
    };
    added += 1;
  }
  await saveManifest(MANIFEST_PATH, manifest);
  console.log(`✓ manifest atualizado (${added} pendentes) -> ${MANIFEST_PATH}`);
}

async function cmdGen() {
  const names = args.includes("--all")
    ? CATALOG.map((entry) => entry.label)
    : args;
  if (names.length === 0) {
    console.log("Informe um nome ou use --all.");
    return;
  }
  const provider = selectProvider();
  console.log(`Provider: ${provider.name}`);
  const manifest = await loadManifest(MANIFEST_PATH);
  manifest.items ??= {};

  let ready = 0;
  let pending = 0;
  let invalid = 0;
  for (const name of names) {
    const record = await generateOne(name, { provider, outDir: OUT_DIR, nowIso: nowIso() });
    if (record.status === "invalid") {
      invalid += 1;
      console.log(`  ✗ "${name}" — nome inválido`);
      continue;
    }
    manifest.items[record.slug] = record;
    if (record.status === "ready") {
      ready += 1;
      console.log(`  ✓ ${record.slug} -> ${record.url}`);
    } else {
      pending += 1;
      console.log(`  … ${record.slug} (${record.status})`);
    }
  }
  await saveManifest(MANIFEST_PATH, manifest);
  console.log(`Resumo: ${ready} prontas, ${pending} pendentes, ${invalid} inválidas.`);
}

const COMMANDS = {
  resolve: cmdResolve,
  catalog: cmdCatalog,
  build: cmdBuild,
  gen: cmdGen,
};

const run = COMMANDS[command];
if (!run) {
  help();
  process.exit(command ? 1 : 0);
}
run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
