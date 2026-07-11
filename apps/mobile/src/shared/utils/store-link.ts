const ANDROID_PACKAGE = "br.com.orionseven.lucrocaseiro";

/**
 * Link da ficha do app na Play Store, com UTM pra medir instalacoes vindas
 * de cada canal (PDFs, catalogo publico, landing page, etc).
 */
export function playStoreUrl(utmSource: string): string {
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&referrer=utm_source%3D${utmSource}`;
}
