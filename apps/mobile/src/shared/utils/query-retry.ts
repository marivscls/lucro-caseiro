import { ApiError } from "./api-client";

const MAX_QUERY_RETRIES = 2;

/**
 * Repete leituras só quando o problema pode ser passageiro (sem conexão,
 * tempo esgotado ou erro 5xx). Erros 4xx não mudam ao repetir.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  if (!(error instanceof ApiError)) return false;
  return (
    error.code === "NETWORK_ERROR" || error.code === "TIMEOUT" || error.status >= 500
  );
}
