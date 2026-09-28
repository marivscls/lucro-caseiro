import {
  ANALYTICS_ACQUISITION_MAX_LENGTH,
  type AnalyticsAcquisition,
  type AnalyticsAcquisitionField,
} from "@lucro-caseiro/contracts";

const UTM_PARAMS: Record<string, AnalyticsAcquisitionField> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
};

// Caracteres de controle nunca vão para a API (ela também os rejeita).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function clean(value: string | null, field: AnalyticsAcquisitionField): string | null {
  const text = value
    ?.replace(CONTROL_CHARS, "")
    .trim()
    .slice(0, ANALYTICS_ACQUISITION_MAX_LENGTH[field]);
  return text ? text : null;
}

function referrerHost(referrer: string | null, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host && host !== ownHost?.toLowerCase() ? clean(host, "referrer") : null;
  } catch {
    return null;
  }
}

/**
 * Lê UTM de uma query string (URL do PWA ou Install Referrer da Play, que usa o mesmo
 * formato) e o host de quem trouxe a pessoa. Nunca guarda a URL completa de origem.
 */
export function parseAcquisition(
  query: string,
  referrer: string | null = null,
  ownHost: string | null = null,
): AnalyticsAcquisition | null {
  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const acquisition: AnalyticsAcquisition = {};
  for (const [param, field] of Object.entries(UTM_PARAMS)) {
    const value = clean(params.get(param), field);
    if (value) acquisition[field] = value;
  }
  const host = referrerHost(referrer, ownHost);
  if (host) acquisition.referrer = host;
  return Object.keys(acquisition).length > 0 ? acquisition : null;
}
