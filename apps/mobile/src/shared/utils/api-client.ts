import { getActiveBrand } from "@lucro-caseiro/brands";
import { apiErrorMessage, USER_ERROR_MESSAGES } from "@lucro-caseiro/contracts";

import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
const ACTIVE_BRAND_ID = getActiveBrand().id;

/**
 * Erro de resposta da API. Carrega o status HTTP e o `code` do backend
 * (ex.: "LIMIT_EXCEEDED", "VALIDATION_ERROR") para que a UI possa reagir
 * de forma especifica — ex.: abrir o paywall quando o plano gratuito esgota.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
  responseType?: "json" | "text";
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, responseType = "json" } = options;

  async function request(
    currentToken: string | undefined,
    retryAuth: boolean,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-brand": ACTIVE_BRAND_ID,
    };

    if (currentToken) {
      headers["Authorization"] = `Bearer ${currentToken}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(USER_ERROR_MESSAGES.network, 0, "NETWORK_ERROR");
    }

    // Ao voltar para um PWA que ficou inativo, a primeira requisição pode sair
    // com o access token antigo antes do auto-refresh do Supabase terminar.
    // Renova e repete uma única vez; não desloga em 401 transitório.
    if (response.status === 401 && currentToken && retryAuth) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session?.access_token) {
        return request(data.session.access_token, false);
      }
    }

    if (!response.ok) {
      const error: unknown = await response.json().catch(() => null);
      const code =
        error &&
        typeof error === "object" &&
        "error" in error &&
        typeof error.error === "string"
          ? error.error
          : undefined;
      throw new ApiError(apiErrorMessage(response.status, error), response.status, code);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    try {
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      return (responseType === "text" ? text : JSON.parse(text)) as T;
    } catch {
      throw new ApiError(
        USER_ERROR_MESSAGES.response,
        response.status,
        "INVALID_RESPONSE",
      );
    }
  }

  return request(token, true);
}
