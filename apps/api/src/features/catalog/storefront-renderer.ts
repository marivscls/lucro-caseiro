/* eslint-disable sonarjs/no-nested-conditional, sonarjs/no-nested-template-literals */
import type {
  CatalogItemAction,
  PublicCatalog,
  PublicCatalogProduct,
  PublicCatalogService,
  StorefrontCustomization,
} from "@lucro-caseiro/contracts";
import { CATALOG_SLUG_REGEX } from "@lucro-caseiro/contracts";

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

function fallbackActionColor(accent: PublicCatalog["accentColor"]): string {
  if (typeof accent === "string" && HEX.test(accent)) return accent;
  if (accent === "green") return "#447a55";
  if (accent === "lavender") return "#7a64b0";
  if (accent === "blue") return "#3f74a0";
  if (accent === "amber") return "#b3852f";
  return "#B65F72";
}

export function defaultStorefrontCustomization(
  catalog: PublicCatalog,
): StorefrontCustomization {
  const productCount = catalog.products.length;
  const serviceCount = catalog.services?.length ?? 0;
  let offeringMode: StorefrontCustomization["identity"]["offeringMode"] = "both";
  if (productCount > 0 && serviceCount === 0) offeringMode = "products";
  if (serviceCount > 0 && productCount === 0) offeringMode = "services";
  const slug =
    catalog.slug && CATALOG_SLUG_REGEX.test(catalog.slug) ? catalog.slug : "meu-catalogo";
  const promotionalText = (catalog.promoBanner ?? "").trim().slice(0, 60);
  const introduction = (catalog.tagline ?? "").trim().slice(0, 120);
  const whatsapp = catalog.whatsapp?.replace(/\D/g, "") ?? "";
  const displayName = catalog.businessName.trim().slice(0, 60) || "Meu negócio";
  return {
    version: 1,
    identity: {
      displayName,
      logoUrl: catalog.logoUrl,
      offeringMode,
      primaryColor:
        catalog.titleColor && HEX.test(catalog.titleColor)
          ? catalog.titleColor
          : "#4A2332",
      actionColor: fallbackActionColor(catalog.accentColor),
      backgroundColor: "#FAF8F6",
      textColor:
        catalog.descriptionColor && HEX.test(catalog.descriptionColor)
          ? catalog.descriptionColor
          : "#6D6266",
    },
    hero: {
      style: "classic",
      featuredItems: [],
      removeBackground: false,
      coverFocal: { x: 0.5, y: 0.5, scale: 1 },
      smallScreenAlternativeUrl: null,
      introduction,
      shortSignature: "",
      action: {
        type: whatsapp ? "whatsapp" : "none",
        label: whatsapp ? "Entrar em contato" : "",
        ...(whatsapp ? { destination: whatsapp } : {}),
      },
      promotionalText,
      showPromotionalBar: Boolean(promotionalText),
      quickInfo: [],
    },
    organization: {
      content: {
        showProducts: true,
        showServices: true,
        showCategories: true,
        sectionOrder: ["products", "services", "categories"],
        initialSection: "all",
      },
      discovery: {
        showSearch: true,
        showCategories: true,
        allowFilters: false,
        allowSorting: false,
        defaultSort: "featured",
        visibleCategoryIds: [],
        categoryOrder: [],
      },
      cards: {
        style: "editorial",
        showPrice: true,
        showDetails: true,
        showAvailability: true,
        missingPriceBehavior: "consult",
        missingPriceText: "Consultar",
      },
      actions: {
        mode: "default",
        productDefault: {
          type: "order",
          label: "Pedir",
          channel: "whatsapp",
          ...(whatsapp ? { destination: whatsapp } : {}),
        },
        serviceDefault: {
          type: "schedule",
          label: "Agendar",
          channel: "whatsapp",
          ...(whatsapp ? { destination: whatsapp } : {}),
        },
        itemOverrides: {},
      },
      contact: {
        floatingEnabled: Boolean(whatsapp),
        channel: "whatsapp",
        destination: whatsapp,
        defaultActionLabel: "Entrar em contato",
        keepVisibleOnScroll: true,
        initialMessage: "Olá! Vim pelo seu catálogo.",
      },
    },
    publication: {
      slug,
      status: "published",
      publishedAt: null,
    },
  };
}

