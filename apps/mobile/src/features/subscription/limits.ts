import type { FreemiumLimits, UserProfile } from "@lucro-caseiro/contracts";

import type { LimitResource } from "./limit-copy";
import { isProfilePremiumActive } from "./hooks";

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
  if (isProfilePremiumActive(profile)) return false;

  const { current, max } = getLimitUsage(limits, resource);
  return max !== null && current >= max;
}

export function getLimitBannerState(
  limits: FreemiumLimits | undefined,
  profile: UserProfile | null | undefined,
  resource: LimitResource,
): LimitBannerState | null {
  if (isProfilePremiumActive(profile)) return null;

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
