import { useCallback, useEffect } from "react";
import { useFeature } from "@lucro-caseiro/ui";

import { useAuth } from "../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../analytics/tracker";
import { useLimits } from "../subscription/hooks";
import { nextStepFor, type DiscoveryTrigger } from "./domain";
import { useDiscoveryStore } from "./store";

/** As contagens podem não ter sido atualizadas ainda: conta o item recém-criado. */
function countAfter(
  trigger: DiscoveryTrigger,
  limits: { currentProducts: number; currentSalesThisMonth: number } | undefined,
): number {
  if (trigger === "product_created") return (limits?.currentProducts ?? 0) + 1;
  if (trigger === "sale_completed") return (limits?.currentSalesThisMonth ?? 0) + 1;
  return 1;
}

/**
 * Depois de uma ação concluída, mostra no rodapé o próximo passo que leva a um
 * recurso relacionado. Cada passo aparece uma vez por conta.
 */
export function useOfferNextStep() {
  const userId = useAuth((state) => state.userId);
  const load = useDiscoveryStore((state) => state.load);
  const recipesAvailable = useFeature("fichaTecnica");
  const { data: limits } = useLimits();

  useEffect(() => {
    if (userId) void load(userId);
  }, [load, userId]);

  return useCallback(
    (trigger: DiscoveryTrigger) => {
      if (!userId) return;
      const store = useDiscoveryStore.getState();
      const seen = store.accounts[userId]?.seenSteps ?? [];
      const count = countAfter(trigger, limits);
      const step = nextStepFor(trigger, count, seen, { recipesAvailable });
      if (!step) return;
      store.markStepSeen(userId, step.id);
      store.showBanner(step);
      void trackAnalyticsAction("discovery_step_shown", useAuth.getState().token, {
        step: step.id,
      });
    },
    [limits, recipesAvailable, userId],
  );
}