export function storefrontTheme(customization: StorefrontCustomization) {
  const safe = (value: string, fallback: string) => (HEX.test(value) ? value : fallback);
  const primary = safe(customization.identity.primaryColor, "#4A2332");
  const action = safe(customization.identity.actionColor, "#B65F72");
  const background = safe(customization.identity.backgroundColor, "#FAF8F6");
  const copy = safe(customization.identity.textColor, "#6D6266");
  const text = contrast(background, "#24181E") >= 4.5 ? "#24181E" : "#FFFFFF";
  const onPrimary = contrast(primary, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#24181E";
  const onAction = contrast(action, "#FFFFFF") >= 3 ? "#FFFFFF" : "#24181E";
  return {
    primary,
    action,
    background,
    surface: mix(background, text === "#24181E" ? 255 : 0, 0.08),
    text,
    muted: copy,
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
  const paths = new Map<string, string>([
    [
      "delivery",
      '<path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    ],
    [
      "calendar",
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    ],
    ["store", '<path d="M4 10v10h16V10M3 4h18l-2 6H5L3 4Z"/><path d="M9 20v-6h6v6"/>'],
    ["search", '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'],
    [
      "box",
      '<path d="M3 8.2 12 3.5l9 4.7v9.3L12 22.2 3 17.5z"/><path d="m3 8.2 9 4.8 9-4.8M12 13v9.2"/>',
    ],
    ["filter", '<path d="M4 7h16M7 12h10M10 17h4"/>'],
    ["sort", '<path d="M8 6v12m0 0-3-3m3 3 3-3M16 18V6m0 0-3 3m3-3 3 3"/>'],
    ["chevron", '<path d="m9 18 6-6-6-6"/>'],
    ["chevron-down", '<path d="m6 9 6 6 6-6"/>'],
    ["close", '<path d="m6 6 12 12M18 6 6 18"/>'],
    ["clock", '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>'],
    ["check", '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.4 2.4L16 9"/>'],
    ["unavailable", '<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6M15 9l-6 6"/>'],
    [
      "pin",
      '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    ],
    [
      "heart",
      '<path d="M12 20s-7-4.35-7-9.15C5 8.1 7 6.2 9.15 6.2c1.25 0 2.35.7 2.85 1.75.5-1.05 1.6-1.75 2.85-1.75C17 6.2 19 8.1 19 10.85 19 15.65 12 20 12 20Z"/>',
    ],
  ]);
  const glyph = paths.get(name) ?? paths.get("store");
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>`;
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

export function productHasPriceRange(product: PublicCatalogProduct): boolean {
  return product.variations.length > 1;
}

export function serviceListedPrice(
  service: PublicCatalogService,
): Readonly<{ amount: number | null; hasRange: boolean }> {
  const prices = [
    service.defaultPrice,
    ...service.variations.map((item) => item.price),
    ...service.packages.map((item) => item.price),
  ].filter((value): value is number => value != null);
  if (prices.length === 0) return { amount: null, hasRange: false };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { amount: min, hasRange: min !== max };
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

function storeLogo(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  size: number,
): string {
  const logoUrl = customization.identity.logoUrl ?? catalog.logoUrl;
  return logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="Logo de ${escapeHtml(customization.identity.displayName)}" width="${size}" height="${size}">`
    : `<span class="logo-placeholder" aria-hidden="true">${icon("store")}</span>`;
}

function contactWhatsappHref(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string | null {
  const contact = customization.organization.contact;
  const action = customization.hero.action;
  const destination =
    (action.type === "whatsapp" || action.type === "quote"
      ? action.destination
      : undefined) ??
    contact.destination ??
    catalog.whatsapp ??
    "";
  const message =
    contact.initialMessage || "Olá! Vim pelo seu catálogo e gostaria de saber mais.";
  return whatsappUrl(destination, message);
}

function heroAction(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string {
  const action = customization.hero.action;
  if (action.type === "none" || !action.label.trim()) return "";
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
    const href = contactWhatsappHref(catalog, customization);
    return href
      ? `<a class="primary-action" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${glyph} ${escapeHtml(action.label)}</a>`
      : "";
  }
  const externalSchedule = safeExternalUrl(action.destination);
  const href = externalSchedule ?? "#storefront-list";
  return `<a class="primary-action" href="${escapeHtml(href)}"${externalSchedule ? ' target="_blank" rel="noopener noreferrer"' : ""}>${glyph} ${escapeHtml(action.label)}</a>`;
}

function compactHeader(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
): string {
  const name = customization.identity.displayName;
  const href = contactWhatsappHref(catalog, customization);
  const whatsapp = href
    ? `<a class="icon-button" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar no WhatsApp">${icon("whatsapp")}</a>`
    : "";
  return `<header class="compact-header" data-compact-header aria-hidden="true"><div class="compact-header-inner"><a class="compact-brand" href="#topo">${storeLogo(catalog, customization, 72)}<span>${escapeHtml(name)}</span></a><div class="compact-actions"><a class="icon-button" href="#storefront-search" data-compact-search aria-label="Buscar no catálogo">${icon("search")}</a>${whatsapp}</div></div></header>`;
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
  const visualClass = cover ? " has-cover" : " no-visual";
  const status = `<span class="status-chip"><span class="status-dot" aria-hidden="true"></span>Aceitando encomendas</span>`;
  const countsRow = `<div class="store-meta">${counts ? `<p class="counts">${icon("box")} ${escapeHtml(counts)}</p>` : ""}${status}</div>`;
  return `${promo}<section id="topo" class="storefront-hero hero-${hero.style}${visualClass}" data-hero-sentinel aria-labelledby="storefront-title"><div class="hero-cover-wrap">${cover}</div><div class="store-card"><div class="identity-mark">${storeLogo(catalog, customization, 144)}</div><p class="eyebrow">${escapeHtml(offeringEyebrow(identity.offeringMode))}</p><h1 id="storefront-title">${escapeHtml(identity.displayName)}</h1>${intro}${signature}${countsRow}${heroAction(catalog, customization)}${quickInfo(customization)}</div></section>`;
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
  if (mode === "client") return "No endereço do cliente";
  if (mode === "online") return "Online";
  if (mode === "flexible") return "Local a combinar";
  return "Presencial";
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

function itemHit(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  kind: ItemKind,
  item: PublicCatalogProduct | PublicCatalogService,
  inner: string,
): string {
  const action = resolveStorefrontAction(customization, kind, item.id);
  const label = actionLabel(action);
  const visibleName = displayCatalogName(item.name);
  const aria = label ? `${label}: ${visibleName}` : visibleName;
  if (action.type === "details") {
    return `<button class="card-hit details-action" type="button" data-details aria-haspopup="dialog" aria-label="${escapeHtml(aria)}">${inner}</button>`;
  }
  if (action.type === "schedule" && kind === "service") {
    const external = safeExternalUrl(action.destination);
    return external
      ? `<a class="card-hit" href="${escapeHtml(external)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(aria)}">${inner}</a>`
      : `<button class="card-hit schedule-action" type="button" data-service-id="${escapeHtml(item.id)}" data-service-name="${escapeHtml(visibleName)}" aria-label="${escapeHtml(aria)}">${inner}</button>`;
  }
  if (action.type === "externalLink") {
    const external = safeExternalUrl(action.destination);
    return external
      ? `<a class="card-hit" href="${escapeHtml(external)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(aria)}">${inner}</a>`
      : `<button class="card-hit details-action" type="button" data-details aria-haspopup="dialog" aria-label="${escapeHtml(aria)}">${inner}</button>`;
  }
  if (action.type === "none" || !label) {
    return `<button class="card-hit details-action" type="button" data-details aria-haspopup="dialog" aria-label="${escapeHtml(aria)}">${inner}</button>`;
  }
  const contact = customization.organization.contact;
  const destination = action.destination ?? contact.destination ?? catalog.whatsapp ?? "";
  const fallback =
    action.type === "quote"
      ? `Olá! Gostaria de solicitar um orçamento para “${visibleName}”.`
      : action.type === "order" || action.type === "preorder"
        ? `Olá! Gostaria de pedir “${visibleName}”.`
        : `Olá! Vi o item “${visibleName}” no seu catálogo e gostaria de saber mais.`;
  const href = whatsappUrl(destination, action.initialMessage || fallback);
  return href
    ? `<a class="card-hit" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(aria)}">${inner}</a>`
    : `<button class="card-hit details-action" type="button" data-details aria-haspopup="dialog" aria-label="${escapeHtml(aria)}">${inner}</button>`;
}

function placeholderVisual(kind: ItemKind): string {
  return `<div class="item-image item-placeholder is-placeholder" aria-hidden="true"><span class="item-placeholder-mark">${icon(kind === "service" ? "calendar" : "store")}</span></div>`;
}

function metaBit(iconName: string, label: string, extraClass: string): string {
  return `<span class="item-meta-bit ${extraClass}">${icon(iconName)}<span>${escapeHtml(label)}</span></span>`;
}

function listedPriceText(
  price: number | null,
  customization: StorefrontCustomization,
  prefix = "",
): string {
  if (!customization.organization.cards.showPrice) return "";
  if (price !== null) return `${prefix}${formatCatalogPrice(price)}`;
  const cards = customization.organization.cards;
  if (cards.missingPriceBehavior === "hidden") return "";
  return cards.missingPriceBehavior === "custom" && cards.missingPriceText
    ? cards.missingPriceText
    : "Valor sob consulta";
}

function priceMarkup(
  price: number | null,
  customization: StorefrontCustomization,
  prefix = "",
): string {
  const text = listedPriceText(price, customization, prefix);
  if (!text) return "";
  const kind = price === null ? " consultation" : "";
  if (prefix && text.startsWith(prefix)) {
    const amount = text.slice(prefix.length);
    return `<p class="item-price${kind}"><span class="price-from">${escapeHtml(prefix.trim())}</span><span class="price-amount">${escapeHtml(amount)}</span></p>`;
  }
  return `<p class="item-price${kind}"><span class="price-amount">${escapeHtml(text)}</span></p>`;
}

function itemDetailAttrs(params: {
  name: string;
  description: string | null;
  priceLabel: string;
  photoUrl: string | null;
  meta: string;
}): string {
  return `data-detail-name="${escapeHtml(params.name)}" data-detail-description="${escapeHtml(params.description?.trim() ?? "")}" data-detail-price="${escapeHtml(params.priceLabel)}" data-detail-photo="${escapeHtml(params.photoUrl ?? "")}" data-detail-meta="${escapeHtml(params.meta)}"`;
}

function productCard(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  product: PublicCatalogProduct,
  index: number,
  hidden = false,
): string {
  const visibleName = displayCatalogName(product.name);
  const image = product.photoUrl
    ? `<div class="item-image"><img src="${escapeHtml(product.photoUrl)}" alt="" width="720" height="540" ${index < 4 ? 'loading="eager"' : 'loading="lazy"'}></div>`
    : placeholderVisual("product");
  const description =
    customization.organization.cards.showDetails && product.description
      ? `<p class="item-description" data-detail-copy>${escapeHtml(product.description)}</p>`
      : "";
  const available =
    product.variations.length === 0 || product.variations.some((item) => item.inStock);
  const availability = customization.organization.cards.showAvailability
    ? `<p class="item-meta">${metaBit(available ? "check" : "unavailable", available ? "Disponível" : "Indisponível", "item-availability")}</p>`
    : "";
  const category = product.category
    ? `<p class="item-category">${escapeHtml(product.category.toLocaleUpperCase("pt-BR"))}</p>`
    : "";
  const search = normalizeText(
    `${visibleName} ${product.description ?? ""} ${product.category}`,
  );
  const prefix = productHasPriceRange(product) ? "a partir de " : "";
  const details = itemDetailAttrs({
    name: visibleName,
    description: product.description,
    priceLabel: listedPriceText(product.salePrice, customization, prefix),
    photoUrl: product.photoUrl,
    meta: customization.organization.cards.showAvailability
      ? available
        ? "Disponível"
        : "Indisponível"
      : "",
  });
  const inner = `${image}<div class="item-body">${category}<h3>${escapeHtml(visibleName)}</h3>${description}${priceMarkup(product.salePrice, customization, prefix)}${availability}</div>`;
  return `<article class="storefront-card product-card${hidden ? " is-hidden" : ""}" data-kind="products" data-category="${escapeHtml(product.category)}" data-search="${escapeHtml(search)}" data-name="${escapeHtml(normalizeText(visibleName))}" data-price="${product.salePrice}" data-order="${index}" ${hidden ? "hidden " : ""}${details}>${itemHit(catalog, customization, "product", product, inner)}</article>`;
}

function serviceCard(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  service: PublicCatalogService,
  index: number,
  hidden = false,
): string {
  const visibleName = displayCatalogName(service.name);
  const description =
    customization.organization.cards.showDetails && service.description
      ? `<p class="item-description" data-detail-copy>${escapeHtml(service.description)}</p>`
      : "";
  const listed = serviceListedPrice(service);
  const search = normalizeText(
    `${visibleName} ${service.description ?? ""} ${locationLabel(service.locationMode)} serviço`,
  );
  const place = locationLabel(service.locationMode);
  const meta = `<p class="item-meta">${metaBit("clock", `${service.durationMinutes} min`, "item-duration")}${metaBit("pin", place, "item-location")}</p>`;
  const prefix = listed.hasRange ? "a partir de " : "";
  const details = itemDetailAttrs({
    name: visibleName,
    description: service.description,
    priceLabel: listedPriceText(listed.amount, customization, prefix),
    photoUrl: null,
    meta: `${service.durationMinutes} min · ${place}`,
  });
  const inner = `${placeholderVisual("service")}<div class="item-body"><p class="item-category">SERVIÇO</p><h3>${escapeHtml(visibleName)}</h3>${description}${priceMarkup(listed.amount, customization, prefix)}${meta}</div>`;
  return `<article class="storefront-card service-card${hidden ? " is-hidden" : ""}" data-kind="services" data-category="" data-search="${escapeHtml(search)}" data-name="${escapeHtml(normalizeText(visibleName))}" data-price="${listed.amount ?? ""}" data-order="${index}" ${hidden ? "hidden " : ""}${details}>${itemHit(catalog, customization, "service", service, inner)}</article>`;
}

function highlightImage(
  customization: StorefrontCustomization,
  product: PublicCatalogProduct,
): string {
  const featured = customization.hero.featuredItems.find(
    (item) => item.sourceId === product.id,
  );
  const visual = featured
    ? resolveFeaturedVisual(featured, customization.hero.removeBackground)
    : { source: product.photoUrl, cutout: false };
  const source = visual.source ?? product.photoUrl;
  if (!source) return placeholderVisual("product");
  const treatment = visual.cutout ? "featured-cutout" : "featured-photo";
  return `<div class="item-image"><img class="featured featured-1 ${treatment}" src="${escapeHtml(source)}" alt="" width="640" height="640" loading="lazy"></div>`;
}

function highlightCards(
  catalog: PublicCatalog,
  customization: StorefrontCustomization,
  products: PublicCatalogProduct[],
  services: PublicCatalogService[],
  initialType: string,
): string {
  const featuredIds = customization.hero.featuredItems.map((item) => item.sourceId);
  const featuredProducts = featuredIds
    .map((id) => products.find((item) => item.id === id))
    .filter((item): item is PublicCatalogProduct => Boolean(item));
  const highlightProducts = (featuredProducts.length ? featuredProducts : products).slice(
    0,
    6,
  );
  const highlightServices = services.slice(0, 4);
  if (!highlightProducts.length && !highlightServices.length) return "";
  const productCards = highlightProducts
    .map((product, index) => {
      const visibleName = displayCatalogName(product.name);
      const prefix = productHasPriceRange(product) ? "a partir de " : "";
      const inner = `${highlightImage(customization, product)}<div class="item-body"><h3>${escapeHtml(visibleName)}</h3>${priceMarkup(product.salePrice, customization, prefix)}</div>`;
      const hidden = initialType !== "products";
      const search = normalizeText(
        `${visibleName} ${product.description ?? ""} ${product.category}`,
      );
      return `<article class="highlight-card${hidden ? " is-hidden" : ""}" data-kind="products" data-category="${escapeHtml(product.category)}" data-search="${escapeHtml(search)}" ${hidden ? "hidden " : ""}data-order="${index}">${itemHit(catalog, customization, "product", product, inner)}</article>`;
    })
    .join("");
  const serviceCards = highlightServices
    .map((service, index) => {
      const visibleName = displayCatalogName(service.name);
      const listed = serviceListedPrice(service);
      const prefix = listed.hasRange ? "a partir de " : "";
      const inner = `${placeholderVisual("service")}<div class="item-body"><h3>${escapeHtml(visibleName)}</h3>${priceMarkup(listed.amount, customization, prefix)}</div>`;
      const hidden = initialType !== "services";
      const search = normalizeText(`${visibleName} ${service.description ?? ""} serviço`);
      return `<article class="highlight-card${hidden ? " is-hidden" : ""}" data-kind="services" data-category="" data-search="${escapeHtml(search)}" ${hidden ? "hidden " : ""}data-order="${index}">${itemHit(catalog, customization, "service", service, inner)}</article>`;
    })
    .join("");
  const cards = `${productCards}${serviceCards}`;
  if (!cards) return "";
  return `<section class="highlights" aria-labelledby="highlights-title"><header class="highlights-header"><h2 id="highlights-title">Destaques</h2><button class="highlights-next" type="button" aria-label="Ver mais destaques">${icon("chevron")}</button></header><div class="highlights-rail" data-kind-filter="${initialType}">${cards}</div></section>`;
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
  return `<dialog id="booking-dialog" aria-labelledby="booking-title"><form id="booking-form"><header><div><p>Solicitar horário</p><h2 id="booking-title" tabindex="-1"></h2></div><button type="button" class="dialog-close" aria-label="Fechar">${icon("close")}</button></header><input id="booking-service-id" type="hidden"><label>Seu nome<input id="booking-name" required maxlength="120" autocomplete="name"></label><label>WhatsApp<input id="booking-phone" required minlength="8" maxlength="20" inputmode="tel" autocomplete="tel"></label><div class="form-row"><label>Data desejada<input id="booking-date" type="hidden" autocomplete="off"><button type="button" id="booking-date-trigger" class="picker-field is-empty" aria-haspopup="dialog" aria-controls="booking-calendar"><span id="booking-date-label">DD/MM/AAAA</span>${icon("calendar")}</button></label><label>Horário<input id="booking-time" maxlength="5" inputmode="numeric" autocomplete="off" placeholder="Ex: 14:30"></label></div><label>Onde prefere ser atendida(o)?<select id="booking-location"><option value="business">No espaço profissional</option><option value="client">No meu endereço</option><option value="online">Online</option></select></label><label>Observações<textarea id="booking-notes" maxlength="500"></textarea></label><p id="booking-message" role="status" aria-live="polite"></p><button class="dialog-submit" type="submit">Enviar solicitação</button></form></dialog>`;
}

function calendarDialog(): string {
  const week = ["D", "S", "T", "Q", "Q", "S", "S"]
    .map((day) => `<span>${day}</span>`)
    .join("");
  return `<dialog id="booking-calendar" aria-label="Escolher data"><div class="lc-cal"><div class="lc-cal-head"><button type="button" id="cal-prev" aria-label="Anterior">${icon("chevron")}</button><button type="button" id="cal-title"><span id="cal-title-text"></span>${icon("chevron-down")}</button><button type="button" id="cal-next" aria-label="Próximo">${icon("chevron")}</button></div><div id="cal-years" class="lc-cal-years" hidden></div><div id="cal-month"><div class="lc-cal-week" aria-hidden="true">${week}</div><div id="cal-grid" class="lc-cal-grid"></div></div><button type="button" id="cal-close">Fechar</button></div></dialog>`;
}

function detailsDialog(): string {
  return `<dialog id="item-details-dialog" aria-labelledby="item-details-title"><div class="dialog-panel"><header><div><p>Detalhes</p><h2 id="item-details-title" tabindex="-1"></h2></div><button type="button" class="dialog-close" aria-label="Fechar">${icon("close")}</button></header><img id="item-details-photo" alt="" width="720" height="720" hidden><p id="item-details-price" class="item-price"></p><p id="item-details-meta" class="item-meta"></p><p id="item-details-copy"></p></div></dialog>`;
}

function storefrontScript(
  nonce: string,
  initialType: string,
  defaultSort: string,
): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<script${nonceAttr}>(()=>{const root=document.querySelector('[data-storefront]');const cards=[...document.querySelectorAll('.storefront-card')];const highlights=[...document.querySelectorAll('.highlight-card')];const search=document.getElementById('storefront-search');const clear=document.getElementById('search-clear');const sort=document.getElementById('storefront-sort');const status=document.getElementById('results-status');const empty=document.getElementById('no-results');const params=new URLSearchParams(location.search);let type=params.get('tipo')==='servicos'?'services':params.get('tipo')==='produtos'?'products':'${initialType}';let category=params.get('categoria')||'';let timer;const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const norm=v=>v.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('pt-BR');const syncUrl=()=>{try{const next=new URL(location.href);if(next.protocol==='http:'||next.protocol==='https:'){next.searchParams.set('tipo',type==='services'?'servicos':'produtos');search?.value?next.searchParams.set('q',search.value):next.searchParams.delete('q');category?next.searchParams.set('categoria',category):next.searchParams.delete('categoria');sort&&sort.value!=='${defaultSort}'?next.searchParams.set('ordem',sort.value):next.searchParams.delete('ordem');history.replaceState(null,'',next)}}catch{}};const applyVisibility=(card)=>{const showType=card.dataset.kind===type;const showCategory=type==='services'||!category||card.dataset.category===category;const showSearch=!norm((search?.value||'').trim())||card.dataset.search.includes(norm((search?.value||'').trim()));const show=showType&&showCategory&&showSearch;card.hidden=!show;card.classList.toggle('is-hidden',!show);return show};const update=()=>{const grid=document.querySelector('.storefront-grid');const rail=document.querySelector('.highlights-rail');if(root)root.dataset.kindFilter=type;if(grid)grid.dataset.kindFilter=type;if(rail)rail.dataset.kindFilter=type;const query=norm((search?.value||'').trim());let visible=0;cards.forEach(card=>{const showType=card.dataset.kind===type;const showCategory=type==='services'||!category||card.dataset.category===category;const showSearch=!query||card.dataset.search.includes(query);const show=showType&&showCategory&&showSearch;card.hidden=!show;card.classList.toggle('is-hidden',!show);if(show)visible++});let highlightVisible=0;highlights.forEach(card=>{if(applyVisibility(card))highlightVisible++});const highlightsSection=document.querySelector('.highlights');if(highlightsSection)highlightsSection.hidden=highlightVisible===0;const ordered=[...cards].sort((a,b)=>{if(sort?.value==='priceLow')return (Number(a.dataset.price)||Number.MAX_SAFE_INTEGER)-(Number(b.dataset.price)||Number.MAX_SAFE_INTEGER);if(sort?.value==='priceHigh')return (Number(b.dataset.price)||-1)-(Number(a.dataset.price)||-1);if(sort?.value==='name')return a.dataset.name.localeCompare(b.dataset.name,'pt-BR');return Number(a.dataset.order)-Number(b.dataset.order)});ordered.forEach(card=>grid?.append(card));document.querySelectorAll('.type-tabs [data-type]').forEach(button=>{const active=button.dataset.type===type;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});document.querySelectorAll('.category-scroll [data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));if(clear)clear.hidden=!search.value;if(empty)empty.hidden=visible>0;if(status)status.textContent=visible===1?'1 resultado':visible+' resultados';syncUrl()};document.querySelectorAll('.type-tabs [data-type]').forEach(button=>button.addEventListener('click',()=>{type=button.dataset.type;category='';update()}));document.querySelectorAll('.category-scroll [data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;update()}));search?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,300)});clear?.addEventListener('click',()=>{if(search)search.value='';search?.focus();update()});sort?.addEventListener('change',update);if(search)search.value=params.get('q')||'';if(sort)sort.value=params.get('ordem')||'${defaultSort}';const details=document.getElementById('item-details-dialog');document.querySelectorAll('[data-details]').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('article');if(!card)return;if(details){const title=document.getElementById('item-details-title');const copy=document.getElementById('item-details-copy');const price=document.getElementById('item-details-price');const meta=document.getElementById('item-details-meta');const photo=document.getElementById('item-details-photo');title.textContent=card.getAttribute('data-detail-name')||'';const text=card.getAttribute('data-detail-description')||'';copy.textContent=text||'Este item ainda não tem uma descrição.';price.textContent=card.getAttribute('data-detail-price')||'';price.hidden=!price.textContent;meta.textContent=card.getAttribute('data-detail-meta')||'';meta.hidden=!meta.textContent;const src=card.getAttribute('data-detail-photo')||'';if(src){photo.hidden=false;photo.src=src;photo.alt=title.textContent}else{photo.hidden=true;photo.removeAttribute('src')}try{details.showModal()}catch{card.querySelector('[data-detail-copy]')?.classList.add('expanded')}requestAnimationFrame(()=>title.focus());return}const hidden=card.querySelector('[data-detail-copy]');if(!hidden)return;hidden.classList.toggle('expanded')}));details?.querySelector('.dialog-close')?.addEventListener('click',()=>details.close());const booking=document.getElementById('booking-dialog');const bookingForm=document.getElementById('booking-form');document.querySelectorAll('.schedule-action').forEach(button=>button.addEventListener('click',()=>{document.getElementById('booking-service-id').value=button.dataset.serviceId;document.getElementById('booking-title').textContent=button.dataset.serviceName;document.getElementById('booking-message').textContent='';booking.showModal();requestAnimationFrame(()=>document.getElementById('booking-title').focus())}));booking?.querySelector('.dialog-close').addEventListener('click',()=>booking.close());bookingForm?.addEventListener('submit',async event=>{event.preventDefault();const message=document.getElementById('booking-message');if(!document.getElementById('booking-date').value){message.textContent='Escolha a data desejada.';return}const timeVal=document.getElementById('booking-time').value;if(timeVal&&!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(timeVal)){message.textContent='Horário inválido. Use HH:MM, ex.: 14:30.';return}message.textContent='Enviando solicitação…';try{const response=await fetch(location.pathname+'/service-bookings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({serviceId:document.getElementById('booking-service-id').value,clientName:document.getElementById('booking-name').value,phone:document.getElementById('booking-phone').value,desiredDate:document.getElementById('booking-date').value,desiredTime:document.getElementById('booking-time').value||null,locationMode:document.getElementById('booking-location').value,notes:document.getElementById('booking-notes').value||null})});const result=await response.json();if(!response.ok)throw new Error(result.message||result.details?.join(' • ')||'Não foi possível enviar.');bookingForm.reset();message.textContent='Solicitação enviada. O negócio entrará em contato para confirmar.'}catch(error){message.textContent=error.message}});const rail=document.querySelector('.highlights-rail');const next=document.querySelector('.highlights-next');const syncRail=()=>{if(!rail||!next)return;next.hidden=rail.scrollWidth<=rail.clientWidth+12};next?.addEventListener('click',()=>rail?.scrollBy({left:Math.round(rail.clientWidth*.72),behavior:reduce?'auto':'smooth'}));addEventListener('resize',syncRail);const compact=document.querySelector('[data-compact-header]');const sentinel=document.querySelector('[data-hero-sentinel]');document.body.classList.add('js-ready');if(sentinel&&compact&&'IntersectionObserver'in window){const io=new IntersectionObserver(([entry])=>{const scrolled=!entry.isIntersecting;document.body.classList.toggle('is-scrolled',scrolled);compact.setAttribute('aria-hidden',String(!scrolled))},{threshold:0,rootMargin:'-8px 0px 0px 0px'});io.observe(sentinel)}document.querySelector('[data-compact-search]')?.addEventListener('click',event=>{event.preventDefault();search?.focus();search?.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'})});document.querySelectorAll('.item-image img').forEach(img=>{const fail=()=>img.closest('.item-image')?.classList.add('is-failed');img.addEventListener('error',fail,{once:true});if(img.complete&&img.naturalWidth===0)fail()});const floating=document.querySelector('.floating-contact');if(floating){let frame=0;const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const box=floating.getBoundingClientRect();const hits=[...document.querySelectorAll('.card-hit')].some(el=>{const card=el.closest('article');if(card?.hidden)return false;const r=el.getBoundingClientRect();return r.bottom>box.top&&r.top<box.bottom&&r.right>box.left&&r.left<box.right});floating.classList.toggle('obscured',hits)})};addEventListener('scroll',sync,{passive:true});addEventListener('resize',sync);sync()}update();syncRail()})()</script>`;
}

function heroCoverScript(nonce: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<script${nonceAttr}>(()=>{const image=document.querySelector('.hero-cover img');if(!image)return;const fail=()=>{image.closest('.storefront-hero')?.classList.add('cover-failed');console.warn('[storefront] Não foi possível carregar a capa configurada.',image.currentSrc||image.src)};image.addEventListener('error',fail,{once:true});if(image.complete&&image.naturalWidth===0)fail()})()</script>`;
}

