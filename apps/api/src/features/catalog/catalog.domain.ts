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
    ? `Olá! 😊 Vi seu catálogo e adorei. Gostaria de encomendar: *${productName}* 🛍️`
    : "Olá! 😊 Vi seu catálogo e gostaria de fazer um pedido. 🛍️";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const WHATSAPP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.2c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.2 1.3Z"/></svg>`;

function productCard(product: PublicCatalogProduct, whatsapp: string | null): string {
  const photo = product.photoUrl
    ? `<img src="${escapeHtml(product.photoUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">`
    : `<div class="placeholder"><span>${escapeHtml(product.name.charAt(0).toUpperCase())}</span></div>`;
  const unit = product.saleUnit === "kg" ? "/kg" : "";
  const description = product.description
    ? `<p class="desc">${escapeHtml(product.description)}</p>`
    : "";
  const orderButton = whatsapp
    ? `<a class="order" href="${whatsappLink(whatsapp, product.name)}">${WHATSAPP_ICON}Pedir no WhatsApp</a>`
    : "";
  return `<article class="card"><div class="photo">${photo}</div><div class="info"><h2>${escapeHtml(product.name)}</h2>${description}<div class="bottom"><p class="price">${formatPrice(product.salePrice)}<span class="unit">${unit}</span></p>${orderButton}</div></div></article>`;
}

/** Renderiza a pagina HTML publica do catalogo (mobile-first, sem JS). */
/**
 * Presets de cor do catalogo (personalizacao Premium). `dark`/`base`/`light`
 * compoem o gradiente do hero; `accent` colore detalhes (rodape, placeholder).
 */
interface AccentPalette {
  dark: string;
  base: string;
  light: string;
  bg: string;
}

const BROWN_PALETTE: AccentPalette = {
  dark: "#6e4534",
  base: "#8c5a45",
  light: "#a8715a",
  bg: "#f7efe9",
};

