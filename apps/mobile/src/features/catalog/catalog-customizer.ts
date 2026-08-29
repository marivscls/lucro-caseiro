import {
  CATALOG_HEX_COLOR_REGEX,
  CATALOG_SLUG_REGEX,
  type CatalogItemAction,
  type CatalogSettings,
  type FeaturedItemTransform,
  type StorefrontCustomization,
} from "@lucro-caseiro/contracts";

import { isValidBrazilPhone, maskPhoneBR } from "../../shared/utils/phone";

export const STOREFRONT_DISPLAY_NAME_LIMIT = 60;
export const STOREFRONT_INTRODUCTION_LIMIT = 120;
export const STOREFRONT_SIGNATURE_LIMIT = 40;
export const STOREFRONT_QUICK_INFO_LIMIT = 48;
export const STOREFRONT_ACTION_LABEL_LIMIT = 20;
export const STOREFRONT_CARD_ACTION_LABEL_LIMIT = 24;
export const STOREFRONT_PROMO_LIMIT = 60;
export const CATALOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type StorefrontEditorStep = "identity" | "hero" | "organization";
export type StorefrontOrganizationSection = "content" | "cards-actions" | "publication";
export type EditorStatus =
  | "loading"
  | "saved"
  | "dirty"
  | "saving"
  | "publishing"
  | "error";

type CatalogImageMetadata = Readonly<{
  mimeType?: string | null;
  fileName?: string | null;
  uri: string;
  fileSize: number;
}>;

export type StorefrontValidationErrors = Record<string, string>;

export type StorefrontChecklistItem = Readonly<{
  id: "identity" | "hero" | "contact" | "slug";
  label: string;
  valid: boolean;
  step: StorefrontEditorStep;
  section?: StorefrontOrganizationSection;
}>;

const ACCENT_TO_HEX: Record<string, string> = {
  brown: "#4A2332",
  rose: "#B65F72",
  green: "#3E8156",
  lavender: "#7558AD",
  blue: "#3479A8",
  amber: "#B98924",
};

export const STOREFRONT_BRAND_COLORS = {
  primary: "#4A2332",
  action: "#B65F72",
  background: "#FAF8F6",
  text: "#6D6266",
} as const;

/** Remove prefixos técnicos internos (`[massa]`, `[tag]`) do nome exibido. */
export function displayCatalogItemName(rawName: string): string {
  const trimmedName = rawName.trim();
  let visibleName = trimmedName;
  while (visibleName.startsWith("[")) {
    const prefixEnd = visibleName.indexOf("]");
    if (prefixEnd < 0) break;
    visibleName = visibleName.slice(prefixEnd + 1).trimStart();
  }
  return visibleName || trimmedName;
}

export function formatCatalogWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "");
  const national =
    (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
      ? digits.slice(2)
      : digits;
  return maskPhoneBR(national);
}

export function isValidCatalogColor(value: string): boolean {
  return CATALOG_HEX_COLOR_REGEX.test(value);
}

