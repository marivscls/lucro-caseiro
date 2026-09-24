export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://lucrocaseiro.com.br";

export const SUPPORT_EMAIL = "contato@orionseven.com.br";

export const PWA_URL = "https://app.lucrocaseiro.com.br";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=br.com.orionseven.lucrocaseiro&referrer=utm_source%3Dsite_publico%26utm_medium%3Downed%26utm_campaign%3Dlanding";

const SITE_UTM = {
  utm_source: "site_publico",
  utm_medium: "owned",
  utm_campaign: "landing",
} as const;

/**
 * Link da Play Store com a posição do botão em `utm_content`, para saber
 * qual chamada do site traz instalação (lido pelo app no primeiro acesso).
 */
export function playStoreUrl(content: string): string {
  const referrer = new URLSearchParams({ ...SITE_UTM, utm_content: content }).toString();
  const url = new URL("https://play.google.com/store/apps/details");
  url.searchParams.set("id", "br.com.orionseven.lucrocaseiro");
  url.searchParams.set("referrer", referrer);
  return url.toString();
}

/** Link do app no navegador com a posição do botão em `utm_content`. */
export function pwaUrl(content: string): string {
  const url = new URL(PWA_URL);
  for (const [key, value] of Object.entries({ ...SITE_UTM, utm_content: content })) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * WhatsApp de atendimento (link wa.me completo). Enquanto estiver vazio, o
 * botão flutuante e o link do rodapé não aparecem.
 */
export const WHATSAPP_URL: string | null = null;

/** Perfis oficiais. Só entram no rodapé quando o endereço for preenchido. */
export const SOCIAL_LINKS: readonly { readonly name: string; readonly url: string }[] = [
  { name: "Instagram", url: "https://www.instagram.com/lucrocaseiro.app/" },
];

export const PUBLIC_PATHS = [
  "/",
  "/landing/calculadora",
  "/landing/controle-de-fiado",
  "/landing/app-para-confeitaria",
  "/landing/catalogo-digital-whatsapp",
  "/landing/controle-de-vendas",
  "/landing/app-para-marmita",
  "/landing/app-para-manicure",
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
  "/": "2026-09-24",
  "/landing/calculadora": "2026-09-10",
  "/landing/controle-de-fiado": "2026-09-24",
  "/landing/app-para-confeitaria": "2026-09-24",
  "/landing/catalogo-digital-whatsapp": "2026-09-24",
  "/landing/controle-de-vendas": "2026-09-24",
  "/landing/app-para-marmita": "2026-09-24",
  "/landing/app-para-manicure": "2026-09-24",
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
