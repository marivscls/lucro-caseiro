/* eslint-disable sonarjs/no-nested-conditional, sonarjs/no-nested-template-literals */
import type {
  CatalogItemAction,
  PublicCatalog,
  PublicCatalogProduct,
  PublicCatalogService,
  StorefrontCustomization,
} from "@lucro-caseiro/contracts";

import { storefrontStyles } from "./storefront-styles";

type ItemKind = "product" | "service";

const HEX = /^#[0-9a-fA-F]{6}$/;
const CANONICAL_ORIGIN = "https://catalogo.lucrocaseiro.com.br";

export function displayCatalogName(rawName: string): string {
  const trimmedName = rawName.trim();
  let visibleName = trimmedName;
  while (visibleName.startsWith("[")) {
    const prefixEnd = visibleName.indexOf("]");
    if (prefixEnd < 0) break;
    visibleName = visibleName.slice(prefixEnd + 1).trimStart();
  }
  return visibleName || trimmedName;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function mix(hex: string, target: number, amount: number): string {
  return `#${channels(hex)
    .map((channel) =>
      Math.round(channel + (target - channel) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function storefrontTheme(customization: StorefrontCustomization) {
  const safe = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);
  const primary = safe(customization.identity.primaryColor, "#4A2332");
  const action = safe(customization.identity.actionColor, "#B65F72");
  const background = safe(customization.identity.backgroundColor, "#FAF8F6");
  const text = contrast(background, "#24181E") >= 4.5 ? "#24181E" : "#FFFFFF";
  const onPrimary = contrast(primary, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#24181E";
  const onAction = contrast(action, "#FFFFFF") >= 3 ? "#FFFFFF" : "#24181E";
  return {
    primary,
    action,
    background,
    surface: mix(background, text === "#24181E" ? 255 : 0, 0.08),
    text,
    muted: text === "#24181E" ? "#6D6266" : "#E9E2E5",
    soft: mix(action, 255, 0.86),
    highlight: "#DCE86A",
    border: mix(primary, 255, 0.78),
    actionHover: mix(action, 0, 0.12),
    disabled: mix(action, 255, 0.62),
    onPrimary,
    onAction,
  };
}

export function safeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function formatCatalogPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function resolveStorefrontAction(
  customization: StorefrontCustomization,
  kind: ItemKind,
  itemId: string,
): CatalogItemAction {
  const actions = customization.organization.actions;
  if (actions.mode === "hidden") return { type: "none" };
  const override = actions.itemOverrides[`${kind}:${itemId}`];
  if (override && override.type !== "inherit") return override;
  const fallback = kind === "product" ? actions.productDefault : actions.serviceDefault;
  if (fallback.type !== "inherit") return fallback;
  const contact = customization.organization.contact;
  return contact.destination
    ? {
        type: "contact",
        label: contact.defaultActionLabel,
        channel: contact.channel === "external" ? "external" : "whatsapp",
        destination: contact.destination,
        initialMessage: contact.initialMessage,
      }
    : { type: "none" };
}

export function featuredTransformFor(
  customization: StorefrontCustomization,
  featuredItemId: string,
  breakpoint: "smallMobile" | "mobile" | "tablet" | "desktop",
) {
  return customization.hero.featuredItems
    .find((item) => item.id === featuredItemId)
    ?.transforms.find((transform) => transform.breakpoint === breakpoint);
}

function plural(value: number, singular: string, pluralValue: string): string {
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function countLabel(products: number, services: number): string {
  return [
    products > 0 ? plural(products, "produto", "produtos") : "",
    services > 0 ? plural(services, "serviço", "serviços") : "",
  ]
    .filter(Boolean)
    .join(" • ");
}

function whatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function whatsappUrl(phone: string, message: string): string | null {
  const digits = whatsappNumber(phone);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message.slice(0, 500))}`;
}

const WHATSAPP_GLYPH = `<svg class="whatsapp-icon" viewBox="0 0 24 24" width="24" height="24" preserveAspectRatio="xMidYMid meet" aria-hidden="true" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;

function icon(name: string): string {
  if (name === "sparkles") return "";
  if (name === "whatsapp") return WHATSAPP_GLYPH;
  const paths: Record<string, string> = {
    delivery:
      '<path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    store: '<path d="M4 10v10h16V10M3 4h18l-2 6H5L3 4Z"/><path d="M9 20v-6h6v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
    sort: '<path d="M8 6v12m0 0-3-3m3 3 3-3M16 18V6m0 0-3 3m3-3 3 3"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
    heart:
      '<path d="M12 20s-7-4.35-7-9.15C5 8.1 7 6.2 9.15 6.2c1.25 0 2.35.7 2.85 1.75.5-1.05 1.6-1.75 2.85-1.75C17 6.2 19 8.1 19 10.85 19 15.65 12 20 12 20Z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.store}</svg>`;
}

