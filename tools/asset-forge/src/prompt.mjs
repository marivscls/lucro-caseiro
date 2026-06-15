// Estilo visual ÚNICO de todas as ilustrações — garante coerência entre os PNGs.
const STYLE = [
  "single object",
  "3D render, glossy soft-clay icon style, smooth rounded forms",
  "soft studio lighting, gentle drop shadow",
  "centered, isolated on a transparent background",
  "warm vibrant brand palette",
  "high detail, crisp, app icon illustration",
  "no text, no watermark, square 1:1",
].join(", ");

/**
 * Monta o prompt de geração para uma entrada do catálogo.
 * @param {{ label: string }} entry
 * @returns {string}
 */
export function buildPrompt(entry) {
  return `${entry.label}, ${STYLE}`;
}
