import type { MeiSummary, UpdateMeiSettings } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/mei";

export async function fetchMeiSummary(
  token: string,
  year: number,
  month: number,
): Promise<MeiSummary> {
  return apiClient<MeiSummary>(`${BASE}/summary?year=${year}&month=${month}`, { token });
}

export async function updateMeiSettings(
  token: string,
  data: UpdateMeiSettings,
): Promise<UpdateMeiSettings> {
  return apiClient<UpdateMeiSettings>(`${BASE}/settings`, {
    method: "PUT",
    body: data,
    token,
  });
}