function transformStyle(customization: StorefrontCustomization, id: string): string {
  const names = ["smallMobile", "mobile", "tablet", "desktop"] as const;
  const aliases = ["sm", "mo", "ta", "de"];
  return names
    .map((breakpoint, index) => {
      const value = featuredTransformFor(customization, id, breakpoint) ?? {
        x: 0.5,
        y: 0.5,
        scale: 1,
        layer: index,
      };
      return `--x-${aliases[index]}:${value.x * 100}%;--y-${aliases[index]}:${value.y * 100}%;--s-${aliases[index]}:${value.scale};--z-${aliases[index]}:${value.layer}`;
    })
    .join(";");
}

export function resolveFeaturedVisual(
  item: StorefrontCustomization["hero"]["featuredItems"][number],
  removeBackground: boolean,
): Readonly<{ source: string | null; cutout: boolean }> {
  if (removeBackground && item.processedUrl) {
    return { source: item.processedUrl, cutout: true };
  }
  if (!item.assetUrl) return { source: null, cutout: false };
  return { source: item.assetUrl, cutout: removeBackground };
}

export function splitFloatingContactLines(label: string): readonly string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [label.trim()];
  let splitAt = 1;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(" ").length;
    const right = words.slice(index).join(" ").length;
    const score = Math.abs(left - right) + Math.max(left, right) * 0.15;
    if (score < bestScore) {
      bestScore = score;
      splitAt = index;
    }
  }
  return [words.slice(0, splitAt).join(" "), words.slice(splitAt).join(" ")];
}

function heroVisuals(customization: StorefrontCustomization): string {
  const alternative = customization.hero.smallScreenAlternativeUrl;
  const alternativeHtml = alternative
    ? `<img class="hero-small-alternative" src="${escapeHtml(alternative)}" alt="" width="720" height="520" fetchpriority="high">`
    : "";
  const featuredItems = customization.hero.featuredItems.filter(
    (item) => resolveFeaturedVisual(item, customization.hero.removeBackground).source,
  );
  const items = featuredItems
    .map((item, index) => {
      const visual = resolveFeaturedVisual(item, customization.hero.removeBackground);
      const treatment = visual.cutout ? "featured-cutout" : "featured-photo";
      return `<img class="featured featured-${index + 1} ${treatment}" src="${escapeHtml(visual.source!)}" alt="${escapeHtml(displayCatalogName(item.altText))}" width="640" height="640" ${index === 0 ? 'fetchpriority="high"' : 'loading="eager"'} style="${transformStyle(customization, item.id)}">`;
    })
    .join("");
  if (!items && !alternativeHtml) return "";
  return `<div class="hero-visual visual-${featuredItems.length}" aria-label="Destaques da vitrine">${alternativeHtml}${items}</div>`;
}

