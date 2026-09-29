import type {
  AssistantSaleDraft,
  AssistantSaleRequest,
  AssistantUsage,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/assistant";

export async function fetchAssistantUsage(token: string): Promise<AssistantUsage> {
  return apiClient<AssistantUsage>(`${BASE}/usage`, { token });
}

export async function draftSale(
  token: string,
  data: AssistantSaleRequest,
): Promise<AssistantSaleDraft> {
  return apiClient<AssistantSaleDraft>(`${BASE}/sale-draft`, {
    method: "POST",
    body: data,
    token,
  });
}
