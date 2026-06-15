// Storage do PNG gerado. Com Supabase configurado, faz upload e devolve a URL
// pública; sem config, retorna null e o worker devolve os bytes (b64) — a CLI
// salva localmente em out/png/.

export function selectStorage(env = process.env) {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) return supabaseStorage(env);
  return null;
}

export function supabaseStorage(env) {
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_KEY;
  const bucket = env.ASSET_FORGE_BUCKET ?? "illustrations";
  return {
    name: "supabase",
    async upload(path, bytes, contentType) {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": contentType,
          "x-upsert": "true",
        },
        body: bytes,
      });
      if (!res.ok) {
        throw new Error(`Supabase upload ${res.status}: ${await res.text()}`);
      }
      return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },
  };
}
