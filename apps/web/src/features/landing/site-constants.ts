export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lucrocaseiro.com.br";

export const SUPPORT_EMAIL = "contato@orionseven.com.br";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&referrer=utm_source%3Dsite_publico%26utm_medium%3Downed%26utm_campaign%3Dlanding";

export const PUBLIC_PATHS = [
  "/landing",
  "/landing/calculadora",
  "/landing/privacidade",
  "/landing/termos",
  "/landing/excluir-conta",
  "/landing/suporte",
  "/landing/guias/como-calcular-preco-de-venda",
  "/landing/guias/precificacao-para-confeitaria",
  "/landing/guias/como-colocar-mao-de-obra-no-preco",
] as const;
