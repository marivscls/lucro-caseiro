import { z } from "zod";

// Slug da URL publica do catalogo: minusculas, numeros e hifens.
export const CATALOG_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

// Cor do catalogo (personalizacao Premium): preset nomeado OU hex livre (#rrggbb).
// A chave/hex e persistida; as paletas concretas ficam no dominio da API.
export const CATALOG_HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const CatalogAccentPreset = z.enum([
  "brown",
  "rose",
  "green",
  "lavender",
  "blue",
  "amber",
]);
export type CatalogAccentColorKey = z.infer<typeof CatalogAccentPreset>;

export const CatalogAccentColor = z.union([
  CatalogAccentPreset,
  z.string().regex(CATALOG_HEX_COLOR_REGEX),
]);
export type CatalogAccentColorValue = z.infer<typeof CatalogAccentColor>;

// Pattern decorativo sobre a cor do hero (personalizacao Premium).
export const CatalogPattern = z.enum(["dots", "bubbles", "grid", "stripes"]);
export type CatalogPatternKey = z.infer<typeof CatalogPattern>;

export const CatalogSettingsDto = z.object({
  slug: z.string(),
  enabled: z.boolean(),
  whatsapp: z.string().nullable(),
  coverUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  accentColor: CatalogAccentColor.nullable(),
  pattern: CatalogPattern.nullable(),
  tagline: z.string().nullable(),
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
  pattern: CatalogPattern.nullable().optional(),
  tagline: z.string().max(120).nullable().optional(),
});

export type UpdateCatalogSettings = z.infer<typeof UpdateCatalogSettingsDto>;

export const PublicCatalogProductDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  photoUrl: z.string().nullable(),
  salePrice: z.number(),
  saleUnit: z.string(),
});

export const PublicCatalogDto = z.object({
  businessName: z.string(),
  whatsapp: z.string().nullable(),
  coverUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  accentColor: CatalogAccentColor.nullable(),
  pattern: CatalogPattern.nullable(),
  tagline: z.string().nullable(),
  products: z.array(PublicCatalogProductDto),
});

export type PublicCatalog = z.infer<typeof PublicCatalogDto>;
export type PublicCatalogProduct = z.infer<typeof PublicCatalogProductDto>;