function heroCover(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string {
  const cover =
    customization.identity.offeringMode === "services"
      ? (catalog.serviceCoverUrl ?? catalog.coverUrl)
      : catalog.coverUrl;
  if (!cover) return "";
  const mobile = customization.hero.smallScreenAlternativeUrl;
  const focal = customization.hero.coverFocal;
  const position = `--cover-position-x:${(focal?.x ?? 0.5) * 100}%;--cover-position-y:${(focal?.y ?? 0.5) * 100}%;--cover-scale:${focal?.scale ?? 1}`;
  return `<picture class="hero-cover" aria-hidden="true" style="${position}">${mobile ? `<source media="(max-width: 767px)" srcset="${escapeHtml(mobile)}">` : ""}<img src="${escapeHtml(cover)}" alt="" width="1600" height="1000" fetchpriority="high"></picture><div class="hero-readability" aria-hidden="true"></div>`;
}

function offeringEyebrow(
  mode: StorefrontCustomization["identity"]["offeringMode"],
): string {
  if (mode === "products") return "Catálogo de produtos";
  if (mode === "services") return "Catálogo de serviços";
  return "Produtos e serviços";
}

function actionGlyph(action: CatalogItemAction): string {
  if (action.type === "schedule") return icon("calendar");
  if (action.type === "details" || action.type === "externalLink") return icon("chevron");
  return icon("whatsapp");
}

function heroAction(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string {
  const action = customization.hero.action;
  if (action.type === "none" || !action.label.trim()) return "";
  const contact = customization.organization.contact;
  const glyph =
    action.type === "whatsapp" || action.type === "quote"
      ? icon("whatsapp")
      : icon("chevron");
  if (action.type === "externalLink") {
    const href = safeExternalUrl(action.destination);
    return href
      ? `<a class="primary-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${icon("chevron")} ${escapeHtml(action.label)}</a>`
      : "";
  }
  if (action.type === "whatsapp" || action.type === "quote") {
    const destination =
      action.destination ?? contact.destination ?? catalog.whatsapp ?? "";
    const message =
      contact.initialMessage || "Olá! Vim pelo seu catálogo e gostaria de saber mais.";
    const href = whatsappUrl(destination, message);
    return href
      ? `<a class="primary-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${glyph} ${escapeHtml(action.label)}</a>`
      : "";
  }
  const externalSchedule = safeExternalUrl(action.destination);
  const href = externalSchedule ?? "#storefront-list";
  return `<a class="primary-action" href="${escapeHtml(href)}"${externalSchedule ? ' target="_blank" rel="noopener noreferrer"' : ""}>${glyph} ${escapeHtml(action.label)}</a>`;
}

function renderHero(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string {
  const { identity, hero, organization } = customization;
  const products = organization.content.showProducts ? catalog.totalProducts : 0;
  const services = organization.content.showServices
    ? (catalog.services?.length ?? 0)
    : 0;
  const counts = countLabel(products, services);
  const logoUrl = identity.logoUrl ?? catalog.logoUrl;
  const logo = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Logo de ${escapeHtml(identity.displayName)}" width="120" height="120">`
    : `<span class="logo-placeholder" aria-hidden="true">${icon("store")}</span>`;
  const promo =
    hero.showPromotionalBar && hero.promotionalText.trim()
      ? `<aside class="announcement" aria-label="Aviso"><span>${escapeHtml(hero.promotionalText)}</span></aside>`
      : "";
  const signature = hero.shortSignature
    ? `<p class="signature">${icon("heart")}<span>${escapeHtml(hero.shortSignature)}</span></p>`
    : "";
  const intro = hero.introduction
    ? `<p class="introduction">${escapeHtml(hero.introduction)}</p>`
    : "";
  const cover = heroCover(catalog, customization);
  const visuals = cover ? "" : heroVisuals(customization);
  const visualClass = cover ? " has-cover" : visuals ? " has-visual" : " no-visual";
  return `${promo}<section class="storefront-hero hero-${hero.style}${visualClass}" aria-labelledby="storefront-title">${cover}<div class="hero-copy"><div class="identity-mark">${logo}</div><p class="eyebrow">${escapeHtml(offeringEyebrow(identity.offeringMode))}</p><h1 id="storefront-title">${escapeHtml(identity.displayName)}</h1>${intro}${signature}${counts ? `<p class="counts">${escapeHtml(counts)}</p>` : ""}${heroAction(catalog, customization)}</div>${visuals}</section>`;
}

function quickInfo(customization: StorefrontCustomization): string {
  const items = customization.hero.quickInfo
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);
  if (!items.length) return "";
  return `<section class="quick-info" aria-label="Informações importantes">${items
    .map(
      (item) =>
        `<div class="quick-item">${icon(item.icon)}<span>${escapeHtml(item.label)}</span></div>`,
    )
    .join("")}</section>`;
}

function locationLabel(mode: PublicCatalogService["locationMode"]): string {
  return {
    business: "Presencial",
    client: "No endereço do cliente",
    online: "Online",
    flexible: "Local a combinar",
  }[mode];
}

function actionLabel(action: CatalogItemAction): string {
  if (action.label?.trim()) return action.label;
  return {
    inherit: "",
    order: "Pedir",
    preorder: "Encomendar",
    quote: "Solicitar orçamento",
    schedule: "Agendar",
    details: "Ver detalhes",
    contact: "Contato",
    externalLink: "Abrir link",
    none: "",
  }[action.type];
}

function itemAction(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  kind: ItemKind,
  item: PublicCatalogProduct | PublicCatalogService,
): string {
  const action = resolveStorefrontAction(customization, kind, item.id);
  const label = actionLabel(action);
  if (action.type === "none" || !label) return "";
  const glyph = actionGlyph(action);
  if (action.type === "details") {
    return `<button class="card-action details-action" type="button" data-details aria-expanded="false">${glyph} ${escapeHtml(label)}</button>`;
  }
  if (action.type === "schedule" && kind === "service") {
    const external = safeExternalUrl(action.destination);
    return external
      ? `<a class="card-action" href="${escapeHtml(external)}" target="_blank" rel="noopener noreferrer">${glyph} ${escapeHtml(label)}</a>`
      : `<button class="card-action schedule-action" type="button" data-service-id="${escapeHtml(item.id)}" data-service-name="${escapeHtml(displayCatalogName(item.name))}">${glyph} ${escapeHtml(label)}</button>`;
  }
  if (action.type === "externalLink") {
    const external = safeExternalUrl(action.destination);
    return external
      ? `<a class="card-action" href="${escapeHtml(external)}" target="_blank" rel="noopener noreferrer">${glyph} ${escapeHtml(label)}</a>`
      : "";
  }
  const contact = customization.organization.contact;
  const destination = action.destination ?? contact.destination ?? catalog.whatsapp ?? "";
  const fallback =
    action.type === "quote"
      ? `Olá! Gostaria de solicitar um orçamento para “${displayCatalogName(item.name)}”.`
      : action.type === "order" || action.type === "preorder"
        ? `Olá! Gostaria de pedir “${displayCatalogName(item.name)}”.`
        : `Olá! Vi o item “${displayCatalogName(item.name)}” no seu catálogo e gostaria de saber mais.`;
  const href = whatsappUrl(destination, action.initialMessage || fallback);
  return href
    ? `<a class="card-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${glyph} ${escapeHtml(label)}</a>`
    : "";
}

function priceMarkup(
  price: number | null,
  customization: StorefrontCustomization,
  prefix = "",
): string {
  if (!customization.organization.cards.showPrice) return "";
  if (price !== null)
    return `<p class="item-price">${prefix}${escapeHtml(formatCatalogPrice(price))}</p>`;
  const cards = customization.organization.cards;
  if (cards.missingPriceBehavior === "hidden") return "";
  const label =
    cards.missingPriceBehavior === "custom" && cards.missingPriceText
      ? cards.missingPriceText
      : "Valor sob consulta";
  return `<p class="item-price consultation">${escapeHtml(label)}</p>`;
}

function productCard(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  product: PublicCatalogProduct,
  index: number,
): string {
  const visibleName = displayCatalogName(product.name);
  const image = product.photoUrl
    ? `<img src="${escapeHtml(product.photoUrl)}" alt="${escapeHtml(visibleName)}" width="720" height="540" ${index < 2 ? 'loading="eager"' : 'loading="lazy"'}>`
    : `<div class="item-placeholder" aria-hidden="true">${icon("store")}</div>`;
  const description =
    customization.organization.cards.showDetails && product.description
      ? `<p class="item-description" data-detail-copy>${escapeHtml(product.description)}</p>`
      : "";
  const available =
    product.variations.length === 0 || product.variations.some((item) => item.inStock);
  const availability = customization.organization.cards.showAvailability
    ? `<p class="item-meta">${icon("clock")}<span>${available ? "Disponível" : "Indisponível"}</span></p>`
    : "";
  const category = product.category
    ? `<p class="item-category">${escapeHtml(product.category.toLocaleUpperCase("pt-BR"))}</p>`
    : "";
  const search = normalizeText(
    `${visibleName} ${product.description ?? ""} ${product.category}`,
  );
  return `<article class="storefront-card product-card" data-kind="products" data-category="${escapeHtml(product.category)}" data-search="${escapeHtml(search)}" data-name="${escapeHtml(normalizeText(visibleName))}" data-price="${product.salePrice}" data-order="${index}"><div class="item-image">${image}</div><div class="item-body">${category}<h3>${escapeHtml(visibleName)}</h3>${description}${priceMarkup(product.salePrice, customization, "a partir de ")}<div class="item-footer">${availability}${itemAction(catalog, customization, "product", product)}</div></div></article>`;
}

function serviceCard(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  service: PublicCatalogService,
  index: number,
): string {
  const visibleName = displayCatalogName(service.name);
  const description =
    customization.organization.cards.showDetails && service.description
      ? `<p class="item-description" data-detail-copy>${escapeHtml(service.description)}</p>`
      : "";
  const search = normalizeText(
    `${visibleName} ${service.description ?? ""} ${locationLabel(service.locationMode)} serviço`,
  );
  return `<article class="storefront-card service-card" data-kind="services" data-category="" data-search="${escapeHtml(search)}" data-name="${escapeHtml(normalizeText(visibleName))}" data-price="${service.defaultPrice ?? ""}" data-order="${index}"><div class="item-image item-placeholder" aria-hidden="true">${icon("calendar")}</div><div class="item-body"><p class="item-category">SERVIÇO</p><h3>${escapeHtml(visibleName)}</h3>${description}${priceMarkup(service.defaultPrice, customization, service.defaultPrice === null ? "" : "a partir de ")}<div class="item-footer"><p class="item-meta">${icon("clock")}<span>${service.durationMinutes} min • ${escapeHtml(locationLabel(service.locationMode))}</span></p>${itemAction(catalog, customization, "service", service)}</div></div></article>`;
}

function structuredData(catalog: PublicCatalog, customization: StorefrontCustomization) {
  const mode = customization.identity.offeringMode;
  const type =
    mode === "products"
      ? "Store"
      : mode === "services"
        ? "ProfessionalService"
        : "LocalBusiness";
  const slug = catalog.slug ?? customization.publication.slug;
  const url = `${CANONICAL_ORIGIN}/c/${encodeURIComponent(slug)}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": type,
      "@id": `${url}#business`,
      name: customization.identity.displayName,
      url,
      ...(customization.identity.logoUrl ? { logo: customization.identity.logoUrl } : {}),
      ...(customization.hero.introduction
        ? { description: customization.hero.introduction }
        : {}),
    },
  ];
  catalog.products.forEach((product) =>
    graph.push({
      "@type": "Product",
      name: displayCatalogName(product.name),
      ...(product.description ? { description: product.description } : {}),
      ...(product.photoUrl ? { image: product.photoUrl } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: product.salePrice,
        availability: product.variations.some((item) => !item.inStock)
          ? "https://schema.org/LimitedAvailability"
          : "https://schema.org/InStock",
      },
    }),
  );
  (catalog.services ?? []).forEach((service) =>
    graph.push({
      "@type": "Service",
      name: displayCatalogName(service.name),
      ...(service.description ? { description: service.description } : {}),
      provider: { "@id": `${url}#business` },
      ...(service.defaultPrice === null
        ? {}
        : {
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              price: service.defaultPrice,
            },
          }),
    }),
  );
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c",
  );
}

