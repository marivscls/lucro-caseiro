import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// O manifest é o cache/estado: slug -> { status, url, prompt, source, updatedAt }.
// É ele que o app consome para descobrir a URL da ilustração de cada slug.

/** Carrega o manifest (ou retorna vazio se não existir). */
export async function loadManifest(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return { items: {} };
  }
}

/** Salva o manifest (cria a pasta se preciso). */
export async function saveManifest(path, manifest) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
