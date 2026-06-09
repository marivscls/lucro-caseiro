import type { CatalogSettings, PublicCatalogProduct } from "@lucro-caseiro/contracts";

export interface CatalogOwner {
  userId: string;
  businessName: string;
  phone: string | null;
}

export interface ICatalogRepo {
  findByUser(userId: string): Promise<CatalogSettings | null>;
  findOwnerBySlug(slug: string): Promise<(CatalogSettings & CatalogOwner) | null>;
  slugTaken(slug: string, excludeUserId: string): Promise<boolean>;
  upsert(
    userId: string,
    data: { slug: string; enabled: boolean; whatsapp: string | null },
  ): Promise<CatalogSettings>;
  listPublicProducts(userId: string): Promise<PublicCatalogProduct[]>;
  getOwnerDefaults(userId: string): Promise<CatalogOwner | null>;
}