function bookingDialog(): string {
  return `<dialog id="booking-dialog" aria-labelledby="booking-title"><form id="booking-form"><header><div><p>Solicitar horário</p><h2 id="booking-title" tabindex="-1"></h2></div><button type="button" class="dialog-close" aria-label="Fechar">${icon("close")}</button></header><input id="booking-service-id" type="hidden"><label>Seu nome<input id="booking-name" required maxlength="120" autocomplete="name"></label><label>WhatsApp<input id="booking-phone" required minlength="8" maxlength="20" inputmode="tel" autocomplete="tel"></label><div class="form-row"><label>Data desejada<input id="booking-date" required type="date"></label><label>Horário<input id="booking-time" type="time"></label></div><label>Onde prefere ser atendida(o)?<select id="booking-location"><option value="business">No espaço profissional</option><option value="client">No meu endereço</option><option value="online">Online</option></select></label><label>Observações<textarea id="booking-notes" maxlength="500"></textarea></label><p id="booking-message" role="status" aria-live="polite"></p><button class="dialog-submit" type="submit">Enviar solicitação</button></form></dialog>`;
}

function storefrontScript(
  nonce: string,
  initialType: string,
  defaultSort: string,
): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<script${nonceAttr}>(()=>{const root=document.querySelector('[data-storefront]');const cards=[...document.querySelectorAll('.storefront-card')];const search=document.getElementById('storefront-search');const clear=document.getElementById('search-clear');const sort=document.getElementById('storefront-sort');const status=document.getElementById('results-status');const empty=document.getElementById('no-results');const params=new URLSearchParams(location.search);let type=params.get('tipo')==='servicos'?'services':params.get('tipo')==='produtos'?'products':'${initialType}';let category=params.get('categoria')||'';let timer;const norm=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');const syncUrl=()=>{const next=new URL(location.href);next.searchParams.set('tipo',type==='services'?'servicos':'produtos');search.value?next.searchParams.set('q',search.value):next.searchParams.delete('q');category?next.searchParams.set('categoria',category):next.searchParams.delete('categoria');sort.value!=='${defaultSort}'?next.searchParams.set('ordem',sort.value):next.searchParams.delete('ordem');history.replaceState(null,'',next)};const update=()=>{const query=norm(search.value.trim());let visible=0;cards.forEach(card=>{const showType=card.dataset.kind===type;const showCategory=!category||card.dataset.category===category;const showSearch=!query||card.dataset.search.includes(query);card.hidden=!(showType&&showCategory&&showSearch);if(!card.hidden)visible++});const ordered=[...cards].sort((a,b)=>{if(sort.value==='priceLow')return (Number(a.dataset.price)||Number.MAX_SAFE_INTEGER)-(Number(b.dataset.price)||Number.MAX_SAFE_INTEGER);if(sort.value==='priceHigh')return (Number(b.dataset.price)||-1)-(Number(a.dataset.price)||-1);if(sort.value==='name')return a.dataset.name.localeCompare(b.dataset.name,'pt-BR');return Number(a.dataset.order)-Number(b.dataset.order)});const grid=document.querySelector('.storefront-grid');ordered.forEach(card=>grid.append(card));document.querySelectorAll('[data-type]').forEach(button=>{const active=button.dataset.type===type;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));clear.hidden=!search.value;empty.hidden=visible>0;status.textContent=visible===1?'1 resultado':visible+' resultados';syncUrl()};document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>{type=button.dataset.type;category='';update()}));document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;update()}));search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,300)});clear.addEventListener('click',()=>{search.value='';search.focus();update()});sort.addEventListener('change',update);search.value=params.get('q')||'';sort.value=params.get('ordem')||'${defaultSort}';document.querySelectorAll('[data-details]').forEach(button=>button.addEventListener('click',()=>{const copy=button.closest('.storefront-card').querySelector('[data-detail-copy]');if(!copy)return;const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));copy.classList.toggle('expanded',!expanded)}));const filter=document.getElementById('filter-dialog');const filterOpen=document.getElementById('filter-open');let filterReturn;filterOpen?.addEventListener('click',()=>{filterReturn=document.activeElement;filter.showModal()});filter?.querySelector('.dialog-close').addEventListener('click',()=>filter.close());filter?.addEventListener('close',()=>filterReturn?.focus());document.getElementById('filter-clear')?.addEventListener('click',()=>{category='';filter.close();update()});const booking=document.getElementById('booking-dialog');const bookingForm=document.getElementById('booking-form');document.querySelectorAll('.schedule-action').forEach(button=>button.addEventListener('click',()=>{document.getElementById('booking-service-id').value=button.dataset.serviceId;document.getElementById('booking-title').textContent=button.dataset.serviceName;document.getElementById('booking-message').textContent='';booking.showModal();requestAnimationFrame(()=>document.getElementById('booking-title').focus())}));booking?.querySelector('.dialog-close').addEventListener('click',()=>booking.close());bookingForm?.addEventListener('submit',async event=>{event.preventDefault();const message=document.getElementById('booking-message');message.textContent='Enviando solicitação…';try{const response=await fetch(location.pathname+'/service-bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({serviceId:document.getElementById('booking-service-id').value,clientName:document.getElementById('booking-name').value,phone:document.getElementById('booking-phone').value,desiredDate:document.getElementById('booking-date').value,desiredTime:document.getElementById('booking-time').value||null,locationMode:document.getElementById('booking-location').value,notes:document.getElementById('booking-notes').value||null})});const result=await response.json();if(!response.ok)throw new Error(result.message||result.details?.join(' • ')||'Não foi possível enviar.');bookingForm.reset();message.textContent='Solicitação enviada. O negócio entrará em contato para confirmar.'}catch(error){message.textContent=error.message}});update()})()</script>`;
}

function heroCoverScript(nonce: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<script${nonceAttr}>(()=>{const image=document.querySelector('.hero-cover img');if(!image)return;const fail=()=>{image.closest('.storefront-hero')?.classList.add('cover-failed');console.warn('[storefront] Não foi possível carregar a capa configurada.',image.currentSrc||image.src)};image.addEventListener('error',fail,{once:true});if(image.complete&&image.naturalWidth===0)fail()})()</script>`;
}

