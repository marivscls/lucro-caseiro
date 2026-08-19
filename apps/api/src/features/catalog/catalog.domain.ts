import type {
  PublicCatalog,
  PublicCatalogProduct,
  PublicCatalogService,
} from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";
import { resolveBrand } from "@lucro-caseiro/brands";
import {
  displayCatalogName,
  renderPublishedStorefrontHtml,
} from "./storefront-renderer";

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

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function productUnitLabel(saleUnit: string): string {
  return saleUnit === "kg" ? "/kg" : "";
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

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function whatsappLink(phone: string, productName?: string, priceLabel?: string): string {
  const number = whatsappNumber(phone);
  const priceSuffix = priceLabel ? ` — ${priceLabel}` : "";
  const message = productName
    ? `Olá! 😊 Vi seu catálogo e adorei. Gostaria de encomendar: *${productName}${priceSuffix}* 🛍️`
    : "Olá! 😊 Vi seu catálogo e gostaria de fazer um pedido. 🛍️";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const WHATSAPP_ICON = `<svg class="whatsapp-icon" viewBox="0 0 24 24" width="24" height="24" preserveAspectRatio="xMidYMid meet" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;
const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>`;
const CUPCAKE_ICON = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 29c-5-8 3-15 10-12 2-9 16-8 17 2 8-1 11 10 4 14H19c-1-1-1-2-1-4Z"/><path d="M20 33h28l-4 22H24l-4-22Z"/><path d="m28 36 2 16m7-16-2 16"/><path d="M32 13c0-4 3-7 7-8"/></svg>`;

function productCard(
  product: PublicCatalogProduct,
  whatsapp: string | null,
  retailOrdering: boolean,
  index: number,
): string {
  const allPhotos = [product.photoUrl, ...product.extraPhotos].filter(
    (url): url is string => !!url,
  );
  const img = (url: string) => {
    const priority =
      index < 2 ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"';
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(displayCatalogName(product.name))}" width="640" height="480"${priority}>`;
  };
  let photo: string;
  if (allPhotos.length === 0) {
    photo = `<div class="placeholder"><span>${escapeHtml(displayCatalogName(product.name).charAt(0).toUpperCase())}</span></div>`;
  } else if (allPhotos.length === 1) {
    photo = img(allPhotos[0]!);
  } else {
    // Tira de miniaturas: carrossel horizontal com scroll-snap (CSS puro, sem JS).
    photo = `<div class="gallery">${allPhotos.map(img).join("")}</div>`;
  }
  const unit = productUnitLabel(product.saleUnit);
  const description = product.description
    ? `<p class="desc">${escapeHtml(product.description)}</p>`
    : "";
  const category = `<p class="category">${escapeHtml(product.category)}</p>`;
  const availableVariations = product.variations.filter((variation) => variation.inStock);
  const variationVisibility = retailOrdering ? "" : " hidden";
  const variationSelect = product.variations.length
    ? `<label class="variation-field"${variationVisibility}><span>Escolha uma opção</span><select class="variation-select" aria-label="Variação de ${escapeHtml(displayCatalogName(product.name))}"><option value="">Selecionar variação</option>${availableVariations
        .filter((variation) => variation.inStock)
        .map(
          (variation) =>
            `<option value="${escapeHtml(variation.id)}" data-variation-name="${escapeHtml(variation.name)}">${escapeHtml(variation.name)}</option>`,
        )
        .join("")}</select><span class="variation-error" role="alert"></span></label>`
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
  const canAdd =
    product.variations.length === 0 ||
    product.variations.some((variation) => variation.inStock);
  let orderButton = "";
  if (whatsapp && canAdd) {
    orderButton = `<a class="order product-order" href="${whatsappLink(whatsapp, displayCatalogName(product.name), priceLabel)}" aria-label="Pedir ${escapeHtml(displayCatalogName(product.name))} pelo WhatsApp" data-whatsapp="${whatsappNumber(whatsapp)}" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(displayCatalogName(product.name))}" data-price-label="${escapeHtml(priceLabel)}" data-unit-label="${product.saleUnit === "kg" ? "quilo" : "unidade"}">${WHATSAPP_ICON}<span>Pedir</span></a>`;
  } else if (!canAdd) {
    orderButton = `<p class="availability" role="status">Produto indisponível</p>`;
  }
  const cartLabel = canAdd ? "Adicionar à reserva" : "Produto esgotado";
  const cartDisabled = canAdd ? "" : " disabled";
  const cartButton = retailOrdering
    ? `<button class="add-cart" data-product-id="${escapeHtml(product.id)}" data-product-name="${escapeHtml(displayCatalogName(product.name))}" data-price="${product.salePrice}"${cartDisabled}>${cartLabel}</button>`
    : "";
  const searchableText = normalizeSearchText(
    [displayCatalogName(product.name), product.description ?? "", product.category].join(
      " ",
    ),
  );
  return `<article class="card catalog-item product-card" data-kind="product" data-category="${escapeHtml(product.category)}" data-name="${escapeHtml(normalizeSearchText(displayCatalogName(product.name)))}" data-search="${escapeHtml(searchableText)}" data-price="${product.salePrice}" id="produto-${escapeHtml(product.id)}"><div class="photo">${photo}</div><div class="info">${category}<h2>${escapeHtml(displayCatalogName(product.name))}</h2>${description}${variations}<div class="bottom"><p class="price">${formatPrice(product.salePrice)}<span class="unit">${unit}</span></p>${cartButton}${orderButton}</div></div></article>`;
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

  const searchableText = normalizeSearchText(
    [service.name, service.description ?? "", locationLabel, "serviço"].join(" "),
  );
  const sortablePrice = service.defaultPrice ?? Number.MAX_SAFE_INTEGER;
  return `<article class="card catalog-item service-card" data-kind="service" data-category="__services" data-name="${escapeHtml(normalizeSearchText(service.name))}" data-search="${escapeHtml(searchableText)}" data-price="${sortablePrice}" id="servico-${escapeHtml(service.id)}"><div class="info"><p class="category">Serviço</p><h2>${escapeHtml(service.name)}</h2>${description}${meta}${variations}${addOns}${packages}${bookingInstructions}<div class="bottom">${price}<button class="catalog-action request-service" type="button" data-service-id="${escapeHtml(service.id)}" data-service-name="${escapeHtml(service.name)}">Solicitar horário</button></div></div></article>`;
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
  rose: { dark: "#4A2332", base: "#B65F72", light: "#D58A9A", bg: "#F5E5E8" },
  green: { dark: "#2f5d3e", base: "#447a55", light: "#639672", bg: "#eff5f0" },
  lavender: { dark: "#5c4a8c", base: "#7a64b0", light: "#9883cc", bg: "#f4f1fa" },
  blue: { dark: "#2c5577", base: "#3f74a0", light: "#6494bd", bg: "#eef4f8" },
  amber: { dark: "#8c6420", base: "#b3852f", light: "#cda354", bg: "#faf5ea" },
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function colorChannels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const channels = colorChannels(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(first: string, second: string): number {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function contrastTextColor(background: string): "#FFFFFF" | "#24181E" {
  return contrastRatio(background, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#24181E";
}

function darkenForWhiteText(hex: string): string {
  let [r, g, b] = colorChannels(hex);
  let result = hex;
  while (contrastRatio(result, "#FFFFFF") < 4.5) {
    r = mixChannel(r, 0, 0.1);
    g = mixChannel(g, 0, 0.1);
    b = mixChannel(b, 0, 0.1);
    result = `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }
  return result;
}

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
  switch (accentColor) {
    case "rose":
      return CATALOG_ACCENT_PRESETS.rose ?? BROWN_PALETTE;
    case "green":
      return CATALOG_ACCENT_PRESETS.green ?? BROWN_PALETTE;
    case "lavender":
      return CATALOG_ACCENT_PRESETS.lavender ?? BROWN_PALETTE;
    case "blue":
      return CATALOG_ACCENT_PRESETS.blue ?? BROWN_PALETTE;
    case "amber":
      return CATALOG_ACCENT_PRESETS.amber ?? BROWN_PALETTE;
    default:
      return BROWN_PALETTE;
  }
}

export type CatalogSection = "all" | "products" | "services";

export function renderCatalogHtml(
  catalog: PublicCatalog,
  section: CatalogSection = "all",
  nonce = "",
  options: Readonly<{ preview?: boolean }> = {},
): string {
  if (catalog.customization) {
    return renderPublishedStorefrontHtml(
      catalog,
      section,
      nonce,
      options.preview === true,
    );
  }
  const scriptNonce = nonce ? ` nonce="${nonce}"` : "";
  const brand = resolveBrand(catalog.brandId);
  const palette =
    catalog.accentColor === null && catalog.brandId === "lucro-caseiro"
      ? (CATALOG_ACCENT_PRESETS.rose ?? BROWN_PALETTE)
      : resolvePalette(catalog.accentColor);
  const heroDark =
    catalog.accentColor === null && catalog.brandId === "lucro-caseiro"
      ? "#4A2332"
      : darkenForWhiteText(palette.dark);
  const accentText = contrastTextColor(palette.base);
  const retailOrdering = catalog.brandId === "lucro-papelaria";
  const allProducts = catalog.products;
  const allServices = catalog.services ?? [];
  let effectiveSection: Exclude<CatalogSection, "all">;
  if (section === "all") {
    effectiveSection =
      allProducts.length > 0 || allServices.length === 0 ? "products" : "services";
  } else {
    effectiveSection = section;
  }
  const coverUrl =
    effectiveSection === "services" ? catalog.serviceCoverUrl : catalog.coverUrl;
  const titleColor =
    (effectiveSection === "services" ? catalog.serviceTitleColor : catalog.titleColor) ??
    "#ffffff";
  const descriptionColor =
    (effectiveSection === "services"
      ? catalog.serviceDescriptionColor
      : catalog.descriptionColor) ?? "#ffffff";
  const taglineText =
    effectiveSection === "services" ? catalog.serviceTagline : catalog.tagline;
  const promoBanner =
    effectiveSection === "services" ? catalog.servicePromoBanner : catalog.promoBanner;
  const publicProducts = effectiveSection === "services" ? [] : allProducts;
  const cards = publicProducts
    .map((product, index) =>
      productCard(product, catalog.whatsapp, retailOrdering, index),
    )
    .join("");
  const publicServices = effectiveSection === "products" ? [] : allServices;
  const serviceCards = publicServices.map(serviceCard).join("");
  const categories = [...new Set(publicProducts.map((product) => product.category))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
  const count = publicProducts.length;
  const serviceCount = publicServices.length;
  const totalCount = count + serviceCount;
  const totalProductCount = catalog.totalProducts ?? allProducts.length;
  const totalServiceCount = allServices.length;
  const filterOptions = categories
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`,
    )
    .join("");
  const categoryChips = categories
    .map(
      (category) =>
        `<button type="button" class="category-chip" data-category-filter="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`,
    )
    .join("");
  const filterField =
    categories.length > 0
      ? `<div class="catalog-select-field filter-field" data-trigger-label="Filtrar" data-trigger-icon="filter"><span class="visually-hidden">Filtrar por categoria</span><select aria-label="Filtrar por categoria" class="catalog-select-native" id="catalog-category" hidden><option value="">Todos</option>${filterOptions}</select></div>`
      : "";
  const servicesChip =
    totalServiceCount > 0
      ? `<a class="category-chip service-category-chip" href="?tipo=servicos#catalog-content">Serviços</a>`
      : "";
  const categoryChipList =
    categoryChips || servicesChip
      ? `<div class="category-chips" role="group" aria-label="Categorias"><button type="button" class="category-chip selected" data-category-filter="" aria-pressed="true">Todos</button>${categoryChips}${servicesChip}</div>`
      : "";
  const filters =
    totalCount > 0
      ? `<section class="catalog-tools" aria-label="Busca e filtros do catálogo">
  <div class="search-row">
    <label class="search-control" for="catalog-search">${SEARCH_ICON}<span class="visually-hidden">Buscar no catálogo</span><input id="catalog-search" type="search" placeholder="O que você procura?" autocomplete="off"><button id="catalog-search-clear" class="search-clear" type="button" aria-label="Limpar busca" hidden>×</button></label>
    ${filterField}
  </div>
  ${categoryChipList}
</section>`
      : "";
  const initial = escapeHtml(catalog.businessName.charAt(0).toUpperCase() || "?");
  const countLabel = catalogItemCountLabel(totalProductCount, totalServiceCount);
  const visualCountLabel = countLabel.replace(" e ", " • ");
  const headerButton = catalog.whatsapp
    ? `<a class="order hero" href="${whatsappLink(catalog.whatsapp)}" aria-label="Falar no WhatsApp">${WHATSAPP_ICON}<span>Falar no WhatsApp</span></a>`
    : "";
  const heroBackground = `background: linear-gradient(135deg, ${heroDark} 0%, ${palette.dark} 48%, ${palette.base} 100%);`;
  const patternCss = catalog.pattern ? (HERO_PATTERNS[catalog.pattern] ?? "") : "";
  const patternOverlay = patternCss ? `<div class="pattern"></div>` : "";
  const coverFigure = coverUrl
    ? `<figure class="hero-cover"><img src="${escapeHtml(coverUrl)}" alt="Capa de ${escapeHtml(catalog.businessName)}" width="760" height="600" loading="eager" fetchpriority="high"></figure>`
    : "";
  const heroPhotoUrls =
    effectiveSection === "products"
      ? [
          ...new Set(
            allProducts
              .map((product) => product.photoUrl)
              .filter((url): url is string => Boolean(url)),
          ),
        ].slice(0, 3)
      : [];
  const heroShowcase =
    !coverUrl && heroPhotoUrls.length > 0
      ? `<figure class="hero-showcase hero-showcase-${heroPhotoUrls.length}" aria-hidden="true">${heroPhotoUrls
          .map(
            (url, index) =>
              `<img class="hero-showcase-item hero-showcase-item-${index + 1}" src="${escapeHtml(url)}" alt="" width="520" height="420" loading="eager"${index === 0 ? ' fetchpriority="high"' : ""}>`,
          )
          .join("")}</figure>`
      : "";
  const hasHeroVisual = Boolean(coverFigure || heroShowcase);
  let avatar = `<div class="avatar" aria-hidden="true">${initial}</div>`;
  if (catalog.brandId === "lucro-caseiro") {
    avatar = `<div class="avatar default-avatar" aria-hidden="true">${CUPCAKE_ICON}</div>`;
  }
  if (catalog.logoUrl) {
    avatar = `<div class="avatar"><img src="${escapeHtml(catalog.logoUrl)}" alt="Logo de ${escapeHtml(catalog.businessName)}" width="96" height="96" loading="eager"></div>`;
  }
  const tagline = taglineText
    ? `<p class="bio" style="color:${descriptionColor}">${escapeHtml(taglineText)}</p>`
    : "";
  const promoStrip = promoBanner
    ? `<div class="promo">${escapeHtml(promoBanner)}</div>`
    : "";
  const hiddenCount = effectiveSection === "services" ? 0 : catalog.totalProducts - count;
  const moreNote =
    hiddenCount > 0
      ? `<p class="more-note">Mostrando ${count} de ${catalog.totalProducts} produtos</p>`
      : "";
  const empty =
    totalCount === 0
      ? `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 120 120" width="104" height="104" aria-hidden="true"><defs><linearGradient id="ebg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7ece4"/><stop offset="1" stop-color="#f0ddd1"/></linearGradient><linearGradient id="ebd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a50"/><stop offset="1" stop-color="#7a4c39"/></linearGradient><linearGradient id="erm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86573f"/><stop offset="1" stop-color="#6e4534"/></linearGradient><linearGradient id="ep1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8B4BC"/><stop offset="1" stop-color="#C4707E"/></linearGradient><linearGradient id="ep2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fdcbd"/><stop offset="1" stop-color="#5da883"/></linearGradient><linearGradient id="ep3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecc78a"/><stop offset="1" stop-color="#c08c3f"/></linearGradient></defs><path d="M60 8 C92 6 112 28 110 60 C108 94 88 112 58 110 C26 108 8 90 10 58 C12 28 30 10 60 8 Z" fill="url(#ebg)"/><path d="M22 30 L24.5 36 L31 38 L24.5 40 L22 46 L19.5 40 L13 38 L19.5 36 Z" fill="#E8B4BC" opacity="0.9"/><path d="M100 78 L101.8 82.5 L106 84 L101.8 85.5 L100 90 L98.2 85.5 L94 84 L98.2 82.5 Z" fill="#D4A054" opacity="0.85"/><ellipse cx="60" cy="102" rx="34" ry="6" fill="#6e4534" opacity="0.14"/><path d="M36 56 Q60 22 84 56" stroke="#6e4534" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="44" cy="50" r="14" fill="url(#ep1)"/><ellipse cx="40" cy="45" rx="5" ry="3" fill="#fff" opacity="0.5"/><circle cx="66" cy="45" r="12.5" fill="url(#ep2)"/><ellipse cx="62.5" cy="40.5" rx="4.5" ry="2.6" fill="#fff" opacity="0.5"/><circle cx="82" cy="54" r="10" fill="url(#ep3)"/><ellipse cx="79" cy="50.5" rx="3.6" ry="2.2" fill="#fff" opacity="0.55"/><path d="M24 58 L96 58 L89 95 Q87.8 101.5 81.5 101.5 L38.5 101.5 Q32.2 101.5 31 95 Z" fill="url(#ebd)"/><path d="M27.5 76 L92.5 76 L91 83 L29 83 Z" fill="#6e4534" opacity="0.35"/><line x1="42" y1="60" x2="45" y2="100" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><line x1="60" y1="60" x2="60" y2="101" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><line x1="78" y1="60" x2="75" y2="100" stroke="#5e3a2b" stroke-width="3.5" opacity="0.45"/><rect x="22" y="55" width="76" height="10" rx="5" fill="url(#erm)"/><rect x="26" y="57" width="68" height="3" rx="1.5" fill="#a06a50" opacity="0.7"/></svg></div><p>Nada disponível no momento.</p><p class="empty-sub">Volte em breve — novidades chegando!</p></div>`
      : "";
  const productsHeading =
    count > 0 ? `<h2 class="visually-hidden" id="products-title">Produtos</h2>` : "";
  const servicesHeading =
    serviceCount > 0
      ? `<h2 class="visually-hidden" id="services-title">Serviços</h2>`
      : "";
  const servicesSection =
    serviceCount > 0
      ? `<section class="catalog-section services-section" aria-labelledby="services-title">${servicesHeading}<div class="catalog-grid" id="catalog-services">${serviceCards}</div></section>`
      : "";
  const productsAriaLabel = count > 0 ? ' aria-labelledby="products-title"' : "";
  const productsSection =
    count > 0 || totalCount === 0
      ? `<section class="catalog-section products-section"${productsAriaLabel}>${productsHeading}<div class="catalog-grid" id="catalog-products">${cards}${moreNote}${empty}</div></section>`
      : "";
  const heroTagline = catalogHeroTagline(totalProductCount, totalServiceCount);
  const listingDescription =
    effectiveSection === "services"
      ? "Envie sua solicitação e combine o melhor horário."
      : "Faça seu pedido diretamente pelo WhatsApp.";
  const listingHeader =
    totalCount > 0
      ? `<header class="listing-header"><div><h2>Escolha o que deseja</h2><p>${listingDescription}</p></div><div class="catalog-select-field sort-field" data-trigger-label="Ordenar" data-trigger-icon="sort"><span class="visually-hidden">Ordenar catálogo</span><select aria-label="Ordenar catálogo" class="catalog-select-native" id="catalog-sort" hidden><option value="name">Nome</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></div></header><div class="results-status" id="catalog-results-status" role="status" aria-live="polite"></div><div class="no-results" id="catalog-no-results" hidden><h3>Nenhum resultado encontrado</h3><p>Não encontramos itens para <strong id="catalog-no-results-term"></strong>.</p><div><button id="catalog-clear-search" type="button">Limpar busca</button><button id="catalog-clear-filters" type="button">Remover filtros</button></div></div>`
      : "";
  const activeProductsClass = effectiveSection === "products" ? " active" : "";
  const activeServicesClass = effectiveSection === "services" ? " active" : "";
  const productsCurrent = effectiveSection === "products" ? ' aria-current="page"' : "";
  const servicesCurrent = effectiveSection === "services" ? ' aria-current="page"' : "";
  const sectionNav =
    totalProductCount > 0 && totalServiceCount > 0
      ? `<nav class="catalog-section-nav" aria-label="Seções do catálogo"><a class="${activeProductsClass.trim()}" href="?tipo=produtos#catalog-content"${productsCurrent}>Produtos <span>${totalProductCount}</span></a><a class="${activeServicesClass.trim()}" href="?tipo=servicos#catalog-content"${servicesCurrent}>Serviços <span>${totalServiceCount}</span></a></nav>`
      : "";
  const floatingWhatsapp =
    catalog.whatsapp && totalCount > 0 && !retailOrdering
      ? `<a class="floating-whatsapp" href="${whatsappLink(catalog.whatsapp)}" aria-label="Falar no WhatsApp">${WHATSAPP_ICON}</a>`
      : "";
  const shareImageUrl = coverUrl ?? catalog.logoUrl;
  const shareImageMeta = shareImageUrl
    ? `<meta property="og:image" content="${escapeHtml(shareImageUrl)}">`
    : "";
  const bookingDialog =
    serviceCount > 0
      ? `<dialog id="service-booking-dialog">
  <form id="service-booking-form">
    <header class="booking-header">
      <div class="booking-heading"><p class="category">Solicitar horário</p><h2 id="booking-service-name" tabindex="-1"></h2></div>
      <button type="button" class="booking-close" aria-label="Fechar"><span aria-hidden="true">×</span></button>
    </header>
    <div class="booking-content">
      <input id="booking-service-id" type="hidden">
      <label>Seu nome<input id="booking-name" required maxlength="120" autocomplete="name"></label>
      <label>WhatsApp<input id="booking-phone" required minlength="8" maxlength="20" inputmode="tel" autocomplete="tel"></label>
      <div class="booking-row"><label>Data desejada<span class="booking-date-control"><input id="booking-date" type="text" inputmode="numeric" maxlength="10" pattern="(?:0[1-9]|[12]\\d|3[01])/(?:0[1-9]|1[0-2])/\\d{4}" placeholder="DD/MM/AAAA" required><button id="booking-date-open" type="button" aria-label="Escolher data no calendário"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2.5"></rect><path d="M8 3.5v4M16 3.5v4M3.5 10h17"></path></svg></button></span></label><label>Horário desejado<span class="booking-time-control"><input id="booking-time" type="text" inputmode="numeric" maxlength="5" pattern="(?:[01]\\d|2[0-3]):[0-5]\\d" placeholder="Ex: 14:30" title="Informe um horário entre 00:00 e 23:59"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg></span></label></div>
      <label>Onde prefere ser atendida(o)?<select id="booking-location" required><option value="business">No espaço profissional</option><option value="client">No meu endereço</option><option value="online">Online</option></select></label>
      <label>Observações<textarea id="booking-notes" maxlength="500" placeholder="Conte um pouco do que precisa"></textarea></label>
    </div>
    <footer class="booking-footer">
      <p id="booking-message" role="status" aria-live="polite"></p>
      <button class="booking-submit" type="submit">Enviar solicitação</button>
    </footer>
  </form>
</dialog>
<dialog id="booking-calendar-dialog" aria-labelledby="booking-calendar-title" tabindex="-1">
  <div class="booking-calendar-panel">
    <div class="booking-calendar-header">
      <button id="booking-calendar-prev" class="booking-calendar-nav" type="button" aria-label="Mês anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button>
      <button id="booking-calendar-title" class="booking-calendar-title" type="button" aria-label="Escolher mês ou ano" aria-expanded="false"><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg></button>
      <button id="booking-calendar-next" class="booking-calendar-nav" type="button" aria-label="Próximo mês"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg></button>
    </div>
    <div id="booking-calendar-weekdays" class="booking-calendar-weekdays" aria-hidden="true"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
    <div id="booking-calendar-days" class="booking-calendar-days" role="grid" aria-label="Dias do mês"></div>
    <div id="booking-calendar-years" class="booking-calendar-years" role="grid" aria-label="Anos" hidden></div>
    <button id="booking-calendar-close" class="booking-calendar-close" type="button">Fechar</button>
  </div>
</dialog>`
      : "";
  const cart = retailOrdering
    ? `<button id="cart-toggle" class="cart-toggle" hidden>Reserva · <span id="cart-count">0</span> itens</button>
<dialog id="cart-dialog"><form id="cart-form"><button type="button" class="cart-close" aria-label="Fechar">×</button><h2>Reservar produtos</h2><div id="cart-items"></div><label>Seu nome<input id="customer-name" required maxlength="120"></label><label>WhatsApp<input id="customer-phone" required minlength="8" maxlength="20" inputmode="tel"></label><label>Recebimento<select id="fulfillment"><option value="pickup">Retirar na loja</option><option value="delivery">Entrega</option></select></label><label>Observações<textarea id="order-notes" maxlength="500"></textarea></label><button class="reserve-submit" type="submit">Confirmar reserva</button><p id="cart-message" role="status"></p></form></dialog>`
    : "";
  const cartScript = retailOrdering
    ? `<script${scriptNonce}>
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
    if (select && !select.value) {
      const error = card.querySelector(".variation-error");
      if (error) error.textContent = "Escolha uma variação antes de adicionar.";
      select.focus();
      return;
    }
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
      ? `<script${scriptNonce}>
(() => {
  const dialog = document.getElementById("service-booking-dialog");
  const form = document.getElementById("service-booking-form");
  const message = document.getElementById("booking-message");
  const serviceName = document.getElementById("booking-service-name");
  const bookingContent = dialog.querySelector(".booking-content");
  const dateInput = document.getElementById("booking-date");
  const timeInput = document.getElementById("booking-time");
  const calendarDialog = document.getElementById("booking-calendar-dialog");
  const calendarTitle = document.getElementById("booking-calendar-title");
  const calendarTitleText = calendarTitle.querySelector("span");
  const calendarWeekdays = document.getElementById("booking-calendar-weekdays");
  const calendarDays = document.getElementById("booking-calendar-days");
  const calendarYears = document.getElementById("booking-calendar-years");
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const pad2 = (value) => String(value).padStart(2, "0");
  const isoOf = (date) => date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  const brOf = (date) => pad2(date.getDate()) + "/" + pad2(date.getMonth() + 1) + "/" + date.getFullYear();
  const dateFromIso = (iso) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const isoFromBr = (value) => {
    const [day, month, year] = value.split("/").map(Number);
    if (!day || !month || !year) return "";
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? isoOf(date) : "";
  };
  const todayIso = isoOf(new Date());
  let viewMonth = dateFromIso(todayIso);
  let pickingYear = false;
  const maskDate = (value) => {
    const digits = value.replace(/\\D/g, "").slice(0, 8);
    if (digits.length > 4) return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };
  const maskTime = (value) => {
    const digits = value.replace(/\\D/g, "").slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + ":" + digits.slice(2) : digits;
  };
  const syncDateValue = () => {
    const iso = isoFromBr(dateInput.value);
    dateInput.dataset.iso = iso && iso >= todayIso ? iso : "";
    if (dateInput.value && !iso) dateInput.setCustomValidity("Informe uma data válida em DD/MM/AAAA.");
    else if (iso && iso < todayIso) dateInput.setCustomValidity("Escolha hoje ou uma data futura.");
    else dateInput.setCustomValidity("");
  };
  dateInput.addEventListener("input", () => {
    dateInput.value = maskDate(dateInput.value);
    syncDateValue();
  });
  timeInput.addEventListener("input", () => {
    timeInput.value = maskTime(timeInput.value);
  });
  const renderCalendar = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const yearWindowStart = year - (year % 12);
    calendarTitle.setAttribute("aria-expanded", String(pickingYear));
    calendarWeekdays.hidden = pickingYear;
    calendarDays.hidden = pickingYear;
    calendarYears.hidden = !pickingYear;
    if (pickingYear) {
      calendarTitleText.textContent = yearWindowStart + " – " + (yearWindowStart + 11);
      calendarYears.replaceChildren(...Array.from({ length: 12 }, (_, index) => {
        const optionYear = yearWindowStart + index;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "booking-calendar-year" + (optionYear === year ? " selected" : "");
        button.textContent = String(optionYear);
        button.setAttribute("aria-label", String(optionYear));
        button.addEventListener("click", () => {
          viewMonth = new Date(optionYear, month, 1);
          pickingYear = false;
          renderCalendar();
        });
        return button;
      }));
      return;
    }
    calendarTitleText.textContent = months[month] + " " + year;
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());
    calendarDays.replaceChildren(...Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = isoOf(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "booking-calendar-day" + (date.getMonth() === month ? "" : " outside") + (dateInput.dataset.iso === iso ? " selected" : "") + (todayIso === iso ? " today" : "");
      button.textContent = String(date.getDate());
      button.setAttribute("aria-label", brOf(date));
      button.setAttribute("role", "gridcell");
      button.disabled = iso < todayIso;
      button.addEventListener("click", () => {
        dateInput.value = brOf(date);
        dateInput.dataset.iso = iso;
        dateInput.setCustomValidity("");
        calendarDialog.close();
        dateInput.focus({ preventScroll: true });
      });
      return button;
    }));
  };
  const openCalendar = () => {
    viewMonth = dateInput.dataset.iso ? dateFromIso(dateInput.dataset.iso) : dateFromIso(todayIso);
    pickingYear = false;
    renderCalendar();
    calendarDialog.showModal();
    requestAnimationFrame(() => calendarDialog.focus({ preventScroll: true }));
  };
  document.getElementById("booking-date-open").addEventListener("click", openCalendar);
  calendarTitle.addEventListener("click", () => {
    pickingYear = !pickingYear;
    renderCalendar();
  });
  document.getElementById("booking-calendar-prev").addEventListener("click", () => {
    viewMonth = pickingYear ? new Date(viewMonth.getFullYear() - 12, viewMonth.getMonth(), 1) : new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById("booking-calendar-next").addEventListener("click", () => {
    viewMonth = pickingYear ? new Date(viewMonth.getFullYear() + 12, viewMonth.getMonth(), 1) : new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  document.getElementById("booking-calendar-close").addEventListener("click", () => calendarDialog.close());
  calendarDialog.addEventListener("click", (event) => {
    if (event.target === calendarDialog) calendarDialog.close();
  });
  document.querySelectorAll(".request-service").forEach((button) => button.addEventListener("click", () => {
    form.reset();
    dateInput.dataset.iso = "";
    dateInput.setCustomValidity("");
    document.getElementById("booking-service-id").value = button.dataset.serviceId;
    serviceName.textContent = button.dataset.serviceName;
    message.textContent = "";
    dialog.scrollTop = 0;
    bookingContent.scrollTop = 0;
    dialog.showModal();
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      bookingContent.scrollTop = 0;
      serviceName.focus({ preventScroll: true });
    });
  }));
  document.querySelector(".booking-close").addEventListener("click", () => dialog.close());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Enviando solicitação…";
    syncDateValue();
    if (!dateInput.reportValidity()) return;
    const preferredDate = dateInput.dataset.iso;
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
    dateInput.dataset.iso = "";
    message.textContent = "Solicitação enviada! O negócio entrará em contato para confirmar.";
  });
})();
</script>`
      : "";
  const catalogScript =
    totalCount > 0
      ? `<script${scriptNonce}>
(() => {
  const root = document.getElementById("catalog-content");
  const search = document.getElementById("catalog-search");
  const category = document.getElementById("catalog-category");
  const sort = document.getElementById("catalog-sort");
  const clearSearch = document.getElementById("catalog-search-clear");
  const noResults = document.getElementById("catalog-no-results");
  const noResultsTerm = document.getElementById("catalog-no-results-term");
  const resultsStatus = document.getElementById("catalog-results-status");
  const cards = [...root.querySelectorAll(".catalog-item")];
  const normalize = (value) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const syncChips = () => {
    document.querySelectorAll("[data-category-filter]").forEach((chip) => {
      const selected = (category?.value || "") === chip.dataset.categoryFilter;
      chip.classList.toggle("selected", selected);
      chip.setAttribute("aria-pressed", String(selected));
    });
  };
  const update = () => {
    const query = normalize(search.value.trim());
    const selectedCategory = category?.value || "";
    let visibleCount = 0;
    cards.forEach((card) => {
      const matchesSearch = !query || card.dataset.search.includes(query);
      const matchesCategory = !selectedCategory || card.dataset.category === selectedCategory;
      const visible = matchesSearch && matchesCategory;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    root.querySelectorAll(".catalog-grid").forEach((grid) => {
      const ordered = [...grid.querySelectorAll(".catalog-item")].sort((a, b) => {
        if (sort.value === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
        if (sort.value === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
        return a.dataset.name.localeCompare(b.dataset.name, "pt-BR");
      });
      const anchor = grid.querySelector(".more-note");
      ordered.forEach((card) => grid.insertBefore(card, anchor));
    });
    clearSearch.hidden = search.value.length === 0;
    noResults.hidden = visibleCount > 0;
    noResultsTerm.textContent = query ? '"' + search.value.trim() + '"' : "os filtros selecionados";
    const hasActiveFilter = Boolean(query || selectedCategory);
    resultsStatus.textContent = hasActiveFilter ? visibleCount + (visibleCount === 1 ? " resultado" : " resultados") : "";
    syncChips();
  };
  let searchTimer;
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(update, 140);
  });
  clearSearch.addEventListener("click", () => { search.value = ""; update(); search.focus(); });
  category?.addEventListener("change", update);
  sort.addEventListener("change", update);
  document.querySelectorAll("[data-category-filter]").forEach((chip) => chip.addEventListener("click", () => {
    if (!category) return;
    category.value = chip.dataset.categoryFilter;
    category.dispatchEvent(new Event("change", { bubbles: true }));
  }));
  document.getElementById("catalog-clear-search")?.addEventListener("click", () => { search.value = ""; update(); search.focus(); });
  document.getElementById("catalog-clear-filters")?.addEventListener("click", () => { if (category) category.value = ""; update(); });

  const enhanceSelect = (select) => {
    const field = select.closest(".catalog-select-field");
    const fieldLabel = field.dataset.triggerLabel || select.getAttribute("aria-label") || "Selecionar";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "catalog-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", fieldLabel);
    const triggerIcon = document.createElement("span");
    triggerIcon.className = "catalog-select-trigger-icon";
    triggerIcon.setAttribute("aria-hidden", "true");
    triggerIcon.textContent = "☷";
    const triggerText = document.createElement("span");
    triggerText.className = "catalog-select-trigger-text";
    trigger.append(triggerIcon, triggerText);

    const dialog = document.createElement("div");
    dialog.className = "catalog-select-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", fieldLabel);
    const panel = document.createElement("div");
    panel.className = "catalog-select-panel";
    const header = document.createElement("div");
    header.className = "catalog-select-header";
    const title = document.createElement("h2");
    title.textContent = fieldLabel;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "catalog-select-close";
    close.setAttribute("aria-label", "Fechar");
    close.textContent = "×";
    const options = document.createElement("div");
    options.className = "catalog-select-options";
    options.setAttribute("role", "listbox");
    header.append(title, close);
    panel.append(header, options);
    dialog.append(panel);

    const syncTrigger = () => {
      const selectedText = select.selectedOptions[0]?.textContent || fieldLabel;
      const filterActive = field.classList.contains("filter-field") && Boolean(select.value);
      triggerText.textContent = filterActive ? selectedText : fieldLabel;
      trigger.classList.toggle("active", filterActive);
      trigger.title = filterActive ? "Filtro: " + selectedText : fieldLabel;
    };
    const renderOptions = () => {
      options.replaceChildren(...[...select.options].map((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "catalog-select-option" + (option.selected ? " selected" : "");
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(option.selected));
        button.textContent = option.textContent;
        button.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          syncTrigger();
          closeDialog();
        });
        return button;
      }));
    };

    const closeDialog = () => {
      dialog.hidden = true;
      document.body.classList.remove("catalog-select-open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus({ preventScroll: true });
    };
    trigger.addEventListener("click", () => {
      renderOptions();
      trigger.setAttribute("aria-expanded", "true");
      dialog.hidden = false;
      document.body.classList.add("catalog-select-open");
      requestAnimationFrame(() => options.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true }));
    });
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDialog();
    });

    field.append(trigger);
    document.body.append(dialog);
    syncTrigger();
  };
  [category, sort].filter(Boolean).forEach(enhanceSelect);
  document.querySelectorAll(".product-order").forEach((link) => link.addEventListener("click", (event) => {
    const card = link.closest(".product-card");
    const variation = card.querySelector(".variation-select");
    const error = card.querySelector(".variation-error");
    if (variation && !variation.closest("[hidden]") && !variation.value) {
      event.preventDefault();
      error.textContent = "Escolha uma variação antes de pedir.";
      variation.focus();
      return;
    }
    if (error) error.textContent = "";
    const variationName = variation?.selectedOptions?.[0]?.dataset.variationName;
    const itemUrl = new URL(location.origin + location.pathname);
    itemUrl.searchParams.set("produto", link.dataset.productId);
    itemUrl.hash = "produto-" + link.dataset.productId;
    const parts = [
      "Olá! Vi seu catálogo e gostaria de pedir:",
      "*" + link.dataset.productName + "*",
      variationName ? "Variação: " + variationName : "",
      "Valor: " + link.dataset.priceLabel,
      "Unidade: " + link.dataset.unitLabel,
      "Link: " + itemUrl.toString(),
    ].filter(Boolean);
    link.href = "https://wa.me/" + link.dataset.whatsapp + "?text=" + encodeURIComponent(parts.join("\\n"));
  }));
  document.querySelectorAll(".variation-select").forEach((select) => select.addEventListener("change", () => {
    const error = select.closest(".variation-field")?.querySelector(".variation-error");
    if (error) error.textContent = "";
  }));
  const floatingWhatsapp = document.querySelector(".floating-whatsapp");
  if (floatingWhatsapp) {
    const blockers = [...document.querySelectorAll(".catalog-tools, .catalog-section-nav, .listing-header, .variation-field, .catalog-item .bottom, .order, .request-service, .add-cart, .cart-toggle")];
    let floatingFrame;
    const syncFloatingWhatsapp = () => {
      cancelAnimationFrame(floatingFrame);
      floatingFrame = requestAnimationFrame(() => {
        const floatingBox = floatingWhatsapp.getBoundingClientRect();
        const overlapsAction = blockers.some((blocker) => {
          const box = blocker.getBoundingClientRect();
          return box.bottom > floatingBox.top && box.top < floatingBox.bottom && box.right > floatingBox.left && box.left < floatingBox.right;
        });
        floatingWhatsapp.classList.toggle("obscured", overlapsAction);
      });
    };
    addEventListener("scroll", syncFloatingWhatsapp, { passive: true });
    addEventListener("resize", syncFloatingWhatsapp, { passive: true });
    syncFloatingWhatsapp();
  }
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
${shareImageMeta}
<title>${escapeHtml(catalog.businessName)} — Catálogo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Nunito Sans", system-ui, sans-serif; background: ${palette.bg}; color: #3d2b22; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
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
  .catalog-tools label, .catalog-tools .catalog-select-field { min-width: 0; display: grid; gap: 6px; font-size: 12px; font-weight: 800; color: #7d6354; }
  .catalog-tools input, .catalog-tools select { width: 100%; min-width: 0; min-height: 44px; border: 1px solid #dfd0c8; border-radius: 12px; background: #fff; color: #3d2b22; padding: 0 12px; font: inherit; }
  .catalog-select-native { display: none; }
  .catalog-select-trigger { width: 100%; min-width: 0; min-height: 44px; border: 1px solid #dfd0c8; border-radius: 12px; background: #fff; color: #3d2b22; padding: 0 38px 0 12px; font: inherit; font-weight: 700; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; position: relative; cursor: pointer; }
  .catalog-select-trigger::after { content: "⌄"; position: absolute; right: 13px; top: 50%; color: ${palette.base}; font-size: 21px; transform: translateY(-58%); }
  .catalog-select-trigger:focus-visible { border-color: ${palette.base}; box-shadow: 0 0 0 3px ${palette.light}55; outline: 0; }
  .catalog-select-open { overflow: hidden; }
  .catalog-select-dialog { position: fixed; inset: 0; z-index: 100; padding: 16px; display: flex; align-items: center; justify-content: center; background: rgba(61,43,34,.5); color: #3d2b22; }
  .catalog-select-dialog[hidden] { display: none; }
  .catalog-select-panel { width: min(92vw, 460px); max-height: min(76dvh, 620px); border-radius: 24px; background: #fffdfb; overflow: hidden; display: flex; flex-direction: column; }
  .catalog-select-header { flex: none; min-height: 64px; padding: 10px 12px 10px 20px; border-bottom: 1px solid #eaded7; display: flex; align-items: center; gap: 12px; }
  .catalog-select-header h2 { flex: 1; min-width: 0; font-size: 21px; font-weight: 800; }
  .catalog-select-close { width: 44px; height: 44px; border: 0; border-radius: 50%; background: transparent; color: #7d6354; font: 400 30px/1 "Nunito Sans", system-ui, sans-serif; cursor: pointer; }
  .catalog-select-options { min-height: 0; padding: 10px; display: grid; gap: 4px; overflow-y: auto; overscroll-behavior: contain; }
  .catalog-select-option { width: 100%; min-height: 52px; padding: 0 14px; border: 1px solid transparent; border-radius: 14px; background: transparent; color: #3d2b22; font: 700 16px "Nunito Sans", system-ui, sans-serif; text-align: left; cursor: pointer; }
  .catalog-select-option.selected { border-color: ${palette.light}; background: ${palette.bg}; color: ${palette.dark}; }
  .catalog-select-option:focus-visible { border-color: ${palette.base}; box-shadow: 0 0 0 2px ${palette.light}55; outline: 0; }
  main { min-width: 0; max-width: 1160px; margin: 0 auto; padding: 0 16px 16px; position: relative; z-index: 2; display: grid; gap: 28px; }
  main.services-only { padding-top: 28px; }
  .catalog-section { min-width: 0; display: grid; gap: 16px; }
  .catalog-grid { min-width: 0; display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
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
  .catalog-section-nav { max-width: 1160px; margin: 0 auto 20px; padding: 0 16px; display: flex; gap: 10px; }
  .catalog-section-nav a { flex: 1; min-width: 0; min-height: 48px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid ${palette.light}; border-radius: 14px; background: #fffdfb; color: ${palette.dark}; text-decoration: none; font-weight: 800; }
  .catalog-section-nav span { min-width: 24px; padding: 2px 7px; border-radius: 999px; background: ${palette.bg}; font-size: 12px; text-align: center; }
  .booking-instructions { margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: ${palette.bg}; color: #7d6354; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
  .request-service, .booking-submit { width: 100%; min-height: 48px; margin-top: 12px; border: 0; border-radius: 999px; background: ${palette.base}; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
  .request-service:active, .booking-submit:active { transform: scale(0.98); }
  .photo img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .gallery { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .gallery::-webkit-scrollbar { display: none; }
  .gallery img { flex: 0 0 100%; scroll-snap-align: center; }
  .placeholder { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3e6dd, #e9d5c8); }
  .placeholder span { font-family: "Nunito Sans", system-ui, sans-serif; font-size: 64px; color: #b08368; }
  .info { min-width: 0; padding: 18px 18px 20px; display: flex; flex-direction: column; flex: 1; }
  .info h2 { font-family: "Nunito Sans", system-ui, sans-serif; font-size: 20px; font-weight: 700; color: #4a3228; }
  .category { color: ${palette.base}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 5px; }
  .desc { margin-top: 6px; font-size: 14px; line-height: 1.5; color: #7d6354; }
  .variants { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .variant { max-width: 100%; border: 1px solid ${palette.light}; color: ${palette.dark}; background: ${palette.bg}; border-radius: 999px; padding: 5px 9px; font-size: 12px; font-weight: 650; overflow-wrap: anywhere; }
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
  #cart-dialog, #service-booking-dialog, #booking-calendar-dialog { border: 0; border-radius: 18px; padding: 0; color: #3d2b22; }
  #cart-dialog, #service-booking-dialog { width: min(92vw, 480px); }
  #cart-dialog::backdrop, #service-booking-dialog::backdrop, #booking-calendar-dialog::backdrop { background: rgba(0,0,0,.45); }
  #cart-form { padding: 24px; display: grid; gap: 14px; }
  #cart-form label { font-size: 13px; font-weight: 700; }
  .cart-close { justify-self: end; border: 0; background: transparent; font-size: 28px; }
  .reserve-submit { border: 0; border-radius: 999px; padding: 13px; background: ${palette.base}; color: #fff; font-weight: 800; }
  #service-booking-dialog { inset: 0; width: min(94vw, 560px); max-height: calc(100dvh - 32px); margin: auto; background: #fffdfb; overflow: hidden; }
  #service-booking-form { display: flex; flex-direction: column; max-height: calc(100dvh - 32px); }
  .booking-header { flex: none; position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 18px 24px; border-bottom: 1px solid #eaded7; background: #fffdfb; }
  .booking-heading { flex: 1; min-width: 0; }
  .booking-heading .category { margin-bottom: 2px; }
  .booking-heading h2 { overflow: hidden; font-size: 24px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
  .booking-heading h2:focus { outline: 0; }
  .booking-content { min-height: 0; padding: 20px 24px; display: grid; gap: 16px; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
  #service-booking-form label { display: grid; min-width: 0; gap: 8px; font-size: 14px; font-weight: 700; }
  #service-booking-form input, #service-booking-form select, #service-booking-form textarea { width: 100%; min-width: 0; min-height: 48px; border: 1px solid #d8c7bc; border-radius: 16px; padding: 0 14px; background: #fff; color: #3d2b22; font: inherit; }
  #service-booking-form input:focus, #service-booking-form select:focus, #service-booking-form textarea:focus { border-color: ${palette.base}; box-shadow: 0 0 0 3px ${palette.light}55; outline: 0; }
  #service-booking-form textarea { min-height: 96px; padding-block: 12px; resize: vertical; }
  .booking-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
  .booking-date-control, .booking-time-control { position: relative; display: block; }
  #service-booking-form .booking-date-control input, #service-booking-form .booking-time-control input { padding-right: 48px; }
  .booking-date-control > button { position: absolute; top: 0; right: 0; width: 48px; height: 48px; border: 0; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: ${palette.base}; cursor: pointer; }
  .booking-date-control svg, .booking-time-control svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .booking-time-control > svg { position: absolute; top: 50%; right: 15px; transform: translateY(-50%); color: #7d6354; pointer-events: none; }
  #booking-calendar-dialog { inset: 0; width: min(92vw, 520px); max-width: 520px; margin: auto; border-radius: 24px; background: #fffdfb; overflow: hidden; }
  #booking-calendar-dialog:focus { outline: 0; }
  .booking-calendar-panel { padding: 24px; }
  .booking-calendar-header { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 4px; margin-bottom: 12px; }
  .booking-calendar-nav, .booking-calendar-title { min-height: 44px; border: 0; background: transparent; color: ${palette.base}; cursor: pointer; }
  .booking-calendar-nav:focus, .booking-calendar-title:focus, .booking-calendar-close:focus { outline: 0; }
  .booking-calendar-nav:focus-visible, .booking-calendar-title:focus-visible, .booking-calendar-close:focus-visible { box-shadow: 0 0 0 3px ${palette.light}; }
  .booking-calendar-nav { display: inline-flex; align-items: center; justify-content: center; }
  .booking-calendar-nav svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .booking-calendar-title { min-width: 0; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #3d2b22; font: inherit; font-size: 19px; font-weight: 800; }
  .booking-calendar-title span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .booking-calendar-title svg { flex: none; width: 18px; height: 18px; fill: none; stroke: #7d6354; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform .15s ease; }
  .booking-calendar-title[aria-expanded="true"] svg { transform: rotate(180deg); }
  .booking-calendar-weekdays, .booking-calendar-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .booking-calendar-weekdays[hidden], .booking-calendar-days[hidden] { display: none; }
  .booking-calendar-weekdays { margin-bottom: 4px; color: ${palette.base}; font-size: 12px; font-weight: 800; text-align: center; }
  .booking-calendar-weekdays span { padding: 4px 0; }
  .booking-calendar-day { width: 38px; height: 38px; margin: 2px auto; border: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #3d2b22; font: inherit; font-weight: 700; cursor: pointer; }
  .booking-calendar-day.outside { color: #9b8275; opacity: .55; }
  .booking-calendar-day.today:not(.selected) { border: 1.5px solid ${palette.base}; }
  .booking-calendar-day.selected { background: ${palette.base}; color: #fff; }
  .booking-calendar-day:disabled { opacity: .25; cursor: default; }
  .booking-calendar-years { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .booking-calendar-years:not([hidden]) { display: grid; }
  .booking-calendar-year { min-height: 48px; border: 1px solid #eaded7; border-radius: 12px; background: ${palette.bg}; color: #3d2b22; font: inherit; font-weight: 700; cursor: pointer; }
  .booking-calendar-year.selected { border-color: ${palette.base}; background: ${palette.base}; color: #fff; }
  .booking-calendar-close { width: 100%; min-height: 44px; margin-top: 16px; border: 0; border-radius: 12px; background: ${palette.bg}; color: #3d2b22; font: inherit; font-weight: 800; cursor: pointer; }
  .booking-close { flex: none; width: 44px; height: 44px; border: 0; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #7d6354; font: inherit; font-size: 28px; line-height: 1; cursor: pointer; }
  .booking-close:active { background: ${palette.bg}; }
  .booking-close:focus { outline: 0; }
  .booking-close:focus-visible { box-shadow: 0 0 0 3px ${palette.light}; }
  .booking-footer { flex: none; position: sticky; bottom: 0; z-index: 2; padding: 16px 24px; display: grid; grid-template-columns: minmax(0, 1fr); align-items: stretch; justify-content: stretch; gap: 10px; border-top: 1px solid #eaded7; background: #fffdfb; }
  .booking-submit { margin-top: 0; border-radius: 12px; }
  #booking-message { color: ${palette.dark}; font-size: 13px; line-height: 1.4; }
  #booking-message:empty { display: none; }
  .order.hero { width: fit-content; max-width: 100%; margin: 18px auto 0; display: flex; justify-content: center; background: #fff; color: ${palette.dark}; box-shadow: 0 8px 22px rgba(0,0,0,0.18); position: relative; z-index: 1; }
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
    .catalog-tools { margin: -44px 16px 18px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .catalog-tools .search { grid-column: 1 / -1; }
    .catalog-section-nav { padding: 0 16px; }
    .catalog-section-nav a { font-size: 14px; }
    .catalog-grid { grid-template-columns: 1fr; }
    .catalog-select-dialog { padding: max(12px, env(safe-area-inset-top)) 0 0; align-items: flex-end; }
    .catalog-select-panel { width: 100%; max-height: calc(100dvh - max(12px, env(safe-area-inset-top))); border-radius: 24px 24px 0 0; padding-bottom: max(10px, env(safe-area-inset-bottom)); }
    #service-booking-dialog { inset: auto 0 0; width: 100%; max-width: none; max-height: calc(100dvh - max(12px, env(safe-area-inset-top))); margin: auto 0 0; border-radius: 24px 24px 0 0; }
    #service-booking-form { max-height: calc(100dvh - max(12px, env(safe-area-inset-top))); }
    .booking-header { padding: 14px 20px; }
    .booking-content { padding: 18px 20px; }
    .booking-footer { padding: 14px 20px max(14px, env(safe-area-inset-bottom)); }
    .photo img, .placeholder { height: 220px; }
  }
  @media (max-width: 360px) {
    .booking-row { grid-template-columns: 1fr; }
  }

  /* Vitrine pública: composição comercial inspirada na identidade configurada. */
  :root { --catalog-accent: ${palette.base}; --catalog-dark: ${heroDark}; --catalog-soft: ${palette.bg}; --catalog-accent-text: ${accentText}; --ink: #24181e; --muted: #6d6266; --paper: #faf8f6; }
  body { background: var(--paper); color: var(--ink); padding-bottom: env(safe-area-inset-bottom); }
  .visually-hidden { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important; }
  .promo { min-height: 42px; padding: calc(10px + env(safe-area-inset-top)) 18px 10px; display: grid; place-items: center; background: var(--catalog-dark); color: #fff; font-size: clamp(13px, 2.5vw, 15px); line-height: 1.35; }
  .hero-bg { ${heroBackground} min-height: 410px; padding: calc(48px + env(safe-area-inset-top)) 20px 88px; border-radius: 0 0 34px 34px; color: #fff; text-align: left; isolation: isolate; }
  .promo + .hero-bg { padding-top: 48px; }
  .hero-bg::before { z-index: -1; top: -42%; right: 35%; width: 760px; height: 520px; border: 2px solid ${palette.light}66; border-radius: 50%; background: transparent; transform: rotate(-16deg); }
  .hero-bg::after { z-index: -1; inset: 0; width: auto; height: auto; border-radius: 0; background: linear-gradient(90deg, rgba(15,6,10,.18), transparent 70%); }
  .pattern { z-index: -1; opacity: .32; }
  .hero-shell { width: min(100%, 1160px); min-height: 360px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, .9fr) minmax(320px, 1.1fr); align-items: center; gap: clamp(20px, 4vw, 54px); position: relative; z-index: 1; }
  .hero-shell.no-visual { grid-template-columns: minmax(0, 680px); justify-content: center; text-align: center; }
  .hero-shell.no-visual .hero-identity { align-items: center; }
  .hero-shell.no-visual .order.hero { margin-inline: auto; }
  .hero-copy { min-width: 0; }
  .hero-identity { display: flex; align-items: flex-start; flex-direction: column; gap: 18px; }
  .avatar { flex: none; width: 88px; height: 88px; margin: 0; border: 4px solid rgba(255,255,255,.82); background: #fffaf8; color: var(--catalog-dark); box-shadow: 0 10px 26px rgba(20,8,12,.22); font-size: 36px; }
  .default-avatar { display: grid; place-items: center; }
  .default-avatar svg { width: 54px; height: 54px; color: var(--catalog-accent); }
  .hero-title { min-width: 0; }
  h1 { font-size: clamp(34px, 5vw, 52px); line-height: 1.02; letter-spacing: -.035em; text-wrap: balance; }
  .tagline { margin-top: 10px; font-size: 13px; line-height: 1.3; letter-spacing: .2em; font-weight: 800; opacity: .72; }
  .bio { max-width: 560px; margin: 22px 0 0; font-size: clamp(16px, 2vw, 19px); line-height: 1.55; opacity: .94; }
  .count { margin-top: 18px; padding: 8px 15px; border-color: rgba(255,255,255,.22); background: rgba(255,255,255,.12); font-size: 14px; font-weight: 700; backdrop-filter: blur(8px); }
  .order.hero { min-height: 50px; margin: 20px 0 0; padding: 0 21px; background: #fff; color: var(--catalog-dark); border-color: #fff; box-shadow: 0 12px 28px rgba(19,7,11,.2); }
  .hero-cover { width: 100%; aspect-ratio: 1.2; margin: 0; border: 8px solid rgba(255,255,255,.14); border-radius: 34% 18% 30% 16%; overflow: hidden; background: rgba(255,255,255,.1); box-shadow: 0 24px 45px rgba(18,6,11,.3); transform: rotate(1.5deg); }
  .hero-cover img { width: 100%; height: 100%; display: block; object-fit: cover; }
  .hero-showcase { width: min(100%, 570px); min-height: 390px; margin: 0; position: relative; filter: drop-shadow(0 24px 24px rgba(18,6,11,.28)); }
  .hero-showcase::before { content: ""; position: absolute; inset: 10% 5% 3% 10%; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.2), transparent 67%); }
  .hero-showcase-item { position: absolute; display: block; object-fit: cover; border: 5px solid rgba(255,255,255,.2); background: var(--catalog-soft); box-shadow: 0 16px 32px rgba(19,7,11,.3); }
  .hero-showcase-item-1 { z-index: 3; top: 0; right: 3%; width: 50%; height: 52%; border-radius: 48% 48% 24% 24%; }
  .hero-showcase-item-2 { z-index: 2; left: 1%; bottom: 2%; width: 59%; height: 48%; border-radius: 50% 30% 28% 42%; transform: rotate(-2deg); }
  .hero-showcase-item-3 { z-index: 4; right: -2%; bottom: -3%; width: 54%; height: 45%; border-radius: 48% 48% 28% 28%; transform: rotate(1.5deg); }
  .hero-showcase-1 .hero-showcase-item-1 { inset: 4% 2% 0 auto; width: 88%; height: 90%; border-radius: 42% 20% 34% 18%; }
  .hero-showcase-2 .hero-showcase-item-1 { width: 58%; height: 58%; }
  .hero-showcase-2 .hero-showcase-item-2 { left: 4%; width: 66%; height: 54%; }

  .catalog-tools { width: min(calc(100% - 32px), 1160px); margin: -48px auto 20px; padding: 18px; display: block; border: 1px solid rgba(182,95,114,.18); border-radius: 24px; background: #fff; box-shadow: 0 16px 34px rgba(74,35,50,.12); }
  .search-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; }
  .catalog-tools .search-control { min-height: 52px; padding: 0 12px 0 16px; display: flex; align-items: center; gap: 11px; border: 1px solid #eadde0; border-radius: 16px; background: #fff; color: #a2989c; }
  .search-control > svg { flex: none; width: 23px; height: 23px; }
  .catalog-tools .search-control input { min-height: 50px; padding: 0; border: 0; border-radius: 0; outline: 0; color: var(--ink); font-size: 16px; }
  .search-control:focus-within { border-color: var(--catalog-accent); box-shadow: 0 0 0 3px ${palette.light}44; }
  .search-clear { flex: none; width: 44px; height: 44px; border: 0; border-radius: 50%; background: transparent; color: var(--muted); font: 600 25px/1 "Nunito Sans", sans-serif; cursor: pointer; }
  .catalog-tools .catalog-select-field { display: block; }
  .catalog-select-trigger { min-height: 52px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border-color: #eadde0; border-radius: 16px; color: var(--catalog-dark); font-weight: 800; text-align: center; }
  .catalog-select-trigger::after { content: none; }
  .filter-field .catalog-select-trigger { min-width: 108px; padding-inline: 12px; }
  .catalog-select-trigger.active { border-color: var(--catalog-accent); background: var(--catalog-soft); }
  .catalog-select-trigger-icon { flex: none; width: 22px; font-size: 21px; line-height: 1; text-align: center; }
  .catalog-select-trigger-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .category-chips { margin-top: 15px; display: flex; gap: 10px; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: none; scroll-snap-type: x proximity; }
  .category-chips::-webkit-scrollbar { display: none; }
  .category-chip { flex: 0 0 auto; min-height: 44px; padding: 0 20px; border: 1px solid ${palette.light}; border-radius: 999px; background: #fff; color: var(--catalog-dark); font: 800 14px "Nunito Sans", sans-serif; cursor: pointer; scroll-snap-align: start; }
  .category-chip.selected { border-color: var(--catalog-dark); background: var(--catalog-dark); color: #fff; }

  .catalog-section-nav { width: min(calc(100% - 32px), 1160px); margin: 28px auto; padding: 0; gap: 8px; border-radius: 17px; }
  .catalog-section-nav a { min-height: 56px; border-color: ${palette.light}; border-radius: 16px; color: var(--catalog-dark); font-size: 16px; }
  .catalog-section-nav a.active { border-color: var(--catalog-dark); background: var(--catalog-dark); color: #fff; box-shadow: 0 9px 22px rgba(74,35,50,.18); }
  .catalog-section-nav span { background: ${palette.light}33; color: inherit; }
  .catalog-section-nav a.active span { background: rgba(255,255,255,.16); }
  main, main.services-only { max-width: 1160px; padding: 4px 16px 34px; gap: 18px; }
  .listing-header { display: flex; align-items: end; justify-content: space-between; gap: 18px; }
  .listing-header h2 { color: var(--ink); font-size: clamp(25px, 3vw, 32px); line-height: 1.12; font-weight: 800; letter-spacing: -.025em; }
  .listing-header p { margin-top: 5px; color: var(--muted); font-size: 15px; line-height: 1.4; }
  .sort-field { flex: none; }
  .sort-field .catalog-select-trigger { min-height: 44px; padding-inline: 10px; border-color: transparent; background: transparent; }
  .results-status { min-height: 0; color: var(--muted); font-size: 13px; }
  .results-status:empty { display: none; }
  .catalog-section { gap: 0; }
  .catalog-grid { gap: 14px; grid-template-columns: minmax(0, 1fr); align-items: stretch; }
  .card { min-width: 0; border-color: rgba(182,95,114,.16); border-radius: 20px; background: #fff; box-shadow: 0 8px 22px rgba(74,35,50,.08); }
  .card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(74,35,50,.12); }
  .photo { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: var(--catalog-soft); }
  .photo img, .placeholder { width: 100%; height: 100%; object-fit: cover; }
  .photo .gallery { width: 100%; height: 100%; }
  .info { padding: 16px; }
  .info h2 { color: var(--ink); font-size: 19px; line-height: 1.24; font-weight: 800; display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .category { margin-bottom: 6px; color: var(--catalog-accent); font-size: 11px; letter-spacing: .11em; }
  .desc { color: var(--muted); line-height: 1.45; display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .product-card .variants .variant:nth-child(n+4) { display: none; }
  .variant { border-color: ${palette.light}; background: #fff; color: var(--catalog-dark); }
  .variation-field { margin-top: 12px; display: grid; gap: 6px; color: var(--muted); font-size: 12px; font-weight: 800; }
  .variation-field[hidden] { display: none !important; }
  .variation-select { min-height: 44px; margin: 0; border-radius: 13px; color: var(--ink); }
  .variation-error { min-height: 0; color: #a13f54; font-size: 12px; font-weight: 700; }
  .variation-error:empty { display: none; }
  .bottom { padding-top: 15px; }
  .price { color: var(--catalog-accent); font-size: 25px; }
  .price .unit, .price .from { color: var(--catalog-dark); }
  .order { width: 100%; min-height: 46px; padding: 0 14px; justify-content: center; border-color: var(--catalog-accent); color: var(--catalog-accent); }
  .availability { min-height: 44px; margin-top: 12px; display: grid; place-items: center; border-radius: 999px; background: #f2edef; color: var(--muted); font-size: 13px; font-weight: 800; }
  .request-service, .booking-submit, .add-cart, .reserve-submit { min-height: 48px; background: var(--catalog-accent); color: var(--catalog-accent-text); }
  .service-card .info { padding: 20px; }
  .service-card .info h2 { font-size: 21px; }
  .no-results { padding: 34px 20px; border: 1px dashed ${palette.light}; border-radius: 20px; background: #fff; text-align: center; }
  .no-results h3 { font-size: 21px; }
  .no-results p { margin-top: 7px; color: var(--muted); }
  .no-results > div { margin-top: 18px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .no-results button { min-height: 44px; padding: 0 16px; border: 1px solid var(--catalog-accent); border-radius: 999px; background: #fff; color: var(--catalog-dark); font: 800 14px "Nunito Sans", sans-serif; cursor: pointer; }
  .floating-whatsapp { position: fixed; right: max(16px, env(safe-area-inset-right)); bottom: max(18px, calc(env(safe-area-inset-bottom) + 14px)); z-index: 25; width: 58px; height: 58px; display: grid; place-items: center; border: 4px solid #fff; border-radius: 50%; background: var(--catalog-accent); color: var(--catalog-accent-text); box-shadow: 0 12px 28px rgba(36,24,30,.24); transition: opacity .15s ease, transform .15s ease; }
  .floating-whatsapp svg { width: 29px; height: 29px; }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid ${palette.light}; outline-offset: 3px; }
  footer { padding-bottom: max(52px, calc(env(safe-area-inset-bottom) + 34px)); }
  footer .footer-brand a, footer .footer-cta a { min-height: 44px; display: inline-flex; align-items: center; }
  .floating-whatsapp.obscured { opacity: 0; pointer-events: none; transform: translateY(10px); }

  @media (min-width: 360px) {
    .products-section .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .product-card .info { padding: 13px; }
    .product-card .info h2 { font-size: 17px; }
    .product-card .price { font-size: 21px; }
    .product-card .variant { padding: 4px 7px; font-size: 11px; }
  }
  @media (min-width: 680px) {
    .services-section .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .product-card .info { padding: 18px; }
    .product-card .info h2 { font-size: 20px; }
    .product-card .price { font-size: 25px; }
  }
  @media (min-width: 1040px) {
    .products-section .catalog-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
  }
  @media (max-width: 720px) {
    .hero-bg { min-height: 520px; padding: calc(38px + env(safe-area-inset-top)) 18px 88px; }
    .promo + .hero-bg { padding-top: 38px; }
    .hero-shell { min-height: 390px; grid-template-columns: minmax(0, 1.03fr) minmax(150px, .97fr); gap: 8px; }
    .hero-identity { align-items: flex-start; flex-direction: column; gap: 14px; }
    .avatar { width: 74px; height: 74px; }
    h1 { font-size: clamp(30px, 8vw, 39px); }
    .tagline { font-size: 11px; letter-spacing: .16em; }
    .bio { margin-top: 16px; font-size: 15px; }
    .count { margin-top: 14px; font-size: 12px; }
    .order.hero { min-height: 48px; margin-top: 16px; }
    .hero-cover { aspect-ratio: .82; border-width: 5px; border-radius: 38% 16% 34% 18%; }
    .hero-showcase { min-height: 340px; margin-right: -54px; }
    .hero-showcase-item { border-width: 3px; }
    .catalog-tools { margin-top: -48px; }
    .catalog-section-nav { margin-block: 24px; }
    .catalog-section-nav a { font-size: 14px; }
  }
  @media (max-width: 359px) {
    .hero-bg { padding-inline: 16px; }
    .hero-shell { grid-template-columns: 1fr; text-align: center; }
    .hero-identity { align-items: center; }
    .hero-cover { width: min(100%, 250px); max-height: 190px; margin: 0 auto; aspect-ratio: 1.35; }
    .hero-showcase { width: min(100%, 280px); min-height: 220px; margin: 0 auto; }
    .order.hero { margin-inline: auto; }
    .catalog-tools { width: calc(100% - 24px); padding: 13px; }
    .search-row { grid-template-columns: minmax(0, 1fr); }
    .filter-field .catalog-select-trigger { width: 100%; }
    .listing-header { align-items: flex-start; flex-direction: column; }
    .sort-field { align-self: flex-end; }
    .booking-row { grid-template-columns: 1fr; }
  }
  @media (min-width: 360px) and (max-width: 430px) {
    .catalog-tools .search-control { padding-inline: 12px 8px; gap: 8px; }
    .catalog-tools .search-control input { font-size: 14px; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
  }

  /* Contrato visual da vitrine pública — referência 862 × 1800. */
  :root {
    --wine: #4A2332;
    --pink: #B65F72;
    --lime: #DCE86A;
    --off-white: #FAF8F6;
    --soft-pink: #F5E5E8;
    --surface: #FFFFFF;
    --ink: #24181E;
    --warm-gray: #6D6266;
  }
  html { overflow-x: hidden; background: var(--off-white); }
  body { min-width: 0; overflow-x: hidden; background: var(--off-white); color: var(--ink); }
  .promo {
    min-height: 58px;
    padding: 0 20px;
    display: grid;
    place-items: center;
    border-bottom: 1px solid rgba(182,95,114,.58);
    background: var(--wine);
    color: #fff;
    font-size: 19px;
    line-height: 1.2;
    font-weight: 800;
    text-align: center;
  }
  .public-catalog-hero,
  .hero-bg {
    position: relative;
    min-height: 624px;
    height: 624px;
    padding: 0;
    overflow: hidden;
    isolation: isolate;
    border-radius: 0 0 18px 18px;
    background: radial-gradient(circle at 58% 34%, #5A1B31 0, var(--wine) 56%, #351521 100%);
    color: #fff;
    text-align: left;
  }
  .promo + .hero-bg { padding-top: 0; }
  .hero-bg::before,
  .hero-bg::after {
    content: "";
    position: absolute;
    z-index: 0;
    pointer-events: none;
    background: transparent;
  }
  .hero-bg::before {
    top: -210px;
    left: -200px;
    width: 480px;
    height: 470px;
    border: 2px solid rgba(182,95,114,.62);
    border-radius: 46%;
    transform: rotate(30deg);
  }
  .hero-bg::after {
    top: 72px;
    left: 166px;
    width: 760px;
    height: 430px;
    border: 2px solid rgba(182,95,114,.48);
    border-radius: 50%;
    transform: rotate(-12deg);
  }
  .pattern { z-index: 0; opacity: .16; }
  .hero-shell,
  .hero-shell.no-visual {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: none;
    min-height: 624px;
    height: 624px;
    margin: 0;
    display: block;
    text-align: left;
  }
  .hero-copy {
    position: absolute;
    z-index: 4;
    top: 50px;
    left: 48px;
    width: 410px;
    min-width: 0;
  }
  .hero-identity,
  .hero-shell.no-visual .hero-identity {
    display: block;
    text-align: left;
  }
  .avatar {
    width: 138px;
    height: 138px;
    margin: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 5px solid rgba(255,255,255,.28);
    border-radius: 50%;
    background: var(--off-white);
    color: var(--wine);
    box-shadow: 0 12px 28px rgba(25,7,14,.24);
    font-size: 45px;
    font-weight: 800;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .default-avatar svg { width: 72px; height: 72px; color: var(--pink); }
  .hero-title { margin-top: 21px; }
  h1,
  .hero-title h1 {
    margin: 0;
    max-width: 410px;
    color: #fff;
    font-size: 44px;
    line-height: 1.08;
    font-weight: 800;
    letter-spacing: -.035em;
    text-wrap: nowrap;
  }
  .tagline {
    margin-top: 17px;
    color: #D77B8E;
    font-size: 19px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: .18em;
    text-transform: uppercase;
    opacity: 1;
  }
  .bio {
    max-width: 390px;
    margin: 25px 0 0;
    color: #fff;
    font-size: 22px;
    line-height: 1.58;
    font-weight: 500;
    opacity: 1;
  }
  .count {
    min-width: 246px;
    min-height: 48px;
    margin-top: 22px;
    margin-left: -5px;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(100deg, rgba(182,95,114,.72), rgba(182,95,114,.94));
    color: #fff;
    font-size: 17px;
    line-height: 1;
    font-weight: 600;
    backdrop-filter: none;
  }
  .order.hero,
  .hero-shell.no-visual .order.hero {
    width: max-content;
    min-width: 294px;
    min-height: 60px;
    margin: 26px 0 0 -5px;
    padding: 0 22px;
    display: inline-flex;
    justify-content: center;
    gap: 13px;
    border: 0;
    border-radius: 999px;
    background: #fff;
    color: var(--wine);
    box-shadow: 0 12px 28px rgba(24,7,13,.18);
    font-size: 19px;
    font-weight: 800;
  }
  .order.hero svg { width: 27px; height: 27px; }
  .public-catalog-cover,
  .hero-cover {
    position: absolute;
    z-index: 2;
    right: 0;
    bottom: 0;
    width: 57.66%;
    height: auto;
    margin: 0;
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    transform: none;
    pointer-events: none;
  }
  .hero-cover img {
    width: 100%;
    height: auto;
    height: 624px;
    max-height: 624px;
    display: block;
    object-fit: fill;
    object-position: right bottom;
  }
  .hero-showcase {
    position: absolute;
    z-index: 2;
    right: -16px;
    bottom: -4px;
    width: 57%;
    height: 590px;
    min-height: 0;
    margin: 0;
    filter: drop-shadow(0 22px 24px rgba(20,5,12,.28));
    pointer-events: none;
  }
  .hero-showcase::before { display: none; }
  .hero-showcase-item {
    position: absolute;
    display: block;
    border: 0;
    background: transparent;
    box-shadow: none;
    object-fit: cover;
  }
  .hero-showcase-item-1 { z-index: 2; top: 28px; right: 8px; width: 48%; height: 250px; border-radius: 48% 48% 28% 28%; transform: none; }
  .hero-showcase-item-2 { z-index: 3; left: 0; bottom: 74px; width: 62%; height: 280px; border-radius: 50% 38% 42% 44%; transform: rotate(-3deg); }
  .hero-showcase-item-3 { z-index: 4; right: -6px; bottom: -8px; width: 62%; height: 296px; border-radius: 50% 50% 18% 18%; transform: none; }
  .hero-showcase-1 .hero-showcase-item-1 { inset: auto 0 0 auto; width: 100%; height: 90%; border-radius: 0; object-fit: contain; }
  .hero-showcase-2 .hero-showcase-item-1 { width: 57%; height: 50%; }
  .hero-showcase-2 .hero-showcase-item-2 { left: 1%; width: 69%; height: 58%; }

  .catalog-tools {
    position: relative;
    z-index: 6;
    width: calc(100% - 40px);
    max-width: none;
    min-height: 204px;
    margin: -46px 20px 0;
    height: 204px;
    padding: 26px 26px 20px;
    display: block;
    overflow: hidden;
    border: 1px solid rgba(74,35,50,.08);
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 15px 30px rgba(74,35,50,.11);
  }
  .search-row { display: grid; grid-template-columns: minmax(0, 1fr) 158px; gap: 16px; }
  .catalog-tools .search-control {
    min-height: 70px;
    padding: 0 20px;
    gap: 16px;
    border: 1px solid #E5D8DB;
    border-radius: 18px;
    background: #fff;
    color: #B1A8AB;
  }
  .search-control > svg { width: 31px; height: 31px; stroke-width: 1.8; }
  .catalog-tools .search-control input {
    min-width: 0;
    min-height: 68px;
    font-size: 20px;
    font-weight: 500;
  }
  .catalog-tools .search-control input::placeholder { color: #B8B0B3; opacity: 1; }
  .catalog-select-trigger {
    min-height: 70px;
    border: 1px solid #E5D8DB;
    border-radius: 18px;
    background: #fff;
    color: var(--pink);
    font-size: 18px;
    font-weight: 800;
  }
  .filter-field .catalog-select-trigger { width: 158px; min-width: 158px; padding: 0 20px; }
  .catalog-select-trigger-icon {
    width: 29px;
    height: 29px;
    flex: none;
    overflow: hidden;
    background: center / 27px 27px no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B65F72' stroke-width='1.8' stroke-linecap='round'%3E%3Cpath d='M4 7h6m4 0h6M4 12h10m4 0h2M4 17h3m4 0h9'/%3E%3Ccircle cx='12' cy='7' r='2'/%3E%3Ccircle cx='16' cy='12' r='2'/%3E%3Ccircle cx='9' cy='17' r='2'/%3E%3C/svg%3E");
    color: transparent;
    font-size: 0;
  }
  .category-chips {
    width: 100%;
    margin-top: 25px;
    padding: 0 1px 2px;
    display: flex;
    gap: 20px;
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-padding-inline: 1px;
    scroll-snap-type: x mandatory;
  }
  .category-chip {
    min-width: 0;
    min-height: 58px;
    padding: 0 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    border: 1px solid var(--pink);
    border-radius: 20px;
    background: #fff;
    color: var(--wine);
    font-size: 18px;
    font-weight: 800;
    text-decoration: none;
    scroll-snap-align: start;
  }
  .category-chip.selected { border-color: var(--wine); background: var(--wine); color: #fff; }
  .catalog-section-nav {
    width: calc(100% - 68px);
    max-width: none;
    min-height: 64px;
    margin: 35px 34px 27px;
    gap: 8px;
  }
  .catalog-section-nav a {
    min-height: 64px;
    border: 1px solid var(--pink);
    border-radius: 17px;
    background: #fff;
    color: var(--wine);
    font-size: 20px;
    font-weight: 800;
  }
  .catalog-section-nav a.active {
    border-color: transparent;
    background: linear-gradient(100deg, var(--wine), var(--pink));
    color: #fff;
    box-shadow: none;
  }
  .catalog-section-nav span { min-width: 32px; padding: 3px 9px; border-radius: 999px; background: var(--soft-pink); color: var(--pink); }
  .catalog-section-nav a.active span { background: rgba(255,255,255,.17); color: #fff; }
  main,
  main.services-only {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0 34px 70px;
    display: grid;
    gap: 26px;
  }
  .listing-header {
    min-height: 68px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }
  .listing-header h2 { color: var(--wine); font-size: 29px; line-height: 1.1; font-weight: 800; letter-spacing: -.025em; }
  .listing-header p { margin-top: 8px; color: var(--warm-gray); font-size: 17px; line-height: 1.35; }
  .sort-field .catalog-select-trigger {
    min-width: 136px;
    min-height: 52px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: var(--wine);
    font-size: 17px;
  }
  .results-status {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0 0 0 0) !important;
    white-space: nowrap !important;
  }
  .catalog-section { min-width: 0; gap: 0; }
  .catalog-grid,
  .products-section .catalog-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    align-items: stretch;
  }
  .card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid rgba(182,95,114,.15);
    border-radius: 19px;
    background: #fff;
    box-shadow: 0 8px 22px rgba(74,35,50,.08);
  }
  .card:hover { transform: none; box-shadow: 0 8px 22px rgba(74,35,50,.08); }
  .photo { width: 100%; height: 228px; aspect-ratio: auto; overflow: hidden; background: var(--soft-pink); }
  .photo img,
  .photo .gallery,
  .placeholder { width: 100%; height: 100%; object-fit: cover; }
  .gallery { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .gallery img { min-width: 100%; scroll-snap-align: start; }
  .info,
  .product-card .info { min-width: 0; min-height: 310px; padding: 22px 19px 17px; display: flex; flex-direction: column; }
  .category { margin: 0 0 10px; color: var(--pink); font-size: 14px; line-height: 1; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .info h2,
  .product-card .info h2 {
    color: var(--ink);
    font-size: 23px;
    line-height: 1.18;
    font-weight: 800;
    letter-spacing: -.015em;
    -webkit-line-clamp: 2;
  }
  .desc { margin-top: 12px; color: var(--warm-gray); font-size: 17px; line-height: 1.42; -webkit-line-clamp: 2; }
  .variants { margin-top: 14px; gap: 9px; }
  .variant,
  .product-card .variant { padding: 7px 13px; border: 1px solid var(--pink); border-radius: 999px; background: #fff; color: var(--pink); font-size: 14px; font-weight: 700; }
  .variation-field { margin-top: 12px; }
  .variation-select { min-height: 44px; }
  .bottom { margin-top: auto; padding-top: 20px; }
  .price,
  .product-card .price { margin: 0 0 24px; color: var(--pink); font-size: 30px; line-height: 1; font-weight: 900; }
  .price .unit { margin-left: 2px; color: var(--pink); font-size: 17px; font-weight: 700; }
  .order:not(.hero) {
    width: 100%;
    min-height: 51px;
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border: 1px solid var(--pink);
    border-radius: 999px;
    background: #fff;
    color: var(--pink);
    font-size: 18px;
    font-weight: 800;
  }
  .order:not(.hero) svg { width: 25px; height: 25px; }
  .floating-whatsapp {
    right: max(22px, env(safe-area-inset-right));
    bottom: max(22px, calc(env(safe-area-inset-bottom) + 18px));
    width: 96px;
    height: 96px;
    border: 5px solid #fff;
    background: var(--pink);
    color: #fff;
    box-shadow: 0 12px 28px rgba(36,24,30,.24);
  }
  .floating-whatsapp svg { width: 48px; height: 48px; }

  @media (min-width: 1040px) {
    .products-section .catalog-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 768px) {
    .avatar { margin-left: 48px; }
  }
  @media (max-width: 767px) {
    .promo { min-height: 48px; padding: 0 16px; font-size: 13px; }
    .public-catalog-hero,
    .hero-bg { min-height: 520px; height: 520px; border-radius: 0 0 18px 18px; }
    .hero-shell,
    .hero-shell.no-visual { min-height: 520px; height: 520px; }
    .hero-bg::before { top: -165px; left: -250px; width: 450px; height: 420px; }
    .hero-bg::after { top: 46px; left: -105px; width: 570px; height: 340px; }
    .hero-copy { top: 32px; left: 20px; width: 52%; padding-left: 0; text-align: left; }
    .avatar { width: 86px; height: 86px; border-width: 4px; font-size: 32px; }
    .default-avatar svg { width: 49px; height: 49px; }
    .hero-title { margin-top: 14px; }
    h1,
    .hero-title h1 { max-width: 100%; font-size: clamp(28px, 6.2vw, 34px); line-height: 1.06; text-wrap: wrap; }
    .tagline { margin-top: 12px; font-size: 10px; line-height: 1.25; letter-spacing: .13em; }
    .bio { max-width: 100%; margin-top: 15px; font-size: 14px; line-height: 1.45; }
    .count { min-width: 0; min-height: 36px; margin-top: 14px; margin-left: 0; padding: 0 12px; font-size: 11px; white-space: nowrap; }
    .order.hero,
    .hero-shell.no-visual .order.hero { min-width: 0; min-height: 48px; margin: 15px 0 0; padding: 0 15px; gap: 8px; font-size: 13px; white-space: nowrap; }
    .order.hero svg { width: 20px; height: 20px; }
    .public-catalog-cover,
    .hero-cover { right: -18px; bottom: 0; width: 64%; }
    .hero-cover img { height: auto; max-height: 500px; object-fit: contain; }
    .hero-showcase { right: -34px; bottom: 0; width: 64%; height: 450px; margin: 0; }
    .hero-showcase-item-1 { top: 38px; right: 8px; height: 175px; }
    .hero-showcase-item-2 { bottom: 66px; height: 205px; }
    .hero-showcase-item-3 { bottom: -5px; height: 215px; }
    .catalog-tools { width: calc(100% - 28px); min-height: 154px; height: 154px; margin: -45px 14px 0; padding: 16px; border-radius: 22px; }
    .search-row { grid-template-columns: minmax(0, 1fr) 108px; gap: 12px; }
    .catalog-tools .search-control { min-height: 62px; padding: 0 14px; gap: 10px; border-radius: 16px; }
    .search-control > svg { width: 24px; height: 24px; }
    .catalog-tools .search-control input { min-height: 60px; font-size: 14px; font-weight: 700; }
    .filter-field .catalog-select-trigger { width: 108px; min-width: 108px; min-height: 62px; padding: 0 9px; gap: 7px; border-radius: 16px; font-size: 12px; }
    .catalog-select-trigger-icon { width: 22px; height: 22px; background-size: 22px 22px; }
    .category-chips { margin-top: 16px; gap: 8px; padding-right: 1px; }
    .category-chip { flex: 0 0 auto; min-width: max-content; min-height: 44px; padding: 0 15px; border-radius: 999px; font-size: 12px; }
    .catalog-section-nav { width: calc(100% - 28px); min-height: 56px; margin: 24px 14px 23px; }
    .catalog-section-nav a { min-height: 56px; border-radius: 16px; font-size: 13px; }
    .catalog-section-nav span { min-width: 26px; padding: 3px 7px; }
    main,
    main.services-only { padding: 0 14px 58px; gap: 20px; }
    .listing-header { min-height: 66px; align-items: center; }
    .listing-header h2 { font-size: 24px; }
    .listing-header p { margin-top: 6px; font-size: 13px; }
    .sort-field .catalog-select-trigger { min-width: 104px; min-height: 44px; font-size: 14px; }
    .catalog-grid,
    .products-section .catalog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .photo { height: clamp(142px, 32vw, 170px); }
    .info,
    .product-card .info { min-height: 266px; padding: 14px 12px 12px; }
    .category { margin-bottom: 8px; font-size: 10px; }
    .info h2,
    .product-card .info h2 { font-size: 17px; line-height: 1.2; }
    .desc { margin-top: 8px; font-size: 13px; line-height: 1.4; }
    .variants { margin-top: 10px; gap: 6px; }
    .variant,
    .product-card .variant { padding: 5px 8px; font-size: 10px; }
    .variation-field { margin-top: 9px; font-size: 10px; }
    .variation-select { min-height: 38px; font-size: 11px; }
    .bottom { padding-top: 14px; }
    .price,
    .product-card .price { margin-bottom: 16px; font-size: 22px; }
    .price .unit { font-size: 12px; }
    .order:not(.hero) { min-height: 45px; gap: 7px; font-size: 14px; }
    .order:not(.hero) svg { width: 21px; height: 21px; }
    .floating-whatsapp { right: 16px; width: 68px; height: 68px; border-width: 4px; }
    .floating-whatsapp svg { width: 34px; height: 34px; }
  }
  @media (max-width: 430px) {
    .hero-copy { width: 55%; }
    .bio { font-size: 13px; }
    .order.hero { padding-inline: 12px; font-size: 12px; }
    .search-row { grid-template-columns: minmax(0, 1fr) 94px; gap: 8px; }
    .filter-field .catalog-select-trigger { width: 94px; min-width: 94px; }
    .catalog-tools .search-control input { font-size: 13px; }
  }
  @media (max-width: 359px) {
    .hero-shell,
    .hero-shell.no-visual { display: block; text-align: left; }
    .hero-copy { width: 58%; }
    .hero-identity { text-align: left; }
    .avatar { width: 76px; height: 76px; }
    .bio { font-size: 12px; }
    .count { font-size: 10px; }
    .order.hero { margin-inline: 0; font-size: 11px; }
    .hero-cover { width: 68%; }
    .catalog-tools { width: calc(100% - 24px); margin-inline: 12px; padding: 13px; }
    .search-row { grid-template-columns: minmax(0, 1fr) 82px; }
    .filter-field .catalog-select-trigger { width: 82px; min-width: 82px; padding-inline: 6px; }
    .catalog-select-trigger-text { font-size: 11px; }
    .listing-header { flex-direction: row; align-items: center; }
    .sort-field { align-self: center; }
    .catalog-grid,
    .products-section .catalog-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
${promoStrip}
<section class="hero-bg" aria-labelledby="catalog-title">
  ${patternOverlay}
  <div class="hero-shell ${hasHeroVisual ? "has-visual" : "no-visual"}">
    <div class="hero-copy">
      <div class="hero-identity">${avatar}<div class="hero-title"><h1 id="catalog-title" style="color:${titleColor}">${escapeHtml(catalog.businessName)}</h1><p class="tagline">${escapeHtml(heroTagline)}</p></div></div>
      ${tagline}
      ${totalProductCount + totalServiceCount > 0 ? `<span class="count">${visualCountLabel}</span>` : ""}
      ${headerButton}
    </div>
    ${coverFigure || heroShowcase}
  </div>
</section>
${filters}
${sectionNav}
<main id="catalog-content"${count === 0 && serviceCount > 0 ? ' class="services-only"' : ""}>
${listingHeader}
${productsSection}
${servicesSection}
</main>
${cart}
${bookingDialog}
${floatingWhatsapp}
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
a{min-height:48px;border:1px solid #b45b6d;border-radius:999px;background:#fff;color:#a94e61;padding:0 22px;display:inline-flex;align-items:center;text-decoration:none;font:800 15px "Nunito Sans",sans-serif;cursor:pointer}
</style>
</head>
<body><main><div class="mark" aria-hidden="true">!</div><h1>Não foi possível abrir o catálogo</h1><p>Verifique sua conexão e tente carregar novamente.</p><a href="">Tentar novamente</a></main></body>
</html>`;
}
