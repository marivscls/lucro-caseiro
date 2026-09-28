import {
  brands,
  DEFAULT_BRAND_ID,
  type BrandConfig,
  type BrandId,
} from "@lucro-caseiro/brands";

/**
 * Rodapé "Feito com ..." das páginas públicas (catálogo, extrato do fiado).
 * Cada página que sai do app vira um convite discreto para quem a recebe.
 * A UTM diz de qual página veio o cadastro (utm_content = superfície).
 */
export type MadeWithSurface = "catalogo" | "extrato_fiado" | "agendamento";

const SITE_URL = "https://lucrocaseiro.com.br/";

function brandFor(brandId: string | null | undefined): BrandConfig {
  const known = Object.hasOwn(brands, brandId ?? "") ? brandId! : DEFAULT_BRAND_ID;
  return brands[known as BrandId] as BrandConfig;
}

export function madeWithUrl(
  brandId: string | null | undefined,
  surface: MadeWithSurface,
): string {
  const brand = brandFor(brandId);
  const utm = `utm_source=${surface}&utm_medium=rodape&utm_campaign=feito_com`;
  // O site principal detecta o aparelho (Play no Android, app no navegador no
  // resto). As outras marcas ainda não têm site: vão direto para a Play.
  if (brand.id === DEFAULT_BRAND_ID) return `${SITE_URL}?${utm}`;
  return `https://play.google.com/store/apps/details?id=${brand.androidPackage}&referrer=${encodeURIComponent(utm)}`;
}

export function madeWithLabel(brandId: string | null | undefined): string {
  return `Feito com ${brandFor(brandId).appName}`;
}