export function createFeaturedItemTransforms(
  featuredItemId: string,
): FeaturedItemTransform[] {
  return (["smallMobile", "mobile", "tablet", "desktop"] as const).map(
    (breakpoint, layer) => ({
      featuredItemId,
      breakpoint,
      x: 0.5,
      y: 0.5,
      scale: 1,
      layer,
    }),
  );
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

export function normalizeFeaturedItemTransform(
  transform: FeaturedItemTransform,
): FeaturedItemTransform {
  return {
    ...transform,
    x: Math.min(1, Math.max(0, transform.x)),
    y: Math.min(1, Math.max(0, transform.y)),
    scale: Math.min(2.5, Math.max(0.5, transform.scale)),
    layer: Math.min(20, Math.max(0, Math.round(transform.layer))),
  };
}

export function coverFocalObjectPosition(
  focal: Readonly<{ x: number; y: number }>,
): string {
  return `${focal.x * 100}% ${focal.y * 100}%`;
}

export function normalizeHeroContactAction(
  action: StorefrontCustomization["hero"]["action"],
  whatsapp: string,
): StorefrontCustomization["hero"]["action"] {
  const label = action.label.trim();
  if (!label) return { type: "none", label: "" };
  const destination = whatsapp || action.destination;
  return {
    type: "whatsapp",
    label,
    ...(destination ? { destination } : {}),
  };
}

export function coverFocalNativeTranslate(
  focal: Readonly<{ x: number; y: number }>,
  frame: Readonly<{ width: number; height: number }>,
): Readonly<{ translateX: number; translateY: number }> {
  return {
    translateX: (0.5 - focal.x) * frame.width * 0.5,
    translateY: (0.5 - focal.y) * frame.height * 0.5,
  };
}

export function resolveCatalogItemAction(
  itemKey: string,
  kind: "product" | "service",
  customization: StorefrontCustomization,
): CatalogItemAction {
  const actions = customization.organization.actions;
  if (actions.mode === "hidden") return { type: "none" };
  const override = actions.itemOverrides[itemKey];
  if (override && override.type !== "inherit") return override;
  if (actions.mode === "perItem" && override?.type === "inherit") {
    return kind === "product" ? actions.productDefault : actions.serviceDefault;
  }
  return kind === "product" ? actions.productDefault : actions.serviceDefault;
}

function legacyAccent(settings: CatalogSettings): string {
  if (settings.accentColor?.startsWith("#")) return settings.accentColor;
  return ACCENT_TO_HEX[settings.accentColor ?? ""] ?? STOREFRONT_BRAND_COLORS.action;
}

function legacyHex(value: string | null | undefined, fallback: string): string {
  return value && isValidCatalogColor(value) ? value.toUpperCase() : fallback;
}

export function createStorefrontCustomization(
  settings: CatalogSettings,
  businessName: string,
  counts: Readonly<{ products: number; services: number }> = {
    products: 0,
    services: 0,
  },
): StorefrontCustomization {
  if (settings.customization) {
    const customization = {
      ...settings.customization,
      publication: {
        ...settings.customization.publication,
        slug: settings.slug,
        status: settings.enabled
          ? "published"
          : settings.customization.publication.status,
      },
    };
    return applySimpleStorefrontPresentation(
      {
        ...customization,
        hero: {
          ...customization.hero,
          action: normalizeHeroContactAction(
            customization.hero.action,
            customization.organization.contact.destination,
          ),
        },
      },
      counts,
    );
  }

  let offeringMode: StorefrontCustomization["identity"]["offeringMode"] = "both";
  if (counts.products > 0 && counts.services === 0) offeringMode = "products";
  if (counts.services > 0 && counts.products === 0) offeringMode = "services";
  const introduction = settings.tagline ?? settings.serviceTagline ?? "";
  const promotionalText = settings.promoBanner ?? settings.servicePromoBanner ?? "";

  return {
    version: 1,
    identity: {
      displayName:
        businessName.trim().slice(0, STOREFRONT_DISPLAY_NAME_LIMIT) || "Meu negócio",
      logoUrl: settings.logoUrl,
      offeringMode,
      primaryColor: legacyHex(settings.titleColor, STOREFRONT_BRAND_COLORS.primary),
      actionColor: legacyAccent(settings),
      backgroundColor: STOREFRONT_BRAND_COLORS.background,
      textColor: legacyHex(settings.descriptionColor, STOREFRONT_BRAND_COLORS.text),
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
        type: settings.whatsapp ? "whatsapp" : "none",
        label: settings.whatsapp ? "Entrar em contato" : "",
        ...(settings.whatsapp ? { destination: settings.whatsapp } : {}),
      },
      promotionalText,
      showPromotionalBar: Boolean(
        promotionalText &&
        (settings.promoBannerEnabled || settings.servicePromoBannerEnabled),
      ),
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
        showSearch: false,
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
          ...(settings.whatsapp ? { destination: settings.whatsapp } : {}),
        },
        serviceDefault: {
          type: "schedule",
          label: "Agendar",
          channel: "whatsapp",
          ...(settings.whatsapp ? { destination: settings.whatsapp } : {}),
        },
        itemOverrides: {},
      },
      contact: {
        floatingEnabled: true,
        channel: "whatsapp",
        destination: settings.whatsapp ? formatCatalogWhatsapp(settings.whatsapp) : "",
        defaultActionLabel: "Entrar em contato",
        keepVisibleOnScroll: true,
        initialMessage: "Olá! Vim pelo seu catálogo.",
      },
    },
    publication: {
      slug: settings.slug,
      status: settings.enabled ? "published" : "draft",
      publishedAt: null,
    },
  };
}

function normalizeHeroStyle(
  style: StorefrontCustomization["hero"]["style"],
): StorefrontCustomization["hero"]["style"] {
  if (style === "editorial" || style === "compact") return style;
  return "classic";
}

function preservedQuickInfo(
  draft: StorefrontCustomization,
): StorefrontCustomization["hero"]["quickInfo"] {
  return draft.hero.quickInfo
    .map((item) => ({ ...item, label: item.label.trim() }))
    .filter((item) => item.label)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      order: index,
      enabled: item.enabled !== false,
    }));
}

function offeringModeFromCounts(
  products: number,
  services: number,
): StorefrontCustomization["identity"]["offeringMode"] {
  if (products > 0 && services === 0) return "products";
  if (services > 0 && products === 0) return "services";
  return "both";
}

