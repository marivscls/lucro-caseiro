import { DEFAULT_BRAND_ID, type BrandConfig } from "@lucro-caseiro/brands";

export function getBrandDisplayName(brand: BrandConfig): string {
  return brand.id === DEFAULT_BRAND_ID ? "Lucro Caseiro" : brand.appName;
}
