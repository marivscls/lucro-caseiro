// Providers de geração de imagem. O sistema é agnóstico de fornecedor:
// implemente a interface { name, async generate({ prompt, slug }) } e plugue.
//
// Resultado esperado de generate():
//   { status: "ready", url }                         // provider devolveu URL hospedada
//   { status: "ready", bytes, contentType }          // provider devolveu os bytes
//   { status: "pending", note }                      // ainda não gerado (dry-run)

/**
 * Seleciona o provider a partir das variáveis de ambiente.
 * - ASSET_FORGE_PROVIDER=http + ASSET_FORGE_IMAGE_ENDPOINT  -> http
 * - caso contrário                                          -> dry-run (offline)
 */
export function selectProvider(env = process.env) {
  if (env.ASSET_FORGE_PROVIDER === "http" && env.ASSET_FORGE_IMAGE_ENDPOINT) {
    return httpProvider(env);
  }
  return dryRunProvider();
}

/** Não gera nada — só registra o prompt. Roda offline, sem chaves. */
export function dryRunProvider() {
  return {
    name: "dry-run",
    // eslint-disable-next-line no-unused-vars
    async generate({ prompt, slug }) {
      return {
        status: "pending",
        url: null,
        note: "dry-run — defina ASSET_FORGE_PROVIDER=http e ASSET_FORGE_IMAGE_ENDPOINT para gerar de verdade",
      };
    },
  };
}

/**
 * Provider HTTP genérico: faz POST { prompt, slug } no seu endpoint de geração
 * (um worker seu que chama o modelo de imagem) e espera { url } ou { b64 }.
 */
export function httpProvider(env) {
  const endpoint = env.ASSET_FORGE_IMAGE_ENDPOINT;
  const apiKey = env.ASSET_FORGE_API_KEY;
  return {
    name: "http",
    async generate({ prompt, slug }) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ prompt, slug }),
      });
      if (!res.ok) {
        throw new Error(`provider HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data.url) return { status: "ready", url: data.url };
      if (data.b64) {
        return {
          status: "ready",
          bytes: Buffer.from(data.b64, "base64"),
          contentType: data.contentType ?? "image/png",
        };
      }
      throw new Error("resposta do provider sem 'url' nem 'b64'");
    },
  };
}
