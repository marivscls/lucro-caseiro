import type {
  CatalogAccentColorKey,
  CatalogSettings,
  PublicCatalogProduct,
} from "@lucro-caseiro/contracts";

export interface CatalogOwner {
  userId: string;
  businessName: string;
  phone: string | null;
  plan: "free" | "premium";
}

export interface CatalogSettingsData {
  slug: string;
  enabled: boolean;
  whatsapp: string | null;
  coverUrl: string | null;
  accentColor: CatalogAccentColorKey | null;
  tagline: string | null;
}

export interface ICatalogRepo {
  findByUser(userId: string): Promise<CatalogSettings | null>;
  findOwnerBySlug(slug: string): Promise<(CatalogSettings & CatalogOwner) | null>;
  slugTaken(slug: string, excludeUserId: string): Promise<boolean>;
  upsert(userId: string, data: CatalogSettingsData): Promise<CatalogSettings>;
  listPublicProducts(userId: string): Promise<PublicCatalogProduct[]>;
  getOwnerDefaults(userId: string): Promise<CatalogOwner | null>;
}
