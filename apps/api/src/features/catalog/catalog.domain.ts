import type { PublicCatalog } from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";

import { renderPublishedStorefrontHtml } from "./storefront-renderer";

/** Gera um slug a partir do nome do negocio (ex.: "Doces da Má" -> "doces-da-ma"). */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-")
    .slice(0, 40)
    .replace(/-$/, "");
  return CATALOG_SLUG_REGEX.test(slug) ? slug : "meu-catalogo";
}

export function isValidSlug(slug: string): boolean {
  return CATALOG_SLUG_REGEX.test(slug);
}

export type CatalogSection = "all" | "products" | "services";

export function renderCatalogHtml(
  catalog: PublicCatalog,
  section: CatalogSection = "all",
  nonce = "",
  options: Readonly<{ preview?: boolean }> = {},
): string {
  return renderPublishedStorefrontHtml(catalog, section, nonce, options.preview === true);
}

export function renderCatalogErrorHtml(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo indisponível — Lucro Caseiro</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#fff8f6;color:#2e2826;font-family:"Nunito Sans",system-ui,sans-serif}
main{width:min(100%,520px);padding:32px;background:#fff;border:1px solid #eadedb;border-radius:20px;text-align:center}
.mark{width:64px;height:64px;margin:0 auto 18px;display:grid;place-items:center;border-radius:50%;background:#fde8ec;color:#b45b6d;font-size:30px}
h1{margin:0;font:700 30px/1.15 "Nunito Sans",system-ui,sans-serif}p{margin:12px 0 22px;color:#716866;line-height:1.55}
a{min-height:48px;border:1px solid #b45b6d;border-radius:999px;background:#fff;color:#a94e61;padding:0 22px;display:inline-flex;align-items:center;text-decoration:none;font:800 15px "Nunito Sans",sans-serif;cursor:pointer}
</style>
</head>
<body><main><div class="mark" aria-hidden="true">!</div><h1>Não foi possível abrir o catálogo</h1><p>Verifique sua conexão e tente carregar novamente.</p><a href="">Tentar novamente</a></main></body>
</html>`;
}
