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
export const STOREFRONT_ACTION_LABEL_LIMIT = 20;
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
  id: "identity" | "hero" | "content" | "actions" | "contact" | "slug";
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

export function createStorefrontCustomization(
  settings: CatalogSettings,
  businessName: string,
  counts: Readonly<{ products: number; services: number }> = {
    products: 0,
    services: 0,
  },
): StorefrontCustomization {
  if (settings.customization) {
    return {
      ...settings.customization,
      publication: {
        ...settings.customization.publication,
        slug: settings.slug,
        status: settings.enabled
          ? "published"
          : settings.customization.publication.status,
      },
    };
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
      primaryColor: STOREFRONT_BRAND_COLORS.primary,
      actionColor: legacyAccent(settings),
      backgroundColor: STOREFRONT_BRAND_COLORS.background,
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
        showProducts: offeringMode !== "services",
        showServices: offeringMode !== "products",
        showCategories: counts.products > 0,
        sectionOrder: ["products", "services", "categories"],
        initialSection: "all",
      },
      discovery: {
        showSearch: true,
        showCategories: counts.products > 0,
        allowFilters: true,
        allowSorting: true,
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
        mode: "perItem",
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

export function normalizeStorefrontCustomization(
  draft: StorefrontCustomization,
  publishing = false,
): StorefrontCustomization {
  const now = new Date().toISOString();
  return {
    ...draft,
    identity: {
      ...draft.identity,
      displayName: draft.identity.displayName.trim(),
      primaryColor: draft.identity.primaryColor.toUpperCase(),
      actionColor: draft.identity.actionColor.toUpperCase(),
      backgroundColor: draft.identity.backgroundColor.toUpperCase(),
    },
    hero: {
      ...draft.hero,
      introduction: draft.hero.introduction.trim(),
      shortSignature: draft.hero.shortSignature.trim(),
      promotionalText: draft.hero.promotionalText.trim(),
      coverFocal: {
        x: Math.min(1, Math.max(0, draft.hero.coverFocal?.x ?? 0.5)),
        y: Math.min(1, Math.max(0, draft.hero.coverFocal?.y ?? 0.5)),
        scale: Math.min(2.5, Math.max(1, draft.hero.coverFocal?.scale ?? 1)),
      },
      featuredItems: draft.hero.featuredItems.slice(0, 3).map((item) => ({
        ...item,
        altText: item.altText.trim(),
        transforms: item.transforms.map(normalizeFeaturedItemTransform),
      })),
      quickInfo: draft.hero.quickInfo
        .slice(0, 3)
        .map((item, order) => ({ ...item, label: item.label.trim(), order })),
    },
    publication: {
      slug: draft.publication.slug.trim().toLowerCase(),
      status: publishing ? "published" : draft.publication.status,
      publishedAt: publishing ? now : draft.publication.publishedAt,
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
  (["primaryColor", "actionColor", "backgroundColor"] as const).forEach((key) => {
    if (!isValidCatalogColor(draft.identity[key]))
      errors[key] = "Use uma cor hexadecimal válida.";
  });
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
  if (draft.hero.action.type !== "none" && !draft.hero.action.label.trim())
    errors.heroActionLabel = "Informe o texto do botão.";
  if (
    draft.hero.action.type === "externalLink" &&
    !/^https?:\/\//i.test(draft.hero.action.destination ?? "")
  ) {
    errors.heroActionDestination = "Informe um link começando com http:// ou https://.";
  }
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
  if (
    !draft.organization.content.showProducts &&
    !draft.organization.content.showServices
  )
    errors.visibleContent = "Mantenha produtos ou serviços visíveis.";
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

function isStorefrontActionsReady(
  draft: StorefrontCustomization,
  whatsappError?: string,
): boolean {
  if (draft.organization.actions.mode === "hidden") return true;
  if (whatsappError) return false;
  if (draft.organization.actions.mode !== "perItem") return true;
  return Object.keys(draft.organization.actions.itemOverrides).length > 0;
}

export function buildStorefrontChecklist(
  draft: StorefrontCustomization,
  counts: Readonly<{ products: number; services: number }>,
  slugAvailable: boolean,
): StorefrontChecklistItem[] {
  const errors = validateStorefrontCustomization(draft);
  const visibleItems =
    (draft.organization.content.showProducts ? counts.products : 0) +
    (draft.organization.content.showServices ? counts.services : 0);
  return [
    {
      id: "identity",
      label: "Identidade configurada",
      valid:
        !errors.displayName &&
        !errors.primaryColor &&
        !errors.actionColor &&
        !errors.backgroundColor,
      step: "identity",
    },
    {
      id: "hero",
      label: "Topo da vitrine completo",
      valid:
        !errors.introduction && !errors.heroActionLabel && !errors.heroActionDestination,
      step: "hero",
    },
    {
      id: "content",
      label: `${visibleItems} ${visibleItems === 1 ? "item visível" : "itens visíveis"}`,
      valid: visibleItems > 0 && !errors.visibleContent,
      step: "organization",
      section: "content",
    },
    {
      id: "actions",
      label: `${Object.keys(draft.organization.actions.itemOverrides).length} ações personalizadas`,
      valid: isStorefrontActionsReady(draft, errors.whatsapp),
      step: "organization",
      section: "cards-actions",
    },
    {
      id: "contact",
      label:
        draft.organization.contact.channel === "whatsapp"
          ? "WhatsApp conectado"
          : "Canal conectado",
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
