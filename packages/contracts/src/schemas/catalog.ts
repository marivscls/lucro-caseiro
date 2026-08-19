import { z } from "zod";

import {
  ServiceAddOnInputDto,
  ServiceLocationMode,
  ServicePackageInputDto,
  ServiceVariationInputDto,
} from "./operations";

// Slug da URL publica do catalogo: minusculas, numeros e hifens.
export const CATALOG_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

// Cor do catálogo (personalização do Essencial): preset nomeado OU hex livre (#rrggbb).
// A chave/hex e persistida; as paletas concretas ficam no dominio da API.
export const CATALOG_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const CatalogHexColor = z.string().regex(CATALOG_HEX_COLOR_REGEX);

export const CatalogAccentPreset = z.enum([
  "brown",
  "rose",
  "green",
  "lavender",
  "blue",
  "amber",
]);

export const CatalogAccentColor = z.union([CatalogAccentPreset, CatalogHexColor]);
export type CatalogAccentColorValue = z.infer<typeof CatalogAccentColor>;

// Pattern decorativo sobre a cor do hero (personalização do Essencial).
export const CatalogPattern = z.enum(["dots", "bubbles", "grid", "stripes"]);
export type CatalogPatternKey = z.infer<typeof CatalogPattern>;

export const StorefrontOfferingMode = z.enum(["products", "services", "both"]);
export const StorefrontHeroStyle = z.enum(["classic", "editorial", "compact"]);
export const StorefrontFeaturedItemKind = z.enum(["product", "service", "media"]);
export const StorefrontBreakpoint = z.enum([
  "smallMobile",
  "mobile",
  "tablet",
  "desktop",
]);
export const StorefrontHeroActionType = z.enum([
  "whatsapp",
  "quote",
  "schedule",
  "externalLink",
  "none",
]);
export const CatalogItemActionType = z.enum([
  "inherit",
  "order",
  "preorder",
  "quote",
  "schedule",
  "details",
  "contact",
  "externalLink",
  "none",
]);

export const FeaturedItemTransformDto = z.object({
  featuredItemId: z.string().min(1).max(120),
  breakpoint: StorefrontBreakpoint,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().min(0.5).max(2.5),
  layer: z.number().int().min(0).max(20),
});
export type FeaturedItemTransform = z.infer<typeof FeaturedItemTransformDto>;

export const CatalogItemActionDto = z.object({
  type: CatalogItemActionType,
  label: z.string().trim().max(24).optional(),
  channel: z.enum(["whatsapp", "internal", "external"]).optional(),
  destination: z.string().trim().max(500).optional(),
  initialMessage: z.string().trim().max(300).optional(),
});
export type CatalogItemAction = z.infer<typeof CatalogItemActionDto>;

const StorefrontFeaturedItemDto = z.object({
  id: z.string().min(1).max(120),
  kind: StorefrontFeaturedItemKind,
  sourceId: z.string().max(120).optional(),
  // Serviços legados ainda não possuem mídia própria; null preserva a seleção
  // sem inventar imagem e o renderer usa um estado neutro acessível.
  assetUrl: z.string().url().nullable(),
  // Versão processada com transparência. Quando presente, é a fonte preferencial
  // do hero público; assetUrl continua sendo o original e o fallback editorial.
  processedUrl: z.string().url().nullable().optional(),
  altText: z.string().trim().min(1).max(160),
  transforms: z.array(FeaturedItemTransformDto).max(4),
});

