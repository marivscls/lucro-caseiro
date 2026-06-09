const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

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
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new ApiError(
      error.message ?? `HTTP ${response.status}`,
      response.status,
      error.error,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
