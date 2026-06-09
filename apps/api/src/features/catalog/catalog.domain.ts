import type { PublicCatalog, PublicCatalogProduct } from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";

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

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function whatsappLink(phone: string, productName?: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const message = productName
    ? `Olá! Vi seu catálogo e quero pedir: ${productName}`
    : "Olá! Vi seu catálogo e quero fazer um pedido.";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function productCard(product: PublicCatalogProduct, whatsapp: string | null): string {
  const photo = product.photoUrl
    ? `<img src="${escapeHtml(product.photoUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">`
    : `<div class="placeholder">${escapeHtml(product.name.charAt(0).toUpperCase())}</div>`;
  const unit = product.saleUnit === "kg" ? "/kg" : "";
  const description = product.description
    ? `<p class="desc">${escapeHtml(product.description)}</p>`
    : "";
  const orderButton = whatsapp
    ? `<a class="order" href="${whatsappLink(whatsapp, product.name)}">Pedir no WhatsApp</a>`
    : "";
  return `<div class="card">${photo}<div class="info"><h2>${escapeHtml(product.name)}</h2>${description}<p class="price">${formatPrice(product.salePrice)}${unit}</p>${orderButton}</div></div>`;
}

/** Renderiza a pagina HTML publica do catalogo (mobile-first, sem JS). */
export function renderCatalogHtml(catalog: PublicCatalog): string {
  const cards = catalog.products.map((p) => productCard(p, catalog.whatsapp)).join("");
  const headerButton = catalog.whatsapp
    ? `<a class="order hero" href="${whatsappLink(catalog.whatsapp)}">Fazer pedido no WhatsApp</a>`
    : "";
  const empty =
    catalog.products.length === 0
      ? `<p class="empty">Nenhum produto disponível no momento.</p>`
      : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(catalog.businessName)} — Catálogo</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #faf5f1; color: #3d2b22; }
  header { background: #8c5a45; color: #fff; padding: 28px 16px; text-align: center; }
  header h1 { font-size: 26px; }
  header p { margin-top: 4px; opacity: 0.85; font-size: 15px; }
  main { max-width: 720px; margin: 0 auto; padding: 16px; display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  .card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(61, 43, 34, 0.08); }
  .card img, .placeholder { width: 100%; height: 180px; object-fit: cover; display: flex; align-items: center; justify-content: center; font-size: 56px; color: #8c5a45; background: #f0e4dc; }
  .info { padding: 14px 16px 18px; }
  .info h2 { font-size: 18px; }
  .desc { margin-top: 4px; font-size: 14px; color: #6e564a; }
  .price { margin-top: 8px; font-size: 20px; font-weight: 700; color: #2e7d32; }
  .order { display: inline-block; margin-top: 12px; background: #25d366; color: #fff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 12px 18px; border-radius: 999px; }
  .order.hero { margin-top: 14px; }
  .empty { grid-column: 1 / -1; text-align: center; padding: 40px 0; color: #6e564a; }
  footer { text-align: center; padding: 24px 16px 40px; font-size: 13px; color: #9b8275; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(catalog.businessName)}</h1>
  <p>Catálogo de produtos</p>
  ${headerButton}
</header>
<main>${cards}${empty}</main>
<footer>Feito com Lucro Caseiro</footer>
</body>
</html>`;
}