export const StorefrontCustomizationDto = z.object({
  version: z.literal(1),
  identity: z.object({
    displayName: z.string().trim().min(1).max(60),
    logoUrl: z.string().url().nullable(),
    offeringMode: StorefrontOfferingMode,
    primaryColor: CatalogHexColor,
    actionColor: CatalogHexColor,
    backgroundColor: CatalogHexColor,
  }),
  hero: z.object({
    style: StorefrontHeroStyle,
    featuredItems: z.array(StorefrontFeaturedItemDto).max(3),
    removeBackground: z.boolean(),
    coverFocal: z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        scale: z.number().min(1).max(2.5),
      })
      .optional(),
    smallScreenAlternativeUrl: z.string().url().nullable(),
    introduction: z.string().trim().max(120),
    shortSignature: z.string().trim().max(40),
    action: z.object({
      type: StorefrontHeroActionType,
      label: z.string().trim().max(20),
      destination: z.string().trim().max(500).optional(),
    }),
    promotionalText: z.string().trim().max(60),
    showPromotionalBar: z.boolean(),
    quickInfo: z
      .array(
        z.object({
          id: z.string().min(1).max(120),
          icon: z.enum(["sparkles", "delivery", "whatsapp", "calendar", "store"]),
          label: z.string().trim().min(1).max(48),
          order: z.number().int().min(0).max(2),
          enabled: z.boolean(),
        }),
      )
      .max(3),
  }),
  organization: z.object({
    content: z.object({
      showProducts: z.boolean(),
      showServices: z.boolean(),
      showCategories: z.boolean(),
      sectionOrder: z.array(z.enum(["products", "services", "categories"])).max(3),
      initialSection: z.enum(["all", "products", "services"]),
    }),
    discovery: z.object({
      showSearch: z.boolean(),
      showCategories: z.boolean(),
      allowFilters: z.boolean(),
      allowSorting: z.boolean(),
      defaultSort: z.enum(["featured", "name", "priceLow", "priceHigh"]),
      visibleCategoryIds: z.array(z.string().max(100)).max(100),
      categoryOrder: z.array(z.string().max(100)).max(100),
    }),
    cards: z.object({
      style: z.enum(["editorial", "compact"]),
      showPrice: z.boolean(),
      showDetails: z.boolean(),
      showAvailability: z.boolean(),
      missingPriceBehavior: z.enum(["consult", "hidden", "custom"]),
      missingPriceText: z.string().trim().max(30),
    }),
    actions: z.object({
      mode: z.enum(["perItem", "default", "hidden"]),
      productDefault: CatalogItemActionDto,
      serviceDefault: CatalogItemActionDto,
      itemOverrides: z.record(z.string(), CatalogItemActionDto),
    }),
    contact: z.object({
      floatingEnabled: z.boolean(),
      channel: z.enum(["whatsapp", "phone", "email", "external"]),
      destination: z.string().trim().max(500),
      defaultActionLabel: z.string().trim().max(24),
      keepVisibleOnScroll: z.boolean(),
      initialMessage: z.string().trim().max(300),
    }),
  }),
  publication: z.object({
    slug: z.string().regex(CATALOG_SLUG_REGEX),
    status: z.enum(["draft", "published"]),
    publishedAt: z.string().datetime().nullable(),
  }),
});
export type StorefrontCustomization = z.infer<typeof StorefrontCustomizationDto>;

export const CatalogSettingsDto = z.object({
  brandId: z.string(),
  slug: z.string(),
  enabled: z.boolean(),
  whatsapp: z.string().nullable(),
  coverUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  accentColor: CatalogAccentColor.nullable(),
  titleColor: CatalogHexColor.nullable(),
  descriptionColor: CatalogHexColor.nullable(),
  pattern: CatalogPattern.nullable(),
  tagline: z.string().nullable(),
  // Faixa promocional opcional no topo do catalogo (ex.: "Frete gratis hoje").
  promoBanner: z.string().nullable(),
  promoBannerEnabled: z.boolean(),
  serviceCoverUrl: z.string().nullable(),
  serviceTitleColor: CatalogHexColor.nullable(),
  serviceDescriptionColor: CatalogHexColor.nullable(),
  serviceTagline: z.string().nullable(),
  servicePromoBanner: z.string().nullable(),
  servicePromoBannerEnabled: z.boolean(),
  customization: StorefrontCustomizationDto.nullable(),
  // Opcional na leitura para clientes que ainda falam com uma API anterior.
  publishedCustomization: StorefrontCustomizationDto.nullable().optional(),
  updatedAt: z.string().datetime(),
});

