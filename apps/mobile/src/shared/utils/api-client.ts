const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

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
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