function bookingPickerScript(nonce: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<script${nonceAttr}>(()=>{const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];const cal=document.getElementById('booking-calendar');const dateInput=document.getElementById('booking-date');const dateBtn=document.getElementById('booking-date-trigger');const dateLabel=document.getElementById('booking-date-label');const timeInput=document.getElementById('booking-time');const title=document.getElementById('cal-title');const titleText=document.getElementById('cal-title-text');const grid=document.getElementById('cal-grid');const yearsEl=document.getElementById('cal-years');const monthEl=document.getElementById('cal-month');if(!cal||!dateInput||!dateBtn||!grid||!titleText)return;let view=new Date();let pickingYear=false;const pad=n=>String(n).padStart(2,'0');const isoOf=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());const brOf=d=>pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear();const parseIso=v=>{const m=/^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(v);return m?new Date(+m[1],+m[2]-1,+m[3]):null};const syncLabel=()=>{const d=parseIso(dateInput.value);dateLabel.textContent=d?brOf(d):'DD/MM/AAAA';dateBtn.classList.toggle('is-empty',!d)};const render=()=>{const y=view.getFullYear(),m=view.getMonth();title.classList.toggle('is-years',pickingYear);titleText.textContent=pickingYear?(y-(y%12)+' – '+(y-(y%12)+11)):(months[m]+' '+y);if(pickingYear){monthEl.hidden=true;yearsEl.hidden=false;yearsEl.replaceChildren();const start=y-(y%12);for(let i=0;i<12;i++){const year=start+i;const b=document.createElement('button');b.type='button';b.className='lc-cal-year'+(year===y?' is-selected':'');b.textContent=String(year);b.addEventListener('click',()=>{view=new Date(year,m,1);pickingYear=false;render()});yearsEl.append(b)}return}yearsEl.hidden=true;monthEl.hidden=false;grid.replaceChildren();const first=new Date(y,m,1);const start=new Date(first);start.setDate(1-first.getDay());const selected=dateInput.value;const today=isoOf(new Date());for(let i=0;i<42;i++){const day=new Date(start);day.setDate(start.getDate()+i);const id=isoOf(day);const b=document.createElement('button');b.type='button';b.className='lc-cal-day'+(day.getMonth()===m?'':' is-muted')+(selected===id?' is-selected':'')+(today===id?' is-today':'');b.innerHTML='<span>'+day.getDate()+'</span>';b.setAttribute('aria-label',brOf(day));b.addEventListener('click',()=>{dateInput.value=id;syncLabel();cal.close()});grid.append(b)}};dateBtn.addEventListener('click',()=>{const d=parseIso(dateInput.value);view=d?new Date(d.getFullYear(),d.getMonth(),1):new Date();pickingYear=false;render();cal.showModal()});title.addEventListener('click',()=>{pickingYear=!pickingYear;render()});document.getElementById('cal-prev')?.addEventListener('click',()=>{view=pickingYear?new Date(view.getFullYear()-12,view.getMonth(),1):new Date(view.getFullYear(),view.getMonth()-1,1);render()});document.getElementById('cal-next')?.addEventListener('click',()=>{view=pickingYear?new Date(view.getFullYear()+12,view.getMonth(),1):new Date(view.getFullYear(),view.getMonth()+1,1);render()});document.getElementById('cal-close')?.addEventListener('click',()=>cal.close());timeInput?.addEventListener('input',()=>{const d=timeInput.value.replace(/\\D/g,'').slice(0,4);timeInput.value=d.length<=2?d:d.slice(0,2)+':'+d.slice(2)});document.getElementById('booking-form')?.addEventListener('reset',()=>{dateInput.value='';syncLabel()});syncLabel()})()</script>`;
}

export function renderPublishedStorefrontHtml(
  catalog: PublicCatalog,
  section: "all" | "products" | "services" = "all",
  nonce = "",
  preview = false,
): string {
  const customization = catalog.customization ?? defaultStorefrontCustomization(catalog);
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
    ...products.map((item, index) =>
      productCard(catalog, customization, item, index, initialType !== "products"),
    ),
    ...services.map((item, index) =>
      serviceCard(catalog, customization, item, index, initialType !== "services"),
    ),
  ].join("");
  const tabs = mixed
    ? `<div class="type-tabs" role="tablist" aria-label="Tipo de item"><button type="button" role="tab" data-type="products" aria-selected="${initialType === "products" ? "true" : "false"}">${icon("store")} Produtos <span>${products.length}</span></button><button type="button" role="tab" data-type="services" aria-selected="${initialType === "services" ? "true" : "false"}">${icon("calendar")} Serviços <span>${services.length}</span></button></div>`
    : "";
  const categoryNav =
    customization.organization.discovery.showCategories && categories.length
      ? `<div class="category-rail"><nav class="category-scroll" aria-label="Categorias"><button type="button" data-category="" aria-pressed="true">Todos</button>${categories.map((category) => `<button type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`).join("")}</nav></div>`
      : "";
  const search = `<label class="search-field">${icon("search")}<span class="visually-hidden">Buscar no catálogo</span><input id="storefront-search" type="search" placeholder="Buscar no catálogo" autocomplete="off"><button id="search-clear" type="button" aria-label="Limpar busca" hidden>${icon("close")}</button></label>`;
  const sort = customization.organization.discovery.allowSorting
    ? `<label class="sort-field"><span>${icon("sort")} Ordenar</span><select id="storefront-sort" aria-label="Ordenar itens"><option value="featured">Destaques primeiro</option><option value="name">Nome</option><option value="priceLow">Menor preço</option><option value="priceHigh">Maior preço</option></select></label>`
    : `<select id="storefront-sort" hidden><option value="${defaultSort}">${defaultSort}</option></select>`;
  const highlights = highlightCards(
    catalog,
    customization,
    products,
    services,
    initialType,
  );
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
      floating = `<a class="floating-contact" href="${escapeHtml(href)}"${contact.channel === "external" || contact.channel === "whatsapp" ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="${escapeHtml(contact.defaultActionLabel)}">${icon(contact.channel === "whatsapp" ? "whatsapp" : "store")}<span class="floating-label">Contato</span></a>`;
    }
  }
  const style = customization.organization.cards.style;
  const hero = customization.hero.style;
  const nonceAttribute = nonce ? ` nonce="${nonce}"` : "";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${imageMeta}<meta name="robots" content="${preview ? "noindex,nofollow" : "index,follow"}"><meta name="theme-color" content="${theme.primary}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><script type="application/ld+json"${nonceAttribute}>${structuredData(catalog, customization)}</script><style>${storefrontStyles(theme)}</style></head><body class="cards-${style} hero-mode-${hero}" data-storefront data-kind-filter="${initialType}"><a class="skip-link" href="#storefront-list">Ir para o catálogo</a>${compactHeader(catalog, customization)}<div class="storefront-canvas">${renderHero(catalog, customization)}<main id="storefront-list" class="storefront-shell"><section class="discovery" aria-label="Buscar e filtrar"><div class="search-row">${search}</div>${categoryNav}</section>${tabs}${emptyCatalog}${highlights}${cards ? `<section aria-labelledby="listing-title"><header class="listing-header"><div><h2 id="listing-title">Escolha o que deseja</h2><p>Produzido com carinho, escolhido por você.</p></div>${sort}</header><p id="results-status" class="results-status" role="status" aria-live="polite"></p><div id="no-results" class="no-results" hidden><h3>Nenhum resultado encontrado</h3><p>Tente limpar a busca ou remover os filtros.</p></div><div class="storefront-grid" data-kind-filter="${initialType}">${cards}</div></section>` : ""}</main></div>${services.length ? bookingDialog() + calendarDialog() : ""}${cards ? detailsDialog() : ""}${floating}<footer>Catálogo de ${escapeHtml(customization.identity.displayName)}</footer>${heroCoverScript(nonce)}${services.length ? bookingPickerScript(nonce) : ""}${cards ? storefrontScript(nonce, initialType, defaultSort) : ""}</body></html>`;
}