export type CatalogSettings = z.infer<typeof CatalogSettingsDto>;

export const UpdateCatalogSettingsDto = z.object({
  slug: z.string().regex(CATALOG_SLUG_REGEX).optional(),
  enabled: z.boolean().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
  // Personalizacao (Premium — gate no backend):
  coverUrl: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  accentColor: CatalogAccentColor.nullable().optional(),
  titleColor: CatalogHexColor.nullable().optional(),
  descriptionColor: CatalogHexColor.nullable().optional(),
  pattern: CatalogPattern.nullable().optional(),
  tagline: z.string().max(120).nullable().optional(),
  promoBanner: z.string().max(60).nullable().optional(),
  promoBannerEnabled: z.boolean().optional(),
  serviceCoverUrl: z.string().url().nullable().optional(),
  serviceTitleColor: CatalogHexColor.nullable().optional(),
  serviceDescriptionColor: CatalogHexColor.nullable().optional(),
  serviceTagline: z.string().max(120).nullable().optional(),
  servicePromoBanner: z.string().max(60).nullable().optional(),
  servicePromoBannerEnabled: z.boolean().optional(),
  customization: StorefrontCustomizationDto.optional(),
  publishStorefront: z.boolean().optional(),
});

export type UpdateCatalogSettings = z.infer<typeof UpdateCatalogSettingsDto>;

export const PublicCatalogProductDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  photoUrl: z.string().nullable(),
  // Fotos adicionais (galeria) além da principal.
  extraPhotos: z.array(z.string()),
  salePrice: z.number(),
  saleUnit: z.string(),
  variations: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      color: z.string().optional(),
      size: z.string().optional(),
      inStock: z.boolean(),
    }),
  ),
});

export const PublicCatalogServiceDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.number().int(),
  defaultPrice: z.number().nullable(),
  locationMode: ServiceLocationMode,
  bookingInstructions: z.string().nullable(),
  variations: z.array(
    ServiceVariationInputDto.pick({
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
    }).required({ id: true }),
  ),
  addOns: z.array(
    ServiceAddOnInputDto.pick({
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
    }).required({ id: true }),
  ),
  packages: z.array(
    ServicePackageInputDto.pick({
      id: true,
      name: true,
      sessions: true,
      price: true,
      validityDays: true,
      recurrenceDays: true,
    }).required({ id: true }),
  ),
});

export const PublicCatalogDto = z.object({
  brandId: z.string(),
  // A API atual sempre envia; opcional preserva fixtures legadas do renderer classico.
  slug: z.string().regex(CATALOG_SLUG_REGEX).optional(),
  businessName: z.string(),
  whatsapp: z.string().nullable(),
  coverUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  accentColor: CatalogAccentColor.nullable(),
  titleColor: CatalogHexColor.nullable(),
  descriptionColor: CatalogHexColor.nullable(),
  pattern: CatalogPattern.nullable(),
  tagline: z.string().nullable(),
  promoBanner: z.string().nullable(),
  serviceCoverUrl: z.string().nullable(),
  serviceTitleColor: CatalogHexColor.nullable(),
  serviceDescriptionColor: CatalogHexColor.nullable(),
  serviceTagline: z.string().nullable(),
  servicePromoBanner: z.string().nullable(),
  customization: StorefrontCustomizationDto.nullable().optional(),
  products: z.array(PublicCatalogProductDto),
  services: z.array(PublicCatalogServiceDto).optional(),
  // Total real de produtos ativos (free mostra so os primeiros 5).
  totalProducts: z.number(),
});

export type PublicCatalog = z.infer<typeof PublicCatalogDto>;
export type PublicCatalogProduct = z.infer<typeof PublicCatalogProductDto>;
export type PublicCatalogService = z.infer<typeof PublicCatalogServiceDto>;
