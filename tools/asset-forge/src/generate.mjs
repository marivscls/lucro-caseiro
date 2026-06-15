import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { resolveEntryOrName } from "./catalog.mjs";
import { buildPrompt } from "./prompt.mjs";

/**
 * Resolve um nome (qualquer um), monta o prompt e gera (via provider) a
 * ilustração. Se o provider devolver bytes, salva em <outDir>/png/<slug>.<ext>.
 * @returns registro pronto para entrar no manifest.
 */
export async function generateOne(name, { provider, outDir, nowIso }) {
  const target = resolveEntryOrName(name);
  if (!target.slug) {
    return { name, slug: null, status: "invalid", updatedAt: nowIso };
  }

  const prompt = buildPrompt({ label: target.label });
  const result = await provider.generate({ prompt, slug: target.slug });

  let url = result.url ?? null;
  if (result.bytes) {
    const ext = (result.contentType ?? "image/png").includes("png") ? "png" : "img";
    const dir = join(outDir, "png");
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${target.slug}.${ext}`);
    await writeFile(file, result.bytes);
    url = `png/${target.slug}.${ext}`;
  }

  return {
    name,
    slug: target.slug,
    label: target.label,
    emoji: target.emoji,
    color: target.color,
    status: result.status,
    url,
    prompt,
    source: provider.name,
    note: result.note,
    updatedAt: nowIso,
  };
}
