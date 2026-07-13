import type { CatalogSettings, UpdateCatalogSettings } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

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

/** URL que abre o catalogo ja posicionado no card de um produto. */
export function publicCatalogProductUrl(slug: string, productId: string): string {
  const encodedProductId = encodeURIComponent(productId);
  return `${publicCatalogUrl(slug)}?produto=${encodedProductId}#produto-${encodedProductId}`;
}
