import type {
  CatalogAccentColorValue,
  CatalogPatternKey,
  CatalogSettings,
  PlanType,
  PublicCatalogService,
  PublicCatalogProduct,
  PublicServiceBookingRequestInput,
  ServiceBookingRequest,
} from "@lucro-caseiro/contracts";

export interface CatalogOwner {
  userId: string;
  businessName: string;
  phone: string | null;
  plan: PlanType;
  planExpiresAt: string | null;
}

export interface CatalogSettingsData {
  brandId: string;
  slug: string;
  enabled: boolean;
  whatsapp: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  accentColor: CatalogAccentColorValue | null;
  pattern: CatalogPatternKey | null;
  tagline: string | null;
  promoBanner: string | null;
}

export interface ICatalogRepo {
  findByUser(userId: string): Promise<CatalogSettings | null>;
  findOwnerBySlug(slug: string): Promise<(CatalogSettings & CatalogOwner) | null>;
  slugTaken(slug: string, excludeUserId: string): Promise<boolean>;
  upsert(userId: string, data: CatalogSettingsData): Promise<CatalogSettings>;
  listPublicProducts(userId: string): Promise<PublicCatalogProduct[]>;
  listPublicServices?(userId: string): Promise<PublicCatalogService[]>;
  createPublicServiceBooking?(
    userId: string,
    data: PublicServiceBookingRequestInput,
  ): Promise<ServiceBookingRequest | null>;
  getOwnerDefaults(userId: string): Promise<CatalogOwner | null>;
}
