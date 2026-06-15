// URL pública do PNG por slug. Preenchido quando o asset-forge publicar as
// ilustrações no Storage (ex.: copiar daqui o out/manifest.json). Enquanto
// vazio, o IngredientAvatar usa o fallback (emoji + cor).

const IMAGE_URLS: Readonly<Record<string, string>> = {
  // "acucar": "https://xxxx.supabase.co/storage/v1/object/public/illustrations/acucar.png",
};

/**
 * Base das ilustrações (convenção `<base>/<slug>.png`). Vem do env
 * `EXPO_PUBLIC_ILLUSTRATIONS_URL` — ex.:
 * `https://<projeto>.supabase.co/storage/v1/object/public/illustrations`.
 * Vazio = desligado (usa fallback emoji/cor). Liga só quando o bucket + PNGs existirem.
 */
const IMAGE_BASE_URL: string = process.env.EXPO_PUBLIC_ILLUSTRATIONS_URL ?? "";

/** Retorna a URL da ilustração de um slug, ou undefined (cai no fallback). */
export function ingredientImageUrl(slug: string): string | undefined {
  if (IMAGE_URLS[slug]) return IMAGE_URLS[slug];
  if (IMAGE_BASE_URL) return `${IMAGE_BASE_URL}/${slug}.png`;
  return undefined;
}
