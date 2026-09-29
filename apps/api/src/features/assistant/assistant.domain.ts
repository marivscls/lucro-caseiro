import {
  ASSISTANT_MAX_UPLOAD_BYTES,
  ASSISTANT_MONTHLY_LIMITS,
  MAX_MONEY,
  MAX_QUANTITY,
  type PlanType,
} from "@lucro-caseiro/contracts";

const STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "dona",
  "don",
  "seu",
  "sr",
  "sra",
  "senhor",
  "senhora",
  "tia",
  "tio",
  "vizinha",
  "vizinho",
]);

/** Palavras de um nome, sem acento, minúsculas, sem plural simples e sem "dona/seu". */
export function nameTokens(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !STOPWORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word));
}

function tokenMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3) return a.startsWith(b) || b.startsWith(a);
  return false;
}

/**
 * Acha o cadastro com o nome mais parecido com o que a pessoa falou.
 * Só aceita quando todas as palavras faladas batem com alguma do cadastro
 * (evita trocar "bolo de cenoura" por "bolo de chocolate").
 */
export function bestNameMatch<T extends { name: string }>(
  spoken: string,
  candidates: T[],
): T | null {
  const wanted = nameTokens(spoken);
  if (wanted.length === 0) return null;
  let best: { item: T; score: number } | null = null;
  for (const item of candidates) {
    const tokens = nameTokens(item.name);
    if (tokens.length === 0) continue;
    const hits = wanted.filter((word) =>
      tokens.some((token) => tokenMatches(word, token)),
    );
    if (hits.length < wanted.length) continue;
    // Desempate: cadastro com menos palavras sobrando é o mais específico.
    const score = hits.length / tokens.length;
    if (!best || score > best.score) best = { item, score };
  }
  return best?.item ?? null;
}

export function assistantLimit(plan: PlanType): number {
  return ASSISTANT_MONTHLY_LIMITS[plan];
}

export function monthKey(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts.slice(0, 7);
}

export function todayIso(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const AUDIO_TYPES =
  /^audio\/(webm|ogg|mpeg|mp3|mp4|m4a|x-m4a|aac|wav|x-wav|3gpp|amr)(;.*)?$/;
const IMAGE_TYPES = /^image\/(jpeg|jpg|png|webp|heic|heif)$/;

export function base64Bytes(data: string): number {
  const clean = data.replace(/^data:[^,]*,/, "").replace(/\s/g, "");
  let padding = 0;
  if (clean.endsWith("==")) padding = 2;
  else if (clean.endsWith("=")) padding = 1;
  return Math.floor((clean.length * 3) / 4) - padding;
}

/** Valida tipo e tamanho do arquivo; devolve a mensagem de erro ou null. */
export function fileProblem(
  file: { data: string; mimeType: string },
  kind: "audio" | "image",
): string | null {
  const type = file.mimeType.toLowerCase();
  const allowed = kind === "audio" ? AUDIO_TYPES : IMAGE_TYPES;
  if (!allowed.test(type)) {
    return kind === "audio"
      ? "Esse formato de áudio não é aceito. Grave de novo pelo app."
      : "Mande a foto em JPG, PNG ou WEBP.";
  }
  if (base64Bytes(file.data) > ASSISTANT_MAX_UPLOAD_BYTES) {
    return kind === "audio"
      ? "O áudio ficou grande demais. Grave uma mensagem mais curta."
      : "A foto ficou grande demais. Tire de novo, mais de perto.";
  }
  return null;
}

export function stripDataUrl(data: string): string {
  return data.replace(/^data:[^,]*,/, "");
}

const clampMoney = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) || value <= 0
    ? null
    : Math.min(MAX_MONEY, Math.round(value * 100) / 100);

/** Limpa números estranhos que a IA possa devolver. */
export function sanitizeItem(item: {
  name: string;
  quantity: number;
  unitPrice: number | null;
}): { name: string; quantity: number; unitPrice: number | null } | null {
  const name = item.name.trim().slice(0, 120);
  if (!name) return null;
  const quantity =
    Number.isFinite(item.quantity) && item.quantity > 0
      ? Math.min(MAX_QUANTITY, Math.round(item.quantity * 1000) / 1000)
      : 1;
  return { name, quantity, unitPrice: clampMoney(item.unitPrice) };
}

/** Tipo sem parâmetros ("audio/webm;codecs=opus" vira "audio/webm"), como o Gemini espera. */
export function baseMimeType(mimeType: string): string {
  return mimeType.split(";")[0]!.trim().toLowerCase();
}
