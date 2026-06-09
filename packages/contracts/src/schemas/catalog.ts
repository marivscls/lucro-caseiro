import { z } from "zod";

// Slug da URL publica do catalogo: minusculas, numeros e hifens.
export const CATALOG_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

export const CatalogSettingsDto = z.object({
  slug: z.string(),
  enabled: z.boolean(),
  whatsapp: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export type CatalogSettings = z.infer<typeof CatalogSettingsDto>;

export const UpdateCatalogSettingsDto = z.object({
  slug: z.string().regex(CATALOG_SLUG_REGEX).optional(),
  enabled: z.boolean().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
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
  products: z.array(PublicCatalogProductDto),
});

export type PublicCatalog = z.infer<typeof PublicCatalogDto>;
export type PublicCatalogProduct = z.infer<typeof PublicCatalogProductDto>;
