import type {
  PublicCatalog,
  PublicCatalogProduct,
  PublicCatalogService,
} from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";
import { resolveBrand } from "@lucro-caseiro/brands";

/** Link da ficha do app na Play Store, com UTM pra medir instalacoes vindas do catalogo. */
function catalogPlayStoreUrl(brandId: string): string {
  const brand = resolveBrand(brandId);
  return `https://play.google.com/store/apps/details?id=${brand.androidPackage}&referrer=utm_source%3Dcatalogo%26utm_medium%3Dreferral%26utm_campaign%3Dcatalogo_compartilhado`;
}

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

function catalogItemCountLabel(productCount: number, serviceCount: number): string {
  if (productCount > 0 && serviceCount > 0) {
    const productsLabel = productCount === 1 ? "produto" : "produtos";
    const servicesLabel = serviceCount === 1 ? "serviço" : "serviços";
    return `${productCount} ${productsLabel} e ${serviceCount} ${servicesLabel}`;
  }
  if (serviceCount > 0) {
    return serviceCount === 1
      ? "1 serviço disponível"
      : `${serviceCount} serviços disponíveis`;
  }
  return productCount === 1
    ? "1 produto disponível"
    : `${productCount} produtos disponíveis`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function whatsappLink(phone: string, productName?: string, priceLabel?: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  const priceSuffix = priceLabel ? ` — ${priceLabel}` : "";
  const message = productName
    ? `Olá! 😊 Vi seu catálogo e adorei. Gostaria de encomendar: *${productName}${priceSuffix}* 🛍️`
    : "Olá! 😊 Vi seu catálogo e gostaria de fazer um pedido. 🛍️";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const WHATSAPP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.2c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.1c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4 0 .1 0 .7-.2 1.3Z"/></svg>`;

function productCard(
  product: PublicCatalogProduct,
  whatsapp: string | null,
  retailOrdering: boolean,
): string {
  const allPhotos = [product.photoUrl, ...product.extraPhotos].filter(
    (url): url is string => !!url,
  );
  const img = (url: string) =>
    `<img src="${escapeHtml(url)}" alt="${escapeHtml(product.name)}" loading="lazy">`;
  let photo: string;
  if (allPhotos.length === 0) {
    photo = `<div class="placeholder"><span>${escapeHtml(product.name.charAt(0).toUpperCase())}</span></div>`;
  } else if (allPhotos.length === 1) {
    photo = img(allPhotos[0]!);
  } else {
    // Tira de miniaturas: carrossel horizontal com scroll-snap (CSS puro, sem JS).
    photo = `<div class="gallery">${allPhotos.map(img).join("")}</div>`;
  }
  const unit = product.saleUnit === "kg" ? "/kg" : "";
  const description = product.description
    ? `<p class="desc">${escapeHtml(product.description)}</p>`
    : "";
  const category = `<p class="category">${escapeHtml(product.category)}</p>`;
  const variationSelect = retailOrdering
    ? `<select class="variation-select" aria-label="Variação de ${escapeHtml(product.name)}">${product.variations
        .filter((variation) => variation.inStock)
        .map(
          (variation) =>
            `<option value="${escapeHtml(variation.id)}">${escapeHtml(variation.name)}</option>`,
        )
        .join("")}</select>`
    : "";
  const variations = product.variations.length
    ? `<div class="variants">${product.variations
        .map(
          (variation) =>
            `<span class="variant${variation.inStock ? "" : " sold-out"}">${escapeHtml(variation.name)}${variation.inStock ? "" : " · esgotado"}</span>`,
        )
        .join("")}</div>${variationSelect}`
    : "";
  const priceLabel = `${formatPrice(product.salePrice)}${unit}`;
  const orderButton = whatsapp
    ? `<a class="order" href="${whatsappLink(whatsapp, product.name, priceLabel)}">${WHATSAPP_ICON}Pedir no WhatsApp</a>`
    : "";
  const canAdd =
    product.variations.length === 0 ||
    product.variations.some((variation) => variation.inStock);
  const cartLabel = canAdd ? "Adicionar à reserva" : "Produto esgotado";
  const cartDisabled = canAdd ? "" : " disabled";
  const cartButton = retailOrdering
    ? `<button class="add-cart" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}" data-price="${product.salePrice}"${cartDisabled}>${cartLabel}</button>`
    : "";
  return `<article class="card" data-category="${escapeHtml(product.category)}" data-name="${escapeHtml(product.name.toLocaleLowerCase("pt-BR"))}" data-price="${product.salePrice}" id="produto-${escapeHtml(product.id)}"><div class="photo">${photo}</div><div class="info">${category}<h2>${escapeHtml(product.name)}</h2>${description}${variations}<div class="bottom"><p class="price">${formatPrice(product.salePrice)}<span class="unit">${unit}</span></p>${cartButton}${orderButton}</div></div></article>`;
}

function serviceOptionGroup(label: string, chips: string[]): string {
  if (chips.length === 0) return "";
  return `<div class="option-group"><p class="option-label">${escapeHtml(label)}</p><div class="variants">${chips
    .map((chip) => `<span class="variant">${chip}</span>`)
    .join("")}</div></div>`;
}

function serviceCard(service: PublicCatalogService): string {
  const locationLabel = {
    business: "No espaço profissional",
    client: "No endereço do cliente",
    online: "Atendimento online",
    flexible: "Local a combinar",
  }[service.locationMode];
  const initial = escapeHtml(service.name.charAt(0).toUpperCase() || "S");
  const description = service.description
    ? `<p class="desc">${escapeHtml(service.description)}</p>`
    : "";
  const price =
    service.defaultPrice === null
      ? `<p class="price consultation">Preço sob consulta</p>`
      : `<p class="price"><span class="from">A partir de</span> ${formatPrice(service.defaultPrice)}</p>`;
  const meta = `<div class="variants service-meta"><span class="variant">${service.durationMinutes} min</span><span class="variant">${escapeHtml(locationLabel)}</span></div>`;
  const variations = serviceOptionGroup(
    "Opções",
    service.variations.map(
      (variation) =>
        `${escapeHtml(variation.name)} · ${variation.durationMinutes} min · ${formatPrice(variation.price)}`,
    ),
  );
  const addOns = serviceOptionGroup(
    "Adicionais",
    service.addOns.map(
      (addOn) => `+ ${escapeHtml(addOn.name)} · ${formatPrice(addOn.price)}`,
    ),
  );
  const packages = serviceOptionGroup(
    "Pacotes",
    service.packages.map(
      (servicePackage) =>
        `${escapeHtml(servicePackage.name)} · ${servicePackage.sessions} sessões · ${formatPrice(servicePackage.price)}`,
    ),
  );
  const bookingInstructions = service.bookingInstructions
    ? `<p class="booking-instructions"><strong>Antes de solicitar:</strong> ${escapeHtml(service.bookingInstructions)}</p>`
    : "";

  return `<article class="card service-card"><div class="photo"><div class="placeholder service-placeholder"><span>${initial}</span></div></div><div class="info"><p class="category">Serviço</p><h2>${escapeHtml(service.name)}</h2>${description}${meta}${variations}${addOns}${packages}${bookingInstructions}<div class="bottom">${price}<button class="request-service" type="button" data-service-id="${escapeHtml(service.id)}" data-service-name="${escapeHtml(service.name)}">Solicitar horário</button></div></div></article>`;
}

function catalogHeroTagline(productCount: number, serviceCount: number): string {
  if (productCount > 0 && serviceCount > 0) return "Produtos e serviços";
  if (serviceCount > 0) return "Serviços";
  return "Catálogo de produtos";
}

/** Renderiza a pagina HTML publica do catalogo (mobile-first, sem JS). */
/**
 * Presets de cor do catálogo (personalização do Essencial). `dark`/`base`/`light`
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
  const brand = resolveBrand(catalog.brandId);
  const palette =
    catalog.accentColor === null && catalog.brandId === "lucro-caseiro"
      ? (CATALOG_ACCENT_PRESETS.rose ?? BROWN_PALETTE)
      : resolvePalette(catalog.accentColor);
  const retailOrdering = catalog.brandId === "lucro-papelaria";
  const cards = catalog.products
    .map((product) => productCard(product, catalog.whatsapp, retailOrdering))
    .join("");
  const publicServices = catalog.services ?? [];
  const serviceCards = publicServices.map(serviceCard).join("");
  const categories = [
    ...new Set(catalog.products.map((product) => product.category)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const count = catalog.products.length;
  const serviceCount = publicServices.length;
  const totalCount = count + serviceCount;
  const filters =
    count > 0
      ? `<section class="catalog-tools" aria-label="Filtros do catálogo">
  <label class="search"><span>Buscar</span><input id="catalog-search" type="search" placeholder="Nome do produto"></label>
  <label><span>Categoria</span><select id="catalog-category"><option value="">Todas</option>${categories
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    )
    .join("")}</select></label>
  <label><span>Ordenar</span><select id="catalog-sort"><option value="name">Nome</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
</section>`
      : "";
  const initial = escapeHtml(catalog.businessName.charAt(0).toUpperCase() || "?");
  const countLabel = catalogItemCountLabel(count, serviceCount);
  const headerButton = catalog.whatsapp
    ? `<a class="order hero" href="${whatsappLink(catalog.whatsapp)}">${WHATSAPP_ICON}Fazer pedido no WhatsApp</a>`
    : "";
  // Capa integrada: vira o fundo do proprio hero, com um veu da cor por cima
  // para manter nome/frase legiveis (evita "banner duplo" capa + cor).
  const heroBackground = catalog.coverUrl
    ? `background-image: linear-gradient(160deg, ${palette.dark}e6 0%, ${palette.base}cc 55%, ${palette.light}b3 100%), url('${escapeHtml(catalog.coverUrl)}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(160deg, ${palette.dark} 0%, ${palette.base} 55%, ${palette.light} 100%);`;
  // Com capa, a estampa sairia poluida — so aplica pattern sem capa.
  const patternCss =
    catalog.pattern && !catalog.coverUrl ? (HERO_PATTERNS[catalog.pattern] ?? "") : "";
  const patternOverlay = patternCss ? `<div class="pattern"></div>` : "";
  const avatar = catalog.logoUrl
    ? `<div class="avatar"><img src="${escapeHtml(catalog.logoUrl)}" alt=""></div>`
    : `<div class="avatar">${initial}</div>`;
  const tagline = catalog.tagline
    ? `<p class="bio">${escapeHtml(catalog.tagline)}</p>`
    : "";
  const promoStrip = catalog.promoBanner
    ? `<div class="promo">${escapeHtml(catalog.promoBanner)}</div>`
    : "";
  const hiddenCount = catalog.totalProducts - count;
  const moreNote =
    hiddenCount > 0
      ? `<p class="more-note">Mostrando ${count} de ${catalog.totalProducts} produtos</p>`
      : "";
  const empty =
    totalCount === 0
      ? `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 120 120" width="104" height="104" aria-hidden="true"><defs><linearGradient id="ebg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7ece4"/><stop offset="1" stop-color="#f0ddd1"/></linearGradient><linearGradient id="ebd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a50"/><stop offset="1" stop-color="#7a4c39"/></linearGradient><linearGradient id="erm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86573f"/><stop offset="1" stop-color="#6e4534"/></linearGradient><linearGradient id="ep1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8B4BC"/><stop offset="1" stop-color="#C4707E"/></linearGradient><linearGradient id="ep2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fdcbd"/><stop offset="1" stop-color="#5da883"/></linearGradient><linearGradient id="ep3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecc78a"/><stop offset="1" stop-color="#c08c3f"/></linearGradient></defs><path d="M60 8 C92 6 112 28 110 60 C108 94 88 112 58 110 C26 108 8 90 10 58 C12 28 30 10 60 8 Z" fill="url(#ebg)"/><path d="M22 30 L24.5 36 L31 38 L24.5 40 L22 46 L19.5 40 L13 38 L19.5 36 Z" fill="#E8B4BC" opacity="0.9"/><path d="M100 78 L101.8 82.5 L106 84 L101.8 85.5 L100 90 L98.2 85.5 L94 84 L98.2 82.5 Z" fill="#D4A054" opacity="0.85"/><ellipse cx="60" cy="102" rx="34" ry="6" fill="#6e4534" opacity="0.14"/><path d="M36 56 Q60 22 84 56" stroke="#6e4534" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="44" cy="50" r="14" fill="url(#ep1)"/><ellipse cx="40" cy="45" rx="5" ry="3" fill="#fff" opacity="0.5"/><circle cx="66" cy="45" r="12.5" fill="url(#ep2)"/><ellipse cx="62.5" cy="40.5" rx="4.5" ry="2.6" fill="#fff" opacity="0.5"/><circle cx="82" cy="54" r="10" fill="url(#ep3)"/><ellipse cx="79" cy="50.5" rx="3.6" ry="2.2" fill="#fff" opacity="0.55"/><path d="M24 58 L96 58 L89 95 Q87.8 101.5 81.5 101.5 L38.5 101.5 Q32.2 101.5 31 95 Z" fill="url(#ebd)"/><path d="M27.5 76 L92.5 76 L91 83 L29 83 Z" fill="#6e4534" opacity="0.35"/><line x1="42" y1="60" x2="45" y2="100" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><line x1="60" y1="60" x2="60" y2="101" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><line x1="78" y1="60" x2="75" y2="100" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><rect x="22" y="55" width="76" height="10" rx="5" fill="url(#erm)"/><rect x="26" y="57" width="68" height="3" rx="1.5" fill="#a06a50" opacity="0.7"/></svg></div><p>Nada disponível no momento.</p><p class="empty-sub">Volte em breve — novidades chegando!</p></div>`
      : "";
  const productsHeading =
    count > 0 && serviceCount > 0
      ? `<div class="section-heading"><p class="category">Compre agora</p><h2 id="products-title">Produtos</h2><p>Escolha o que deseja e peça pelo WhatsApp.</p></div>`
      : "";
  const servicesHeading =
    serviceCount > 0
      ? `<div class="section-heading"><p class="category">Agende seu atendimento</p><h2 id="services-title">Serviços</h2><p>Escolha o que precisa e envie uma solicitação de horário.</p></div>`
      : "";
  const servicesSection =
    serviceCount > 0
      ? `<section class="catalog-section services-section" aria-labelledby="services-title">${servicesHeading}<div class="catalog-grid">${serviceCards}</div></section>`
      : "";
  const productsAriaLabel =
    count > 0 && serviceCount > 0 ? ' aria-labelledby="products-title"' : "";
  const productsSection =
    count > 0 || totalCount === 0
      ? `<section class="catalog-section products-section"${productsAriaLabel}>${productsHeading}<div class="catalog-grid" id="catalog-products">${cards}${moreNote}${empty}</div></section>`
      : "";
  const heroTagline = catalogHeroTagline(count, serviceCount);
  const bookingDialog =
    serviceCount > 0
      ? `<dialog id="service-booking-dialog"><form id="service-booking-form"><button type="button" class="booking-close" aria-label="Fechar">×</button><p class="category">Solicitar horário</p><h2 id="booking-service-name"></h2><input id="booking-service-id" type="hidden"><label>Seu nome<input id="booking-name" required maxlength="120" autocomplete="name"></label><label>WhatsApp<input id="booking-phone" required minlength="8" maxlength="20" inputmode="tel" autocomplete="tel"></label><div class="booking-row"><label>Data desejada<input id="booking-date" type="date" required></label><label>Horário desejado<input id="booking-time" type="time"></label></div><label>Onde prefere ser atendida(o)?<select id="booking-location" required><option value="business">No espaço profissional</option><option value="client">No meu endereço</option><option value="online">Online</option></select></label><label>Observações<textarea id="booking-notes" maxlength="500" placeholder="Conte um pouco do que precisa"></textarea></label><button class="booking-submit" type="submit">Enviar solicitação</button><p id="booking-message" role="status"></p></form></dialog>`
      : "";
  const cart = retailOrdering
    ? `<button id="cart-toggle" class="cart-toggle" hidden>Reserva · <span id="cart-count">0</span> itens</button>
<dialog id="cart-dialog"><form id="cart-form"><button type="button" class="cart-close" aria-label="Fechar">×</button><h2>Reservar produtos</h2><div id="cart-items"></div><label>Seu nome<input id="customer-name" required maxlength="120"></label><label>WhatsApp<input id="customer-phone" required minlength="8" maxlength="20" inputmode="tel"></label><label>Recebimento<select id="fulfillment"><option value="pickup">Retirar na loja</option><option value="delivery">Entrega</option></select></label><label>Observações<textarea id="order-notes" maxlength="500"></textarea></label><button class="reserve-submit" type="submit">Confirmar reserva</button><p id="cart-message" role="status"></p></form></dialog>`
    : "";
  const cartScript = retailOrdering
    ? `<script>
(() => {
  const cart = new Map();
  const toggle = document.getElementById("cart-toggle");
  const dialog = document.getElementById("cart-dialog");
  const itemsNode = document.getElementById("cart-items");
  const countNode = document.getElementById("cart-count");
  const message = document.getElementById("cart-message");
  const render = () => {
    const items = [...cart.values()];
    countNode.textContent = String(items.reduce((sum, item) => sum + item.quantity, 0));
    toggle.hidden = items.length === 0;
    itemsNode.replaceChildren(...items.map((item) => {
      const row = document.createElement("p");
      row.textContent = item.name + (item.variationName ? " — " + item.variationName : "") + " × " + item.quantity;
      return row;
    }));
  };
  document.querySelectorAll(".add-cart").forEach((button) => button.addEventListener("click", () => {
    const card = button.closest(".card");
    const select = card.querySelector(".variation-select");
    const variationId = select?.value || undefined;
    const variationName = select?.selectedOptions?.[0]?.textContent || undefined;
    const key = button.dataset.productId + ":" + (variationId || "product");
    const current = cart.get(key);
    cart.set(key, { productId: button.dataset.productId, name: button.dataset.productName, variationId, variationName, quantity: (current?.quantity || 0) + 1 });
    render();
  }));
  toggle.addEventListener("click", () => dialog.showModal());
  document.querySelector(".cart-close").addEventListener("click", () => dialog.close());
  document.getElementById("cart-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Reservando…";
    const slug = location.pathname.split("/").filter(Boolean).pop();
    const response = await fetch("/api/v1/public/retail/catalog-orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-brand": "lucro-papelaria" },
      body: JSON.stringify({
        slug,
        customerName: document.getElementById("customer-name").value,
        customerPhone: document.getElementById("customer-phone").value,
        fulfillment: document.getElementById("fulfillment").value,
        notes: document.getElementById("order-notes").value || undefined,
        items: [...cart.values()].map(({ productId, variationId, quantity }) => ({ productId, variationId, quantity })),
      }),
    });
    const result = await response.json();
    if (!response.ok) { message.textContent = result.message || result.details?.join(" · ") || "Não foi possível reservar."; return; }
    cart.clear(); render();
    message.textContent = "Reserva confirmada! A loja entrará em contato.";
  });
})();
</script>`
    : "";
  const bookingScript =
    serviceCount > 0
      ? `<script>
(() => {
  const dialog = document.getElementById("service-booking-dialog");
  const form = document.getElementById("service-booking-form");
  const message = document.getElementById("booking-message");
  document.getElementById("booking-date").min = new Date().toISOString().slice(0, 10);
  document.querySelectorAll(".request-service").forEach((button) => button.addEventListener("click", () => {
    document.getElementById("booking-service-id").value = button.dataset.serviceId;
    document.getElementById("booking-service-name").textContent = button.dataset.serviceName;
    message.textContent = "";
    dialog.showModal();
  }));
  document.querySelector(".booking-close").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Enviando solicitação…";
    const preferredDate = document.getElementById("booking-date").value;
    const preferredTime = document.getElementById("booking-time").value;
    const response = await fetch(location.pathname + "/service-bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId: document.getElementById("booking-service-id").value,
        clientName: document.getElementById("booking-name").value,
        phone: document.getElementById("booking-phone").value,
        desiredDate: preferredDate,
        desiredTime: preferredTime || null,
        locationMode: document.getElementById("booking-location").value,
        notes: document.getElementById("booking-notes").value || null,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      message.textContent = result.message || result.details?.join(" · ") || "Não foi possível enviar. Tente novamente.";
      return;
    }
    form.reset();
    message.textContent = "Solicitação enviada! O negócio entrará em contato para confirmar.";
  });
})();
</script>`
      : "";
  const catalogScript =
    count > 0
      ? `<script>
(() => {
  const root = document.getElementById("catalog-products");
  const search = document.getElementById("catalog-search");
  const category = document.getElementById("catalog-category");
  const sort = document.getElementById("catalog-sort");
  const cards = [...root.querySelectorAll(".card")];
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    cards.forEach((card) => {
      const matchesName = !query || card.dataset.name.includes(query);
      const matchesCategory = !category.value || card.dataset.category === category.value;
      card.hidden = !(matchesName && matchesCategory);
    });
    const ordered = [...cards].sort((a, b) => {
      if (sort.value === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
      if (sort.value === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
      return a.dataset.name.localeCompare(b.dataset.name, "pt-BR");
    });
    const anchor = root.querySelector(".more-note");
    ordered.forEach((card) => root.insertBefore(card, anchor));
  };
  search.addEventListener("input", update);
  category.addEventListener("change", update);
  sort.addEventListener("change", update);
  update();
})();
</script>`
      : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(heroTagline)} de ${escapeHtml(catalog.businessName)}. Conheça a vitrine e solicite seu atendimento.">
<meta property="og:title" content="${escapeHtml(catalog.businessName)} — Catálogo">
<meta property="og:description" content="${countLabel}. Conheça a vitrine e solicite seu atendimento.">
<title>${escapeHtml(catalog.businessName)} — Catálogo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Nunito Sans", system-ui, sans-serif; background: ${palette.bg}; color: #3d2b22; -webkit-font-smoothing: antialiased; }
  .promo { background: ${palette.dark}; color: #fff; text-align: center; font-size: 14px; font-weight: 700; padding: 11px 16px; letter-spacing: 0.3px; }
  .hero-bg { ${heroBackground} padding: 44px 20px 72px; text-align: center; color: #fff; position: relative; overflow: hidden; }
  .bio { margin-top: 10px; font-size: 15px; line-height: 1.5; opacity: 0.92; max-width: 480px; margin-left: auto; margin-right: auto; position: relative; z-index: 1; }
  .hero-bg::before { content: ""; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px; border-radius: 50%; background: rgba(255,255,255,0.06); }
  .hero-bg::after { content: ""; position: absolute; bottom: -80px; left: -40px; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .pattern { position: absolute; inset: 0; pointer-events: none; ${patternCss} }
  .avatar { width: 76px; height: 76px; border-radius: 50%; background: rgba(255,255,255,0.16); border: 2px solid rgba(255,255,255,0.45); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-family: "Nunito Sans", system-ui, sans-serif; font-size: 34px; font-weight: 700; position: relative; z-index: 1; overflow: hidden; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  h1 { font-family: "Nunito Sans", system-ui, sans-serif; font-size: 30px; letter-spacing: 0.2px; position: relative; z-index: 1; }
  .tagline { margin-top: 6px; font-size: 14px; letter-spacing: 2.5px; text-transform: uppercase; opacity: 0.78; position: relative; z-index: 1; }
  .count { display: inline-block; margin-top: 14px; font-size: 13px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 999px; position: relative; z-index: 1; }
  .catalog-tools { max-width: 1160px; margin: -44px auto 18px; padding: 16px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; position: relative; z-index: 3; background: #fffdfb; border: 1px solid rgba(140,90,69,.16); border-radius: 18px; }
  .catalog-tools label { display: grid; gap: 6px; font-size: 12px; font-weight: 800; color: #7d6354; }
  .catalog-tools input, .catalog-tools select { width: 100%; min-height: 44px; border: 1px solid #dfd0c8; border-radius: 12px; background: #fff; color: #3d2b22; padding: 0 12px; font: inherit; }
  main { max-width: 1160px; margin: 0 auto; padding: 0 16px 16px; position: relative; z-index: 2; display: grid; gap: 28px; }
  .catalog-section { display: grid; gap: 16px; }
  .catalog-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .card { background: #fffdfb; border-radius: 20px; overflow: hidden; border: 1px solid rgba(140, 90, 69, 0.16); display: flex; flex-direction: column; transition: transform 0.15s ease; }
  .card:target { scroll-margin-top: 16px; outline: 3px solid ${palette.light}; outline-offset: 3px; }
  .card:hover { transform: translateY(-2px); }
  .section-heading { margin-bottom: 2px; }
  .section-heading h2 { font-size: 26px; color: #4a3228; font-weight: 800; }
  .section-heading > p:last-child { margin-top: 4px; color: #7d6354; font-size: 15px; line-height: 1.45; }
  .option-group { margin-top: 14px; }
  .option-label { color: #4a3228; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
  .option-group .variants { margin-top: 8px; }
  .service-meta { margin-top: 12px; }
  .booking-instructions { margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: ${palette.bg}; color: #7d6354; font-size: 13px; line-height: 1.45; }
  .request-service, .booking-submit { width: 100%; min-height: 48px; margin-top: 12px; border: 0; border-radius: 999px; background: ${palette.base}; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
  .request-service:active, .booking-submit:active { transform: scale(0.98); }
  .photo img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .gallery { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .gallery::-webkit-scrollbar { display: none; }
  .gallery img { flex: 0 0 100%; scroll-snap-align: center; }
  .placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3e6dd, #e9d5c8); }
  .service-placeholder { background: linear-gradient(135deg, ${palette.bg}, ${palette.light}55); }
  .placeholder span { font-family: "Nunito Sans", system-ui, sans-serif; font-size: 64px; color: #b08368; }
  .service-placeholder span { color: ${palette.dark}; opacity: 0.72; }
  .info { padding: 18px 18px 20px; display: flex; flex-direction: column; flex: 1; }
  .info h2 { font-family: "Nunito Sans", system-ui, sans-serif; font-size: 20px; font-weight: 700; color: #4a3228; }
  .category { color: ${palette.base}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 5px; }
  .desc { margin-top: 6px; font-size: 14px; line-height: 1.5; color: #7d6354; }
  .variants { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .variant { border: 1px solid ${palette.light}; color: ${palette.dark}; background: ${palette.bg}; border-radius: 999px; padding: 5px 9px; font-size: 12px; font-weight: 650; }
  .variant.sold-out { opacity: 0.55; text-decoration: line-through; }
  .bottom { margin-top: auto; padding-top: 14px; }
  .price { font-size: 24px; font-weight: 800; color: #2e7d32; letter-spacing: -0.3px; }
  .price .unit, .price .from { font-size: 14px; font-weight: 600; color: #6da471; }
  .price .from { display: block; margin-bottom: 2px; }
  .price.consultation { font-size: 18px; color: #7d6354; }
  .order { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; background: transparent; color: ${palette.base}; border: 1px solid ${palette.base}; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 19px; border-radius: 999px; }
  .order:active { transform: scale(0.98); }
  .order svg { width: 18px; height: 18px; }
  .add-cart { width: 100%; border: 0; margin-top: 12px; background: ${palette.base}; color: #fff; font: inherit; font-weight: 750; padding: 13px 16px; border-radius: 999px; cursor: pointer; }
  .add-cart:disabled { opacity: .5; cursor: default; }
  .variation-select, #cart-form input, #cart-form select, #cart-form textarea { width: 100%; margin-top: 8px; border: 1px solid #d8c7bc; border-radius: 10px; padding: 10px; background: #fff; font: inherit; }
  .cart-toggle { position: fixed; right: 18px; bottom: 18px; z-index: 20; border: 0; border-radius: 999px; padding: 14px 20px; background: ${palette.dark}; color: #fff; font-weight: 800; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
  #cart-dialog, #service-booking-dialog { border: 0; border-radius: 18px; padding: 0; width: min(92vw, 480px); color: #3d2b22; }
  #cart-dialog::backdrop, #service-booking-dialog::backdrop { background: rgba(0,0,0,.45); }
  #cart-form { padding: 24px; display: grid; gap: 14px; }
  #cart-form label { font-size: 13px; font-weight: 700; }
  .cart-close { justify-self: end; border: 0; background: transparent; font-size: 28px; }
  .reserve-submit { border: 0; border-radius: 999px; padding: 13px; background: ${palette.base}; color: #fff; font-weight: 800; }
  #service-booking-form { padding: 24px; display: grid; gap: 14px; }
  #service-booking-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
  #service-booking-form input, #service-booking-form select, #service-booking-form textarea { width: 100%; min-height: 44px; border: 1px solid #d8c7bc; border-radius: 10px; padding: 10px; background: #fff; font: inherit; }
  #service-booking-form textarea { min-height: 88px; resize: vertical; }
  .booking-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .booking-close { justify-self: end; border: 0; background: transparent; font-size: 28px; cursor: pointer; }
  #booking-message { min-height: 20px; color: ${palette.dark}; font-size: 13px; line-height: 1.4; }
  .order.hero { margin-top: 18px; background: #fff; color: ${palette.dark}; box-shadow: 0 8px 22px rgba(0,0,0,0.18); position: relative; z-index: 1; }
  .empty { grid-column: 1 / -1; text-align: center; padding: 56px 20px; background: #fffdfb; border-radius: 20px; box-shadow: 0 10px 30px rgba(61, 43, 34, 0.1); }
  .empty-icon { margin-bottom: 12px; }
  .empty-icon svg { display: inline-block; }
  .empty p { font-size: 16px; font-weight: 600; color: #4a3228; }
  .empty .empty-sub { margin-top: 6px; font-size: 14px; font-weight: 400; color: #9b8275; }
  .more-note { grid-column: 1 / -1; text-align: center; font-size: 13px; color: #9b8275; padding: 4px 0 8px; }
  footer { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 32px 16px 44px; font-size: 13px; color: #9b8275; text-align: center; }
  footer .footer-brand { display: flex; align-items: center; gap: 10px; }
  footer img { width: 30px; height: 30px; border-radius: 9px; background: #fffdfb; padding: 3px; box-shadow: 0 2px 6px rgba(61,43,34,0.15); }
  footer strong { color: ${palette.base}; }
  footer a.footer-link { color: ${palette.base}; text-decoration: none; }
  footer .footer-cta { font-size: 13px; }
  footer .footer-cta a { color: ${palette.base}; background: transparent; border: 1px solid ${palette.base}; text-decoration: none; font-weight: 700; padding: 7px 15px; border-radius: 999px; display: inline-block; margin-top: 2px; }
  @media (max-width: 720px) {
    .catalog-tools { margin: -44px 16px 18px; grid-template-columns: 1fr 1fr; }
    .catalog-tools .search { grid-column: 1 / -1; }
    .catalog-grid { grid-template-columns: 1fr; }
    .booking-row { grid-template-columns: 1fr; }
    .photo img, .placeholder { height: 220px; }
  }
</style>
</head>
<body>
${promoStrip}
<div class="hero-bg">
  ${patternOverlay}
  ${avatar}
  <h1>${escapeHtml(catalog.businessName)}</h1>
  <p class="tagline">${escapeHtml(heroTagline)}</p>
  ${tagline}
  ${totalCount > 0 ? `<span class="count">${countLabel}</span>` : ""}
  ${headerButton}
</div>
${filters}
<main>
${productsSection}
${servicesSection}
</main>
${cart}
${bookingDialog}
<footer>
  <div class="footer-brand"><span>Feito com carinho no <a class="footer-link" href="${catalogPlayStoreUrl(catalog.brandId)}"><strong>${escapeHtml(brand.appName)}</strong></a></span></div>
  <div class="footer-cta"><a href="${catalogPlayStoreUrl(catalog.brandId)}">Crie sua vitrine grátis</a></div>
</footer>
${catalogScript}
${cartScript}
${bookingScript}
</body>
</html>`;
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
button{min-height:48px;border:1px solid #b45b6d;border-radius:999px;background:#fff;color:#a94e61;padding:0 22px;font:800 15px "Nunito Sans",sans-serif;cursor:pointer}
</style>
</head>
<body><main><div class="mark" aria-hidden="true">!</div><h1>Não foi possível abrir o catálogo</h1><p>Verifique sua conexão e tente carregar novamente.</p><button type="button" onclick="location.reload()">Tentar novamente</button></main></body>
</html>`;
}
