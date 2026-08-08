export const productionCorsOrigins = [
  "https://lucrocaseiro.com.br",
  "https://www.lucrocaseiro.com.br",
  "https://app.lucrocaseiro.com.br",
  "https://catalogo.lucrocaseiro.com.br",
  "https://lucro-caseiroweb-production.up.railway.app",
  "https://lucro-caseiromobile-production.up.railway.app",
] as const;

export function isAllowedCorsOrigin(origin: string, allowedOrigins: readonly string[]) {
  const normalized = origin.replace(/\/$/, "");

  try {
    const url = new URL(normalized);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return allowedOrigins.includes(normalized);
}
