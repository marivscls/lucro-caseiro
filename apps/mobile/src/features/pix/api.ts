import type { FiadoLink, PixSettings, UpdatePixSettings } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/fiado";

export async function fetchPixSettings(token: string): Promise<PixSettings> {
  return apiClient<PixSettings>(`${BASE}/pix`, { token });
}

export async function updatePixSettings(
  token: string,
  data: UpdatePixSettings,
): Promise<PixSettings> {
  return apiClient<PixSettings>(`${BASE}/pix`, { method: "PUT", body: data, token });
}

/** Link público do extrato do fiado de um cliente (o mesmo link é reaproveitado). */
export async function createFiadoLink(
  token: string,
  clientId: string,
): Promise<FiadoLink> {
  return apiClient<FiadoLink>(`${BASE}/links`, {
    method: "POST",
    body: { clientId },
    token,
  });
}

/**
 * Endereço público do extrato. Usa a mesma base do catálogo público
 * (EXPO_PUBLIC_CATALOG_URL), que aponta para a API.
 */
export function fiadoStatementUrl(token: string): string {
  const base =
    process.env.EXPO_PUBLIC_CATALOG_URL ??
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:3001";
  return `${base}/f/${token}`;
}
