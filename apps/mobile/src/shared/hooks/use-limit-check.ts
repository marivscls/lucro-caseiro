import { useLimits } from "../../features/subscription/hooks";
import { usePaywall } from "./use-paywall";

type Resource = "sales" | "clients" | "recipes" | "packaging";

const LIMIT_MAP: Record<Resource, { current: string; max: string }> = {
  sales: { current: "currentSalesThisMonth", max: "maxSalesPerMonth" },
  clients: { current: "currentClients", max: "maxClients" },
  recipes: { current: "currentRecipes", max: "maxRecipes" },
  packaging: { current: "currentPackaging", max: "maxPackaging" },
};

export function useLimitCheck(resource: Resource) {
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((s) => s.show);

  const map = LIMIT_MAP[resource];
  const current = (limits?.[map.current as keyof typeof limits] as number) ?? 0;
  const max = (limits?.[map.max as keyof typeof limits] as number) ?? Infinity;
  const isAtLimit = current >= max;

  function checkAndBlock(): boolean {
    if (isAtLimit) {
      showPaywall(resource);
      return true;
    }
    return false;
  }

  return { isAtLimit, current, max, checkAndBlock };
}
