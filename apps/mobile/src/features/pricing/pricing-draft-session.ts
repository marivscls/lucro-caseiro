import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { PricingDraft, PricingStep } from "./use-pricing-draft";

interface DraftSession {
  key: string | null;
  draft: PricingDraft | null;
  step: PricingStep;
  hydrated: boolean;
  markHydrated: () => void;
}

function isStoredDraft(value: unknown): value is PricingDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  const textFields = [
    "alternative",
    "productId",
    "ingredient",
    "packaging",
    "labor",
    "fixed",
    "production",
    "revenue",
    "profit",
    "fees",
    "channelName",
  ];
  return (
    textFields.every(
      (field) => typeof draft[field] === "string" && draft[field].length <= 2000,
    ) &&
    (draft.allocation === "unit" || draft.allocation === "revenue") &&
    (draft.profitMode === "money" || draft.profitMode === "markup") &&
    ["manual", "product", "recipe"].includes(String(draft.source)) &&
    (draft.recipeId === undefined || typeof draft.recipeId === "string") &&
    Array.isArray(draft.packagingIds) &&
    draft.packagingIds.every((id) => typeof id === "string")
  );
}

/** One device draft, matched to the account and import parameters before use. */
export function createPricingDraftSession(storage: StateStorage) {
  return create<DraftSession>()(
    persist(
      (set) => ({
        key: null,
        draft: null,
        step: 1,
        hydrated: false,
        markHydrated: () => set({ hydrated: true }),
      }),
      {
        name: "pricing-draft:v1",
        version: 1,
        storage: createJSONStorage(() => storage),
        partialize: ({ key, draft, step }) => ({ key, draft, step }),
        merge: (stored, current) => {
          // A user edit made while storage is loading wins over the old draft.
          if (current.key !== null || !stored || typeof stored !== "object")
            return current;
          const value = stored as Record<string, unknown>;
          if (
            typeof value.key !== "string" ||
            !isStoredDraft(value.draft) ||
            ![1, 2, 3].includes(value.step as number)
          )
            return current;
          return {
            ...current,
            key: value.key,
            draft: value.draft,
            step: value.step as PricingStep,
          };
        },
        onRehydrateStorage: (state) => () => state.markHydrated(),
      },
    ),
  );
}
