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
