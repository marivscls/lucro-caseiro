import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/account";

/** Exclui definitivamente a conta do usuário autenticado. */
export async function deleteAccount(token: string): Promise<{ deleted: boolean }> {
  return apiClient<{ deleted: boolean }>(BASE, { method: "DELETE", token });
}
