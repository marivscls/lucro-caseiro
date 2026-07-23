const AUTH_PARAM_KEYS = [
  "access_token",
  "code",
  "error",
  "error_code",
  "error_description",
  "expires_at",
  "expires_in",
  "provider_refresh_token",
  "provider_token",
  "refresh_token",
  "token_type",
  "type",
] as const;

function removeAuthParams(params: URLSearchParams): boolean {
  let changed = false;
  for (const key of AUTH_PARAM_KEYS) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }
  return changed;
}

/** Remove credenciais do callback antes que a URL possa ser copiada/compartilhada. */
export function withoutAuthParams(rawUrl: string): string {
  const url = new URL(rawUrl);
  const queryChanged = removeAuthParams(url.searchParams);
  const hashParams = new URLSearchParams(
    url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
  );
  const hashChanged = removeAuthParams(hashParams);

  if (hashChanged) {
    const cleanHash = hashParams.toString();
    url.hash = cleanHash ? `#${cleanHash}` : "";
  }

  return queryChanged || hashChanged ? url.toString() : rawUrl;
}
