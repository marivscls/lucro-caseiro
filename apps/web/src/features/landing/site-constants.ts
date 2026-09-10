export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lucrocaseiro.com.br";

export const SUPPORT_EMAIL = "contato@orionseven.com.br";

export const PWA_URL = "https://app.lucrocaseiro.com.br";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&referrer=utm_source%3Dsite_publico%26utm_medium%3Downed%26utm_campaign%3Dlanding";

export const PUBLIC_PATHS = [
  "/",
  "/landing/calculadora",
  "/landing/privacidade",
  "/landing/termos",
  "/landing/excluir-conta",
  "/landing/suporte",
  "/landing/guias/como-calcular-preco-de-venda",
  "/landing/guias/precificacao-para-confeitaria",
  "/landing/guias/como-colocar-mao-de-obra-no-preco",
] as const;

/** Editorial review dates, not build timestamps. */
export const PUBLIC_PAGE_UPDATED: Record<(typeof PUBLIC_PATHS)[number], string> = {
  "/": "2026-09-10",
  "/landing/calculadora": "2026-09-10",
  "/landing/privacidade": "2026-09-10",
  "/landing/termos": "2026-07-16",
  "/landing/excluir-conta": "2026-07-16",
  "/landing/suporte": "2026-09-10",
  "/landing/guias/como-calcular-preco-de-venda": "2026-09-10",
  "/landing/guias/precificacao-para-confeitaria": "2026-09-10",
  "/landing/guias/como-colocar-mao-de-obra-no-preco": "2026-09-10",
};

export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/landing/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Lucro Caseiro — saiba quanto cobrar e o que sobra de cada venda",
};