function preservedCardActions(
  draft: StorefrontCustomization,
  whatsapp: string,
): StorefrontCustomization["organization"]["actions"] {
  const productLabel = draft.organization.actions.productDefault.label?.trim() || "Pedir";
  const serviceLabel =
    draft.organization.actions.serviceDefault.label?.trim() || "Agendar";
  const itemOverrides = Object.fromEntries(
    Object.entries(draft.organization.actions.itemOverrides).flatMap(([id, action]) => {
      const label = action.label?.trim();
      if (!label) return [];
      const isService = id.startsWith("service:");
      return [
        [
          id,
          {
            type: isService ? ("schedule" as const) : ("order" as const),
            label,
            channel: "whatsapp" as const,
            ...(whatsapp ? { destination: whatsapp } : {}),
          },
        ],
      ];
    }),
  );
  return {
    mode: "default",
    productDefault: {
      type: "order",
      label: productLabel,
      channel: "whatsapp",
      ...(whatsapp ? { destination: whatsapp } : {}),
    },
    serviceDefault: {
      type: "schedule",
      label: serviceLabel,
      channel: "whatsapp",
      ...(whatsapp ? { destination: whatsapp } : {}),
    },
    itemOverrides,
  };
}

export function applySimpleStorefrontPresentation(
  draft: StorefrontCustomization,
  counts?: Readonly<{ products: number; services: number }>,
): StorefrontCustomization {
  const promotionalText = draft.hero.promotionalText.trim();
  const whatsapp = draft.organization.contact.destination;
  const offeringMode = counts
    ? offeringModeFromCounts(counts.products, counts.services)
    : draft.identity.offeringMode;
  return {
    ...draft,
    identity: {
      ...draft.identity,
      offeringMode,
      primaryColor: legacyHex(
        draft.identity.primaryColor,
        STOREFRONT_BRAND_COLORS.primary,
      ),
      backgroundColor: STOREFRONT_BRAND_COLORS.background,
      textColor: legacyHex(draft.identity.textColor, STOREFRONT_BRAND_COLORS.text),
    },
    hero: {
      ...draft.hero,
      style: normalizeHeroStyle(draft.hero.style),
      shortSignature: draft.hero.shortSignature.trim(),
      smallScreenAlternativeUrl: null,
      promotionalText,
      showPromotionalBar: Boolean(promotionalText),
      quickInfo: preservedQuickInfo(draft),
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
        showSearch: false,
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
      actions: preservedCardActions(draft, whatsapp),
      contact: {
        ...draft.organization.contact,
        floatingEnabled: true,
        channel: "whatsapp",
        keepVisibleOnScroll: true,
        defaultActionLabel:
          draft.organization.contact.defaultActionLabel.trim() || "Entrar em contato",
      },
    },
  };
}

export function normalizeStorefrontCustomization(
  draft: StorefrontCustomization,
  publishing = false,
  counts?: Readonly<{ products: number; services: number }>,
): StorefrontCustomization {
  const simplified = applySimpleStorefrontPresentation(draft, counts);
  const now = new Date().toISOString();
  return {
    ...simplified,
    identity: {
      ...simplified.identity,
      displayName: simplified.identity.displayName.trim(),
      primaryColor: simplified.identity.primaryColor.toUpperCase(),
      actionColor: simplified.identity.actionColor.toUpperCase(),
      backgroundColor: simplified.identity.backgroundColor.toUpperCase(),
      textColor: simplified.identity.textColor.toUpperCase(),
    },
    hero: {
      ...simplified.hero,
      introduction: simplified.hero.introduction.trim(),
      shortSignature: simplified.hero.shortSignature.trim(),
      promotionalText: simplified.hero.promotionalText.trim(),
      action: normalizeHeroContactAction(
        simplified.hero.action,
        simplified.organization.contact.destination,
      ),
      coverFocal: {
        x: Math.min(1, Math.max(0, simplified.hero.coverFocal?.x ?? 0.5)),
        y: Math.min(1, Math.max(0, simplified.hero.coverFocal?.y ?? 0.5)),
        scale: Math.min(2.5, Math.max(1, simplified.hero.coverFocal?.scale ?? 1)),
      },
      featuredItems: simplified.hero.featuredItems.slice(0, 3).map((item) => ({
        ...item,
        altText: item.altText.trim(),
        transforms: item.transforms.map(normalizeFeaturedItemTransform),
      })),
      quickInfo: preservedQuickInfo(simplified),
    },
    publication: {
      slug: simplified.publication.slug.trim().toLowerCase(),
      status: publishing ? "published" : simplified.publication.status,
      publishedAt: publishing ? now : simplified.publication.publishedAt,
    },
  };
}

