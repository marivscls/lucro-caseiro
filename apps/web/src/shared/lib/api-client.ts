import { getSupabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const DEFAULT_API_TIMEOUT_MS = 30_000;

type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { body, signal, timeoutMs = DEFAULT_API_TIMEOUT_MS, ...requestOptions } = options;
  const { data } = await getSupabase().auth.getSession();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (data.session?.access_token)
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  const method = options.method ?? "GET";
  const cacheKey = `lucro-marketing-cache:${data.session?.user.id ?? "anonymous"}:${path}`;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/marketing${path}`, {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestSignal,
    });
  } catch (error) {
    if (
      requestSignal.aborted &&
      (requestSignal.reason as { name?: string } | undefined)?.name === "TimeoutError"
    ) {
      throw new Error("A operação demorou mais que o esperado. Tente novamente.", {
        cause: error,
      });
    }
    if (method === "GET") {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    }
    throw new Error(
      "Não foi possível conectar à Central agora. Verifique sua internet e tente novamente.",
      { cause: error },
    );
  }
  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => ({ message: response.statusText }))) as { message?: string };
    throw new Error(problem.message ?? "Não foi possível concluir a operação");
  }
  if (response.status === 204) return undefined as T;
  const result = (await response.json()) as T;
  if (method === "GET") window.localStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

export function clearApiCache() {
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("lucro-marketing-cache:")) window.localStorage.removeItem(key);
  }
}

export async function authenticatedDownload(path: string, filename: string) {
  const { data } = await getSupabase().auth.getSession();
  const response = await fetch(`${API_URL}/api/v1/marketing${path}`, {
    headers: data.session?.access_token
      ? { Authorization: `Bearer ${data.session.access_token}` }
      : {},
  });
  if (!response.ok) throw new Error("Não foi possível exportar o documento");
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
