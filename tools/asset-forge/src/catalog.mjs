import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { normalizeName, slugify } from "./normalize.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** @typedef {{ slug: string, label: string, emoji: string, color: string, aliases: string[] }} CatalogEntry */

/** Catálogo curado (biblioteca de ilustrações conhecidas). @type {CatalogEntry[]} */
export const CATALOG = JSON.parse(
  readFileSync(join(here, "..", "seeds", "ingredients.json"), "utf8"),
);

// Índice de aliases normalizados -> entrada, ordenado do mais específico
// (alias mais longo) para o mais genérico, para o match preferir o melhor.
const ALIAS_INDEX = buildAliasIndex(CATALOG);

function buildAliasIndex(catalog) {
  /** @type {{ alias: string, entry: CatalogEntry }[]} */
  const index = [];
  for (const entry of catalog) {
    const candidates = new Set([
      entry.label,
      entry.slug.replace(/-/g, " "),
      ...(entry.aliases ?? []),
    ]);
    for (const candidate of candidates) {
      const alias = normalizeName(candidate);
      if (alias) index.push({ alias, entry });
    }
  }
  index.sort((a, b) => b.alias.length - a.alias.length);
  return index;
}

function matchesWord(haystack, needle) {
  if (haystack === needle) return true;
  if (needle.includes(" ")) return ` ${haystack} `.includes(` ${needle} `);
  return haystack.split(" ").includes(needle);
}

/**
 * Resolve um nome livre para uma entrada do catálogo (ou null se não houver
 * correspondência). Faz match exato e, depois, por alias mais específico.
 * @param {string} rawName
 * @returns {CatalogEntry | null}
 */
export function resolveIngredient(rawName) {
  const norm = normalizeName(rawName);
  if (!norm) return null;

  const exact = ALIAS_INDEX.find((item) => item.alias === norm);
  if (exact) return exact.entry;

  for (const item of ALIAS_INDEX) {
    if (matchesWord(norm, item.alias)) return item.entry;
  }
  return null;
}

/**
 * Resolve um alvo de geração para QUALQUER nome (dinâmico): usa a entrada do
 * catálogo quando casa; senão deriva slug + label do próprio nome. Assim
 * "lasanha", "coxinha", etc. também geram.
 * @returns {{ slug: string, label: string, emoji?: string, color?: string }}
 */
export function resolveEntryOrName(rawName) {
  const entry = resolveIngredient(rawName);
  if (entry) {
    return { slug: entry.slug, label: entry.label, emoji: entry.emoji, color: entry.color };
  }
  return { slug: slugify(rawName), label: String(rawName ?? "").trim() };
}
