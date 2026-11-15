import type { PlanFeature } from "@lucro-caseiro/contracts";

import { useProfile } from "../../features/subscription/hooks";
import { isFeatureLocked } from "../../features/subscription/limits";
import { usePaywall } from "./use-paywall";

/**
 * Gate de uma feature do plano: `locked` quando o plano ativo não tem a feature
 * (decidido pela matriz de `@lucro-caseiro/contracts`, a mesma do backend) e
 * `blockIfLocked()` abre o paywall com a copy de `paywallResource` e devolve
 * true para a tela não seguir com a ação.
 */
export function useFeatureGate(feature: PlanFeature, paywallResource: string = feature) {
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const locked = isFeatureLocked(profile, feature);

  function blockIfLocked(): boolean {
    if (!locked) return false;
    showPaywall(paywallResource);
    return true;
  }

  return { locked, blockIfLocked };
}
