import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Guias escritos pela Ametista: um JSON por guia em apps/web/content/guias, enviado ao
// repositório pela conexão GitHub dela. Cada arquivo vira /landing/guias/<slug> no build.

export type GuideArticle = {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly keyword: string;
  readonly publishedAt: string;
  readonly sections: readonly { readonly heading: string; readonly body: string }[];
  readonly faq: readonly { readonly question: string; readonly answer: string }[];
};

/** Letras minúsculas, números e hífens simples, sem hífen nas pontas. */
function validSlug(value: string): boolean {
  return (
    !value.startsWith("-") &&
    !value.endsWith("-") &&
    !value.includes("--") &&
    [...value].every((c) => (c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c === "-")
  );
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Guias escritos à mão têm rota própria; um arquivo com o mesmo endereço é ignorado. */
export const HANDWRITTEN_GUIDES = [
  "como-calcular-preco-de-venda",
  "como-colocar-mao-de-obra-no-preco",
  "precificacao-para-confeitaria",
] as const;

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length >= min && clean.length <= max ? clean : null;
}

/** Valida um guia. Devolve null quando algo obrigatório falta, para o build seguir sem ele. */
export function parseGuideArticle(raw: unknown, fileSlug: string): GuideArticle | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const slug = text(v.slug, 3, 80);
  const title = text(v.title, 10, 120);
  const description = text(v.description, 50, 200);
  if (!slug || slug !== fileSlug || !validSlug(slug) || !title || !description) return null;
  const sections = Array.isArray(v.sections)
    ? v.sections.flatMap((s) => {
        const item = s as Record<string, unknown>;
        const heading = text(item?.heading, 3, 120);
        const body = text(item?.body, 20, 6000);
        return heading && body ? [{ heading, body }] : [];
      })
    : [];
  if (sections.length < 2) return null;
  const faq = Array.isArray(v.faq)
    ? v.faq.flatMap((f) => {
        const item = f as Record<string, unknown>;
        const question = text(item?.question, 5, 200);
        const answer = text(item?.answer, 10, 1200);
        return question && answer ? [{ question, answer }] : [];
      })
    : [];
  const publishedAt = typeof v.publishedAt === "string" ? v.publishedAt : "";
  if (!DAY.test(publishedAt)) return null;
  return {
    slug,
    title,
    description,
    keyword: text(v.keyword, 2, 120) ?? "",
    publishedAt,
    sections,
    faq: faq.slice(0, 6),
  };
}

/** O build e o servidor rodam dentro de apps/web (pnpm --filter). */
const GUIDES_DIR = path.join(process.cwd(), "content", "guias");

export function loadGuideArticles(dir: string | null = GUIDES_DIR): GuideArticle[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- pasta fixa do build, não vem de entrada externa
  if (!dir || !existsSync(/*turbopackIgnore: true*/ dir)) return [];
  const handwritten = new Set<string>(HANDWRITTEN_GUIDES);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- pasta fixa do build, não vem de entrada externa
  return readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const slug = file.slice(0, -".json".length);
      if (handwritten.has(slug)) return [];
      try {
        const article = parseGuideArticle(
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- arquivo listado da própria pasta de guias
          JSON.parse(readFileSync(/*turbopackIgnore: true*/ path.join(dir, file), "utf8")),
          slug,
        );
        return article ? [article] : [];
      } catch {
        return [];
      }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function findGuideArticle(slug: string): GuideArticle | undefined {
  return loadGuideArticles().find((article) => article.slug === slug);
}

/** Parágrafos do corpo: separados por linha em branco. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
