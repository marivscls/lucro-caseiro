import type { CatalogSettings, UpdateCatalogSettings } from "@lucro-caseiro/contracts";

import { ApiError, apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/catalog";

export async function fetchCatalogSettings(token: string): Promise<CatalogSettings> {
  return apiClient<CatalogSettings>(`${BASE}/settings`, { token });
}

export async function updateCatalogSettings(
  token: string,
  data: UpdateCatalogSettings,
): Promise<CatalogSettings> {
  return apiClient<CatalogSettings>(`${BASE}/settings`, {
    method: "PUT",
    body: data,
    token,
  });
}

export type CatalogSlugAvailability = Readonly<{
  available: boolean;
  reason: string | null;
}>;

export async function fetchCatalogSlugAvailability(
  token: string,
  slug: string,
): Promise<CatalogSlugAvailability> {
  return apiClient<CatalogSlugAvailability>(
    `${BASE}/slug-availability?slug=${encodeURIComponent(slug)}`,
    { token },
  );
}

/**
 * URL publica do catalogo (servida pela API em /c/:slug).
 * EXPO_PUBLIC_CATALOG_URL permite usar um dominio bonito (ex.:
 * https://catalogo.lucrocaseiro.app) apontado para o mesmo servico.
 */
export function publicCatalogUrl(slug: string): string {
  const base =
    process.env.EXPO_PUBLIC_CATALOG_URL ??
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:3001";
  return `${base}/c/${slug}`;
}

/** HTML da página pública. Usado na prévia “Página no ar” (srcDoc). */
export async function fetchPublishedCatalogHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "text/html" },
  });
  const html = await response.text();
  if (!html.trim()) {
    throw new ApiError("Não foi possível abrir a página no ar", response.status);
  }
  return html;
}

export type PublicCatalogSection = "produtos" | "servicos";

/** URL que abre somente uma seção da vitrine pública. */
export function publicCatalogSectionUrl(
  slug: string,
  section: PublicCatalogSection,
): string {
  return `${publicCatalogUrl(slug)}?tipo=${section}`;
}

/** URL que abre o catalogo ja posicionado no card de um produto. */
export function publicCatalogProductUrl(slug: string, productId: string): string {
  const encodedProductId = encodeURIComponent(productId);
  return `${publicCatalogUrl(slug)}?produto=${encodedProductId}#produto-${encodedProductId}`;
}
