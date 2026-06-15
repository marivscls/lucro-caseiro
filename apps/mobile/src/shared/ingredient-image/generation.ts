// Disparo (opcional) de geração da ilustração sob demanda.
// Quando o PNG de um slug ainda não existe no Storage, o avatar pode pedir a
// geração — o backend/worker gera 1x e publica (cache compartilhado por slug).
//
// Vem do env `EXPO_PUBLIC_ASSET_FORGE_ENDPOINT` (o worker do asset-forge, ex.:
// https://seu-worker/gerar). Vazio = no-op.

const GENERATION_ENDPOINT = process.env.EXPO_PUBLIC_ASSET_FORGE_ENDPOINT ?? "";

// Dedup por sessão: não pede o mesmo slug duas vezes.
const requested = new Set<string>();

/** Pede a geração do PNG de um slug (fire-and-forget). No-op se desativado. */
export function requestImageGeneration(slug: string, prompt: string): void {
  if (!GENERATION_ENDPOINT || !slug || requested.has(slug)) return;
  requested.add(slug);
  void fetch(GENERATION_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, prompt }),
  }).catch(() => {
    // best-effort: se falhar, tenta de novo numa próxima sessão.
    requested.delete(slug);
  });
}