export const CATALOG_ACCENT_PRESETS: Record<string, AccentPalette> = {
  brown: BROWN_PALETTE,
  rose: { dark: "#9c3d5c", base: "#c2557b", light: "#d97a9c", bg: "#faf0f3" },
  green: { dark: "#2f5d3e", base: "#447a55", light: "#639672", bg: "#eff5f0" },
  lavender: { dark: "#5c4a8c", base: "#7a64b0", light: "#9883cc", bg: "#f4f1fa" },
  blue: { dark: "#2c5577", base: "#3f74a0", light: "#6494bd", bg: "#eef4f8" },
  amber: { dark: "#8c6420", base: "#b3852f", light: "#cda354", bg: "#faf5ea" },
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Mistura um canal RGB com um alvo (0 = preto, 255 = branco) na proporcao dada. */
function mixChannel(channel: number, target: number, ratio: number): number {
  return Math.round(channel + (target - channel) * ratio);
}

/** Deriva a paleta (gradiente + fundo) a partir de um hex base escolhido pelo usuario. */
export function paletteFromHex(hex: string): AccentPalette {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toHex = (cr: number, cg: number, cb: number) =>
    `#${[cr, cg, cb].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  return {
    base: toHex(r, g, b),
    dark: toHex(mixChannel(r, 0, 0.25), mixChannel(g, 0, 0.25), mixChannel(b, 0, 0.25)),
    light: toHex(
      mixChannel(r, 255, 0.2),
      mixChannel(g, 255, 0.2),
      mixChannel(b, 255, 0.2),
    ),
    bg: toHex(
      mixChannel(r, 255, 0.93),
      mixChannel(g, 255, 0.93),
      mixChannel(b, 255, 0.93),
    ),
  };
}

// Patterns decorativos sobre o gradiente do hero (CSS puro, sem imagens).
const HERO_PATTERNS: Record<string, string> = {
  dots: "background-image: radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 1.5px); background-size: 16px 16px;",
  bubbles:
    "background-image: radial-gradient(rgba(255,255,255,0.14) 9px, transparent 10px); background-size: 56px 56px;",
  grid: "background-image: linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px); background-size: 26px 26px;",
  stripes:
    "background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.09) 0 10px, transparent 10px 24px);",
};

function resolvePalette(accentColor: string | null): AccentPalette {
  if (!accentColor) return BROWN_PALETTE;
  if (HEX_COLOR_REGEX.test(accentColor)) return paletteFromHex(accentColor);
  return CATALOG_ACCENT_PRESETS[accentColor] ?? BROWN_PALETTE;
}

export function renderCatalogHtml(catalog: PublicCatalog): string {
  const palette = resolvePalette(catalog.accentColor);
  const cards = catalog.products.map((p) => productCard(p, catalog.whatsapp)).join("");
  const initial = escapeHtml(catalog.businessName.charAt(0).toUpperCase() || "?");
  const count = catalog.products.length;
  const countLabel =
    count === 1 ? "1 produto disponível" : `${count} produtos disponíveis`;
  const headerButton = catalog.whatsapp
    ? `<a class="order hero" href="${whatsappLink(catalog.whatsapp)}">${WHATSAPP_ICON}Fazer pedido no WhatsApp</a>`
    : "";
  const cover = catalog.coverUrl
    ? `<div class="cover"><img src="${escapeHtml(catalog.coverUrl)}" alt=""></div>`
    : "";
  const patternCss = catalog.pattern ? (HERO_PATTERNS[catalog.pattern] ?? "") : "";
  const patternOverlay = patternCss ? `<div class="pattern"></div>` : "";
  const avatar = catalog.logoUrl
    ? `<div class="avatar"><img src="${escapeHtml(catalog.logoUrl)}" alt=""></div>`
    : `<div class="avatar">${initial}</div>`;
  const tagline = catalog.tagline
    ? `<p class="bio">${escapeHtml(catalog.tagline)}</p>`
    : "";
  const empty =
    count === 0
      ? `<div class="empty"><div class="empty-icon">🧺</div><p>Nenhum produto disponível no momento.</p><p class="empty-sub">Volte em breve — novidades chegando!</p></div>`
      : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Catálogo de produtos de ${escapeHtml(catalog.businessName)}. Peça pelo WhatsApp!">
<meta property="og:title" content="${escapeHtml(catalog.businessName)} — Catálogo">
<meta property="og:description" content="${countLabel}. Peça pelo WhatsApp!">
<title>${escapeHtml(catalog.businessName)} — Catálogo</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: ${palette.bg}; color: #3d2b22; -webkit-font-smoothing: antialiased; }
  .cover img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .hero-bg { background: linear-gradient(160deg, ${palette.dark} 0%, ${palette.base} 55%, ${palette.light} 100%); padding: 44px 20px 72px; text-align: center; color: #fff; position: relative; overflow: hidden; }
  .bio { margin-top: 10px; font-size: 15px; line-height: 1.5; opacity: 0.92; max-width: 480px; margin-left: auto; margin-right: auto; position: relative; z-index: 1; }
  .hero-bg::before { content: ""; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px; border-radius: 50%; background: rgba(255,255,255,0.06); }
  .hero-bg::after { content: ""; position: absolute; bottom: -80px; left: -40px; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .pattern { position: absolute; inset: 0; pointer-events: none; ${patternCss} }
  .avatar { width: 76px; height: 76px; border-radius: 50%; background: rgba(255,255,255,0.16); border: 2px solid rgba(255,255,255,0.45); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-family: Georgia, "Times New Roman", serif; font-size: 34px; font-weight: 700; position: relative; z-index: 1; overflow: hidden; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 30px; letter-spacing: 0.2px; position: relative; z-index: 1; }
  .tagline { margin-top: 6px; font-size: 14px; letter-spacing: 2.5px; text-transform: uppercase; opacity: 0.78; position: relative; z-index: 1; }
  .count { display: inline-block; margin-top: 14px; font-size: 13px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 999px; position: relative; z-index: 1; }
  main { max-width: 760px; margin: -44px auto 0; padding: 0 16px 16px; display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); position: relative; z-index: 2; }
  .card { background: #fffdfb; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(61, 43, 34, 0.12), 0 2px 6px rgba(61, 43, 34, 0.06); border: 1px solid rgba(140, 90, 69, 0.08); display: flex; flex-direction: column; transition: transform 0.15s ease; }
  .card:hover { transform: translateY(-2px); }
  .photo img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3e6dd, #e9d5c8); }
  .placeholder span { font-family: Georgia, serif; font-size: 64px; color: #b08368; }
  .info { padding: 18px 18px 20px; display: flex; flex-direction: column; flex: 1; }
  .info h2 { font-family: Georgia, "Times New Roman", serif; font-size: 20px; font-weight: 700; color: #4a3228; }
  .desc { margin-top: 6px; font-size: 14px; line-height: 1.5; color: #7d6354; }
  .bottom { margin-top: auto; padding-top: 14px; }
  .price { font-size: 24px; font-weight: 800; color: #2e7d32; letter-spacing: -0.3px; }
  .price .unit { font-size: 14px; font-weight: 600; color: #6da471; }
  .order { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; background: #25d366; color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 20px; border-radius: 999px; box-shadow: 0 6px 16px rgba(37, 211, 102, 0.35); }
  .order:active { transform: scale(0.98); }
  .order svg { width: 18px; height: 18px; }
  .order.hero { margin-top: 18px; background: #fff; color: ${palette.dark}; box-shadow: 0 8px 22px rgba(0,0,0,0.18); position: relative; z-index: 1; }
  .empty { grid-column: 1 / -1; text-align: center; padding: 56px 20px; background: #fffdfb; border-radius: 20px; box-shadow: 0 10px 30px rgba(61, 43, 34, 0.1); }
  .empty-icon { font-size: 44px; margin-bottom: 12px; }
  .empty p { font-size: 16px; font-weight: 600; color: #4a3228; }
  .empty .empty-sub { margin-top: 6px; font-size: 14px; font-weight: 400; color: #9b8275; }
  footer { text-align: center; padding: 32px 16px 44px; font-size: 13px; color: #9b8275; }
  footer strong { color: ${palette.base}; }
</style>
</head>
<body>
${cover}
<div class="hero-bg">
  ${patternOverlay}
  ${avatar}
  <h1>${escapeHtml(catalog.businessName)}</h1>
  <p class="tagline">Catálogo de produtos</p>
  ${tagline}
  ${count > 0 ? `<span class="count">${countLabel}</span>` : ""}
  ${headerButton}
</div>
<main>${cards}${empty}</main>
<footer>Feito com carinho no <strong>Lucro Caseiro</strong> 🧡</footer>
</body>
</html>`;
}
