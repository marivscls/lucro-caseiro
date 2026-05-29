import type {
  ProlaboreGoal,
  ProlaboreStatus,
  UpsertProlaboreGoal,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/goals";

export async function fetchProlaboreStatus(token: string): Promise<ProlaboreStatus> {
  return apiClient<ProlaboreStatus>(`${BASE}/prolabore`, { token });
}

export async function upsertProlaboreGoal(
  token: string,
  data: UpsertProlaboreGoal,
): Promise<ProlaboreGoal> {
  return apiClient<ProlaboreGoal>(`${BASE}/prolabore`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function deleteProlaboreGoal(token: string): Promise<void> {
  await apiClient(`${BASE}/prolabore`, { method: "DELETE", token });
}
