import type {
  CatalogAccentColorValue,
  CatalogPatternKey,
  CatalogSettings,
  PlanType,
  PublicCatalogService,
  PublicCatalogProduct,
  PublicServiceBookingRequestInput,
  ServiceBookingRequest,
  StorefrontCustomization,
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
  titleColor: string | null;
  descriptionColor: string | null;
  pattern: CatalogPatternKey | null;
  tagline: string | null;
  promoBanner: string | null;
  promoBannerEnabled: boolean;
  serviceCoverUrl: string | null;
  serviceTitleColor: string | null;
  serviceDescriptionColor: string | null;
  serviceTagline: string | null;
  servicePromoBanner: string | null;
  servicePromoBannerEnabled: boolean;
  customization: StorefrontCustomization | null;
  publishedCustomization: StorefrontCustomization | null;
  publishedProducts?: PublicCatalogProduct[];
  publishedServices?: PublicCatalogService[];
}

export interface CatalogPublishedSnapshot {
  publishedProducts?: PublicCatalogProduct[] | null;
  publishedServices?: PublicCatalogService[] | null;
}

export interface ICatalogRepo {
  findByUser(userId: string): Promise<CatalogSettings | null>;
  findOwnerBySlug(
    slug: string,
  ): Promise<(CatalogSettings & CatalogOwner & CatalogPublishedSnapshot) | null>;
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
