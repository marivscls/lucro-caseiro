const PUBLIC_SITE_HOSTS = new Set(["lucrocaseiro.com.br", "www.lucrocaseiro.com.br"]);

/**
 * Páginas do site público (landing, guias, políticas). Nelas não registramos
 * o service worker nem o manifesto da Central de Marketing, que ficam só
 * para a área interna.
 */
export function isPublicSitePage(hostname: string, pathname: string): boolean {
  if (pathname === "/landing" || pathname.startsWith("/landing/")) return true;
  return pathname === "/" && PUBLIC_SITE_HOSTS.has(hostname.toLowerCase());
}
