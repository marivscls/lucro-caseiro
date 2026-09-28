import type {
  AssistantNotebookRequest,
  AssistantNotebookResult,
  AssistantSaleDraft,
  AssistantSaleRequest,
  AssistantUsage,
  ImportNotebook,
  ImportNotebookResult,
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

export async function readNotebook(
  token: string,
  data: AssistantNotebookRequest,
): Promise<AssistantNotebookResult> {
  return apiClient<AssistantNotebookResult>(`${BASE}/notebook`, {
    method: "POST",
    body: data,
    token,
  });
}

export async function importNotebook(
  token: string,
  data: ImportNotebook,
): Promise<ImportNotebookResult> {
  return apiClient<ImportNotebookResult>(`${BASE}/notebook/import`, {
    method: "POST",
    body: data,
    token,
  });
}
