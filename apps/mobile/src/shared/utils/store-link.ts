import { getActiveBrand } from "@lucro-caseiro/brands";

/**
 * Link da ficha do app na Play Store, com UTM pra medir instalacoes vindas
 * de cada canal (PDFs, catalogo publico, landing page, etc).
 */
export function playStoreUrl(utmSource: string): string {
  return `https://play.google.com/store/apps/details?id=${getActiveBrand().androidPackage}&referrer=utm_source%3D${utmSource}`;
}
