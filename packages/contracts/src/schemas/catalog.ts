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
  products: z.array(PublicCatalogProductDto),
  services: z.array(PublicCatalogServiceDto).optional(),
  // Total real de produtos ativos (free mostra so os primeiros 5).
  totalProducts: z.number(),
});

export type PublicCatalog = z.infer<typeof PublicCatalogDto>;
export type PublicCatalogProduct = z.infer<typeof PublicCatalogProductDto>;
export type PublicCatalogService = z.infer<typeof PublicCatalogServiceDto>;
