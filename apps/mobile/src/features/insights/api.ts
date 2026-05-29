import type { Insights } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/insights";

export async function fetchInsights(token: string, months?: number): Promise<Insights> {
  const suffix = months ? `?months=${months}` : "";
  return apiClient<Insights>(`${BASE}${suffix}`, { token });
}
