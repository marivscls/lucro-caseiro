import { INGREDIENT_CATALOG, type IngredientEntry } from "./catalog";

// Resolve um nome livre de insumo/produto para uma entrada do catálogo.
// Espelha a lógica de tools/asset-forge (mesma normalização e match).

const NOISE_TOKENS = new Set([
  "kg",
  "g",
  "mg",
  "ml",
  "l",
  "lt",
  "lts",
  "un",
  "und",
  "unid",
  "unidade",
  "unidades",
  "cx",
  "pct",
  "dz",
  "duzia",
  "duzias",
  "litro",
  "litros",
  "grama",
  "gramas",
  "quilo",
  "quilos",
  "kilo",
  "kilos",
  "de",
  "do",
  "da",
  "para",
  "pra",
  "com",
  "sem",
  "tipo",
  "kit",
]);

const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");

/** Removes internal classification prefixes from names shown to the user. */
export function displayIngredientName(rawName: string): string {
  const trimmedName = rawName.trim();
  let visibleName = trimmedName;
  while (visibleName.startsWith("[")) {
    const prefixEnd = visibleName.indexOf("]");
    if (prefixEnd < 0) break;
    visibleName = visibleName.slice(prefixEnd + 1).trimStart();
  }
  return visibleName || trimmedName;
}

/** Normaliza um nome para forma canônica comparável (sem acento/número/unidade). */
export function normalizeName(raw: string | null | undefined): string {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(ACCENTS, "")
    .toLowerCase()
    .replace(/\d+/g, " ") // remove números (qtd/peso)
    .replace(/[^a-z\s]/g, " ") // mantém só letras e espaço (pontuação vira espaço)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !NOISE_TOKENS.has(t))
    .join(" ")
    .trim();
}

interface AliasRef {
  readonly alias: string;
  readonly entry: IngredientEntry;
}

const ALIAS_INDEX: AliasRef[] = buildAliasIndex();

function buildAliasIndex(): AliasRef[] {
  const index: AliasRef[] = [];
  for (const entry of INGREDIENT_CATALOG) {
    const candidates = new Set<string>([
      entry.label,
      entry.slug.replace(/-/g, " "),
      ...entry.aliases,
    ]);
    for (const candidate of candidates) {
      const alias = normalizeName(candidate);
      if (alias) index.push({ alias, entry });
    }
  }
  index.sort((a, b) => b.alias.length - a.alias.length);
  return index;
}

function matchesWord(haystack: string, needle: string): boolean {
  if (haystack === needle) return true;
  if (needle.includes(" ")) return ` ${haystack} `.includes(` ${needle} `);
  return haystack.split(" ").includes(needle);
}

/** Retorna a entrada do catálogo que casa com o nome, ou null. */
export function resolveIngredient(rawName: string): IngredientEntry | null {
  const norm = normalizeName(rawName);
  if (!norm) return null;

  const exact = ALIAS_INDEX.find((item) => item.alias === norm);
  if (exact) return exact.entry;

  for (const item of ALIAS_INDEX) {
    if (matchesWord(norm, item.alias)) return item.entry;
  }
  return null;
}

/** Slug (kebab-case) a partir de um nome livre. Ex.: "Lasanha à Bolonhesa" -> "lasanha-a-bolonhesa". */
export function slugify(name: string): string {
  return normalizeName(name).replace(/\s+/g, "-");
}

/** Slug usado para resolver a imagem de QUALQUER nome (dinâmico): usa o slug do
 * catálogo quando há correspondência, senão deriva do próprio nome. Assim
 * "lasanha", "coxinha", etc. também têm um slug estável p/ buscar/gerar o PNG.
 */
export function ingredientSlug(name: string): string {
  return resolveIngredient(name)?.slug ?? slugify(name);
}

/**
 * Slug da ilustração de catálogo. `null` quando `matchCatalog` é false — nomes
 * de receita/prato/embalagem não devem puxar PNG de insumo pelo slug.
 */
export function catalogIllustrationSlug(
  name: string,
  matchCatalog: boolean,
): string | null {
  if (!matchCatalog) return null;
  return ingredientSlug(name);
}
