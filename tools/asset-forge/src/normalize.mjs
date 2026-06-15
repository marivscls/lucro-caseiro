// Normaliza nomes de insumo/produto para casar com o catálogo.
// Ex.: "Leite Condensado Moça 395g" -> "leite condensado moca".

// Tokens de unidade/medida e ruído que devem ser removidos do nome.
// Só unidades de medida puras + conectores. Recipientes (caixa, pote, saco,
// lata) NÃO entram aqui — eles também são produtos no catálogo.
const NOISE_TOKENS = new Set([
  "kg", "g", "mg", "ml", "l", "lt", "lts",
  "un", "und", "unid", "unidade", "unidades",
  "cx", "pct", "dz", "duzia", "duzias",
  "litro", "litros", "grama", "gramas", "quilo", "quilos", "kilo", "kilos",
  "de", "do", "da", "para", "pra", "com", "sem", "tipo", "kit",
]);

// Faixa de combining diacritical marks (U+0300–U+036F), construída via code
// points para evitar caracteres combinantes literais no fonte.
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");

/** Normaliza um nome livre para uma forma canônica comparável. */
export function normalizeName(raw) {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(ACCENTS, "") // remove acentos (combining marks)
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // remove conteúdo entre parênteses
    .replace(/[0-9]+([.,][0-9]+)?/g, " ") // remove números (qtd/peso)
    .replace(/[^a-z\s]/g, " ") // mantém só letras e espaço
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !NOISE_TOKENS.has(t))
    .join(" ")
    .trim();
}

/** Versão em slug (kebab-case) do nome normalizado. */
export function slugify(raw) {
  return normalizeName(raw).replace(/\s+/g, "-");
}
