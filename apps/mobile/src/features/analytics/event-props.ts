import {
  ANALYTICS_EVENT_PROPS_LIMITS as LIMITS,
  type AnalyticsEventProps,
} from "@lucro-caseiro/contracts";

const KEY = /^[a-z][a-z0-9_]*$/;
const TEXT = /^[\w.:/()[\]-]+$/;

/**
 * Mantém só o que a API aceita, para que um valor inesperado (vazio, com espaço, longo)
 * não faça o lote inteiro ser rejeitado. Texto longo é cortado; texto com espaço é descartado.
 */
export function sanitizeEventProps(
  props: AnalyticsEventProps | undefined,
): AnalyticsEventProps | undefined {
  if (!props) return undefined;
  const clean: AnalyticsEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(clean).length >= LIMITS.maxKeys) break;
    if (key.length > LIMITS.maxKeyLength || !KEY.test(key)) continue;
    if (typeof value === "boolean") clean[key] = value;
    if (typeof value === "number" && Number.isFinite(value)) {
      if (Math.abs(value) <= LIMITS.maxAbsNumber) clean[key] = value;
    }
    if (typeof value === "string") {
      const text = value.slice(0, LIMITS.maxStringLength);
      if (TEXT.test(text)) clean[key] = text;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}
