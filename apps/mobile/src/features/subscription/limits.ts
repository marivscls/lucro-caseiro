import type { FreemiumLimits, UserProfile } from "@lucro-caseiro/contracts";
import { planLimit, resolveActivePlan } from "@lucro-caseiro/contracts";

import type { LimitResource } from "./limit-copy";

// Um recurso é ilimitado no plano ativo (ex.: vendas no Essencial)? Deriva do
// próprio plano — reflete a compra na hora, sem esperar o refetch de /limits.
// Fornecedores no Essencial NÃO são ilimitados (teto 3), então usa o payload.
function resourceUnlimited(
  profile: UserProfile | null | undefined,
  resource: LimitResource,
): boolean {
  if (!profile) return false;
  return (
    planLimit(resolveActivePlan(profile.plan, profile.planExpiresAt), resource) === null
  );
}

const LIMIT_FIELDS: Record<LimitResource, { current: string; max: string }> = {
  sales: { current: "currentSalesThisMonth", max: "maxSalesPerMonth" },
  clients: { current: "currentClients", max: "maxClients" },
  recipes: { current: "currentRecipes", max: "maxRecipes" },
  packaging: { current: "currentPackaging", max: "maxPackaging" },
  products: { current: "currentProducts", max: "maxProducts" },
  suppliers: { current: "currentSuppliers", max: "maxSuppliers" },
};

export interface LimitUsage {
  readonly current: number;
  readonly max: number | null;
}

export interface LimitBannerState extends LimitUsage {
  readonly remaining: number;
  readonly isAtLimit: boolean;
  readonly percentage: number;
}

function finiteLimit(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function getLimitUsage(
  limits: FreemiumLimits | undefined,
  resource: LimitResource,
): LimitUsage {
  const fields = LIMIT_FIELDS[resource];
  if (!limits) return { current: 0, max: null };

  return {
    current: Number(limits[fields.current as keyof FreemiumLimits] ?? 0),
    max: finiteLimit(limits[fields.max as keyof FreemiumLimits]),
  };
}

export function isLimitBlocked(
  limits: FreemiumLimits | undefined,
  profile: UserProfile | null | undefined,
  resource: LimitResource,
): boolean {
  if (!profile) return false;
  if (resourceUnlimited(profile, resource)) return false;

  const { current, max } = getLimitUsage(limits, resource);
  return max !== null && current >= max;
}

export function getLimitBannerState(
  limits: FreemiumLimits | undefined,
  profile: UserProfile | null | undefined,
  resource: LimitResource,
): LimitBannerState | null {
  if (!profile) return null;
  if (resourceUnlimited(profile, resource)) return null;

  const { current, max } = getLimitUsage(limits, resource);
  if (max === null) return null;

  const remaining = max - current;
  const threshold = Math.max(1, Math.ceil(max * 0.2));
  if (remaining > threshold) return null;

  return {
    current,
    max,
    remaining,
    isAtLimit: current >= max,
    percentage: Math.min((current / max) * 100, 100),
  };
}