export function validateStorefrontCustomization(
  draft: StorefrontCustomization,
): StorefrontValidationErrors {
  const errors: StorefrontValidationErrors = {};
  if (!draft.identity.displayName.trim()) errors.displayName = "Informe o nome exibido.";
  if (draft.identity.displayName.length > STOREFRONT_DISPLAY_NAME_LIMIT)
    errors.displayName = `Use até ${STOREFRONT_DISPLAY_NAME_LIMIT} caracteres.`;
  if (!isValidCatalogColor(draft.identity.primaryColor))
    errors.primaryColor = "Use uma cor hexadecimal válida.";
  if (!isValidCatalogColor(draft.identity.textColor))
    errors.textColor = "Use uma cor hexadecimal válida.";
  if (!isValidCatalogColor(draft.identity.actionColor))
    errors.actionColor = "Use uma cor hexadecimal válida.";
  if (draft.hero.featuredItems.length > 3)
    errors.featuredItems = "Selecione no máximo três destaques.";
  if (draft.hero.introduction.length > STOREFRONT_INTRODUCTION_LIMIT)
    errors.introduction = `Use até ${STOREFRONT_INTRODUCTION_LIMIT} caracteres.`;
  if (draft.hero.shortSignature.length > STOREFRONT_SIGNATURE_LIMIT)
    errors.shortSignature = `Use até ${STOREFRONT_SIGNATURE_LIMIT} caracteres.`;
  if (draft.hero.action.label.length > STOREFRONT_ACTION_LABEL_LIMIT)
    errors.heroActionLabel = `Use até ${STOREFRONT_ACTION_LABEL_LIMIT} caracteres.`;
  if (draft.hero.promotionalText.length > STOREFRONT_PROMO_LIMIT)
    errors.promotionalText = `Use até ${STOREFRONT_PROMO_LIMIT} caracteres.`;
  const whatsappRequired =
    draft.organization.contact.channel === "whatsapp" ||
    draft.hero.action.type === "whatsapp" ||
    [
      draft.organization.actions.productDefault,
      draft.organization.actions.serviceDefault,
      ...Object.values(draft.organization.actions.itemOverrides),
    ].some((action) => action.channel === "whatsapp" && action.type !== "none");
  if (whatsappRequired && !isValidBrazilPhone(draft.organization.contact.destination)) {
    errors.whatsapp = "Informe DDD e número para usar ações do WhatsApp.";
  }
  if (!CATALOG_SLUG_REGEX.test(draft.publication.slug.trim().toLowerCase())) {
    errors.slug = "Use letras minúsculas, números e hífens, sem hífen nas pontas.";
  }
  return errors;
}

export function hasStorefrontErrors(errors: StorefrontValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function isStorefrontDraftDirty(
  draft: StorefrontCustomization,
  saved: StorefrontCustomization,
): boolean {
  return JSON.stringify(draft) !== JSON.stringify(saved);
}

export function buildStorefrontChecklist(
  draft: StorefrontCustomization,
  _counts: Readonly<{ products: number; services: number }>,
  slugAvailable: boolean,
): StorefrontChecklistItem[] {
  const errors = validateStorefrontCustomization(draft);
  return [
    {
      id: "identity",
      label: "Identidade configurada",
      valid:
        !errors.displayName &&
        !errors.primaryColor &&
        !errors.textColor &&
        !errors.actionColor,
      step: "identity",
    },
    {
      id: "hero",
      label: "Topo da vitrine completo",
      valid: !errors.introduction && !errors.heroActionLabel,
      step: "hero",
    },
    {
      id: "contact",
      label: "WhatsApp conectado",
      valid: !errors.whatsapp,
      step: "organization",
      section: "publication",
    },
    {
      id: "slug",
      label: "Endereço disponível",
      valid: !errors.slug && slugAvailable,
      step: "organization",
      section: "publication",
    },
  ];
}

export function catalogImageValidationError(image: CatalogImageMetadata): string | null {
  const mimeType = image.mimeType?.toLowerCase();
  const sourceName = image.fileName || image.uri;
  const allowedMime = ["image/jpeg", "image/jpg", "image/png"].includes(mimeType ?? "");
  const allowedExtension = /\.(?:jpe?g|png)(?:$|[?#])/i.test(sourceName);
  if (mimeType ? !allowedMime : !allowedExtension) return "Use uma imagem PNG ou JPG.";
  if (image.fileSize > CATALOG_IMAGE_MAX_BYTES)
    return "A imagem deve ter no máximo 5 MB.";
  return null;
}

export function isLocalCatalogImage(uri: string | null): uri is string {
  return Boolean(uri && !/^https?:\/\//i.test(uri));
}
