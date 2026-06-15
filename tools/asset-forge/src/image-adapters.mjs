import { CATALOG } from "./catalog.mjs";
import { hexToRgb, solidCirclePng } from "./png.mjs";

// Adapters de modelo de imagem. Interface: { name, async generate({prompt,slug}) }
// -> { bytes: Buffer, contentType }.
//
// Padrão = stub (placeholder PNG real, offline). Com OPENAI_API_KEY = openai.
// Trocar de modelo (Stability, Replicate, fal, Imagen…) = só escrever outro adapter.

const colorBySlug = new Map(CATALOG.map((e) => [e.slug, e.color]));

export function selectImageAdapter(env = process.env) {
  if (env.OPENAI_API_KEY) return openaiAdapter(env);
  return stubAdapter();
}

/** Gera um placeholder real (círculo na cor do item). Não usa rede. */
export function stubAdapter() {
  return {
    name: "stub",
    async generate({ slug }) {
      const png = solidCirclePng(256, hexToRgb(colorBySlug.get(slug)));
      return { bytes: png, contentType: "image/png" };
    },
  };
}

/** Exemplo de modelo real: OpenAI Images. Outros provedores seguem o mesmo molde. */
export function openaiAdapter(env) {
  const key = env.OPENAI_API_KEY;
  const model = env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  return {
    name: "openai",
    async generate({ prompt }) {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, prompt, size: "1024x1024", background: "transparent" }),
      });
      if (!res.ok) {
        throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI: resposta sem b64_json");
      return { bytes: Buffer.from(b64, "base64"), contentType: "image/png" };
    },
  };
}