export function renderPublishedStorefrontHtml(
  catalog: PublicCatalog,
  section: "all" | "products" | "services" = "all",
  nonce = "",
  preview = false,
): string {
  const customization = catalog.customization!;
  const theme = storefrontTheme(customization);
  const showProducts = customization.organization.content.showProducts;
  const showServices = customization.organization.content.showServices;
  const products = showProducts ? catalog.products : [];
  const services = showServices ? (catalog.services ?? []) : [];
  const mixed = products.length > 0 && services.length > 0;
  const configuredInitial = customization.organization.content.initialSection;
  const initialType =
    (section === "services" && services.length > 0) ||
    (!products.length && services.length)
      ? "services"
      : section === "products" || configuredInitial !== "services"
        ? "products"
        : "services";
  const categories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];
  const order = customization.organization.discovery.categoryOrder;
  categories.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "pt-BR");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const defaultSort = customization.organization.discovery.defaultSort;
  const canonical = `${CANONICAL_ORIGIN}/c/${encodeURIComponent(
    catalog.slug ?? customization.publication.slug,
  )}`;
  const title = `${customization.identity.displayName} | Catálogo`;
  const description =
    customization.hero.introduction ||
    `Conheça os produtos e serviços de ${customization.identity.displayName}.`;
  const firstFeatured = customization.hero.featuredItems.find(
    (item) => resolveFeaturedVisual(item, customization.hero.removeBackground).source,
  );
  const firstVisual = firstFeatured
    ? resolveFeaturedVisual(firstFeatured, customization.hero.removeBackground)
    : null;
  const image = catalog.coverUrl ?? firstVisual?.source ?? customization.identity.logoUrl;
  const imageMeta = image
    ? `<meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:card" content="summary_large_image">`
    : '<meta name="twitter:card" content="summary">';
  const cards = [
    ...products.map((item, index) => productCard(catalog, customization, item, index)),
    ...services.map((item, index) => serviceCard(catalog, customization, item, index)),
  ].join("");
  const tabs = mixed
    ? `<div class="type-tabs" role="tablist" aria-label="Tipo de item"><button role="tab" data-type="products">${icon("store")} Produtos <span>${products.length}</span></button><button role="tab" data-type="services">${icon("calendar")} Serviços <span>${services.length}</span></button></div>`
    : "";
  const categoryNav =
    customization.organization.discovery.showCategories && categories.length
      ? `<nav class="category-scroll" aria-label="Categorias"><button data-category="" aria-pressed="true">Todos</button>${categories.map((category) => `<button data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`).join("")}</nav>`
      : "";
  const search = customization.organization.discovery.showSearch
    ? `<label class="search-field">${icon("search")}<span class="visually-hidden">Buscar na vitrine</span><input id="storefront-search" type="search" placeholder="O que você procura?" autocomplete="off"><button id="search-clear" type="button" aria-label="Limpar busca" hidden>${icon("close")}</button></label>`
    : `<input id="storefront-search" type="hidden">`;
  const filters =
    customization.organization.discovery.allowFilters && categories.length
      ? `<button id="filter-open" class="filter-button" type="button" aria-label="Filtros">${icon("filter")}<span>Filtros</span></button><dialog id="filter-dialog" aria-labelledby="filter-title"><div class="dialog-panel"><header><h2 id="filter-title">Filtros</h2><button class="dialog-close" type="button" aria-label="Fechar">${icon("close")}</button></header><p>Escolha uma categoria na vitrine ou limpe a seleção atual.</p><button id="filter-clear" class="dialog-submit" type="button">Limpar filtros</button></div></dialog>`
      : "";
  const sort = customization.organization.discovery.allowSorting
    ? `<label class="sort-field"><span>${icon("sort")} Ordenar</span><select id="storefront-sort" aria-label="Ordenar itens"><option value="featured">Destaques primeiro</option><option value="name">Nome</option><option value="priceLow">Menor preço</option><option value="priceHigh">Maior preço</option></select></label>`
    : `<select id="storefront-sort" hidden><option value="${defaultSort}">${defaultSort}</option></select>`;
  const quick = quickInfo(customization);
  const emptyCatalog = cards
    ? ""
    : `<section class="catalog-empty"><span aria-hidden="true">${icon("store")}</span><h2>Esta vitrine está sendo preparada.</h2><p>Volte em breve para conhecer as novidades.</p></section>`;
  const contact = customization.organization.contact;
  let floating = "";
  if (contact.floatingEnabled && contact.destination) {
    const href =
      contact.channel === "whatsapp"
        ? whatsappUrl(
            contact.destination,
            contact.initialMessage || "Olá! Vim pelo seu catálogo.",
          )
        : contact.channel === "phone"
          ? `tel:${contact.destination.replace(/[^+\d]/g, "")}`
          : contact.channel === "email"
            ? `mailto:${contact.destination}`
            : safeExternalUrl(contact.destination);
    if (href) {
      const labelLines = splitFloatingContactLines(contact.defaultActionLabel)
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join("");
      floating = `<a class="floating-contact" href="${escapeHtml(href)}"${contact.channel === "external" || contact.channel === "whatsapp" ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="${escapeHtml(contact.defaultActionLabel)}">${icon(contact.channel === "whatsapp" ? "whatsapp" : "store")}<span class="floating-label">${labelLines}</span></a>`;
    }
  }
  const style = customization.organization.cards.style;
  const hero = customization.hero.style;
  const nonceAttribute = nonce ? ` nonce="${nonce}"` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${imageMeta}<meta name="robots" content="${preview ? "noindex,nofollow" : "index,follow"}"><meta name="theme-color" content="${theme.primary}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json"${nonceAttribute}>${structuredData(catalog, customization)}</script><style>${storefrontStyles(theme)}</style></head><body class="cards-${style} hero-mode-${hero}"><header>${renderHero(catalog, customization)}</header><main id="storefront-list" class="storefront-shell" data-storefront>${quick}<section class="discovery" aria-label="Buscar e filtrar"><div class="search-row">${search}${filters}</div>${categoryNav}</section>${tabs}${emptyCatalog}${cards ? `<section aria-labelledby="listing-title"><header class="listing-header"><div><h2 id="listing-title">Escolha o que deseja</h2><p>Produzido com carinho, escolhido por você.</p></div>${sort}</header><p id="results-status" class="results-status" role="status" aria-live="polite"></p><div id="no-results" class="no-results" hidden><h3>Nenhum resultado encontrado</h3><p>Tente limpar a busca ou remover os filtros.</p></div><div class="storefront-grid">${cards}</div></section>` : ""}</main>${services.length ? bookingDialog() : ""}${floating}<footer>Catálogo de ${escapeHtml(customization.identity.displayName)}</footer>${heroCoverScript(nonce)}${cards ? storefrontScript(nonce, initialType, defaultSort) : ""}</body></html>`;
}
