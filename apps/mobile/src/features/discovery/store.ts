import { create } from "zustand";

import { useAuth } from "../../shared/hooks/use-auth";
import { asyncStorage } from "../../shared/utils/async-storage";
import {
  EMPTY_DISCOVERY_PROGRESS,
  parseDiscoveryProgress,
  type DiscoveryProgress,
  type NextStep,
  type NextStepId,
  type TrialChecklistId,
} from "./domain";

const storageKey = (userId: string) => `discovery:v1:${userId}`;
const READ_TIMEOUT_MS = 1500;

async function readBounded(key: string): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      asyncStorage.getItem(key),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), READ_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

interface DiscoveryState {
  accounts: Record<string, DiscoveryProgress>;
  ready: Record<string, boolean>;
  /** Próximo passo visível no rodapé (um por vez). */
  banner: NextStep | null;
  load: (userId: string) => Promise<void>;
  markStepSeen: (userId: string, id: NextStepId) => void;
  markOpened: (userId: string, id: TrialChecklistId) => void;
  dismissChecklist: (userId: string) => void;
  showBanner: (step: NextStep) => void;
  hideBanner: () => void;
}

function persist(userId: string, progress: DiscoveryProgress) {
  void asyncStorage.setItem(storageKey(userId), JSON.stringify(progress)).catch(() => {});
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => {
  function update(
    userId: string,
    change: (current: DiscoveryProgress) => DiscoveryProgress,
  ) {
    const next = change(get().accounts[userId] ?? EMPTY_DISCOVERY_PROGRESS);
    set((state) => ({ accounts: { ...state.accounts, [userId]: next } }));
    persist(userId, next);
  }

  return {
    accounts: {},
    ready: {},
    banner: null,
    load: async (userId) => {
      if (get().ready[userId]) return;
      const saved = parseDiscoveryProgress(await readBounded(storageKey(userId)));
      set((state) => {
        const current = state.accounts[userId];
        // Mudanças feitas enquanto o aparelho lia prevalecem sobre o salvo.
        const merged: DiscoveryProgress = current
          ? {
              seenSteps: [...new Set([...saved.seenSteps, ...current.seenSteps])],
              opened: [...new Set([...saved.opened, ...current.opened])],
              checklistDismissed: saved.checklistDismissed || current.checklistDismissed,
            }
          : saved;
        return {
          accounts: { ...state.accounts, [userId]: merged },
          ready: { ...state.ready, [userId]: true },
        };
      });
    },
    markStepSeen: (userId, id) =>
      update(userId, (current) =>
        current.seenSteps.includes(id)
          ? current
          : { ...current, seenSteps: [...current.seenSteps, id] },
      ),
    markOpened: (userId, id) =>
      update(userId, (current) =>
        current.opened.includes(id)
          ? current
          : { ...current, opened: [...current.opened, id] },
      ),
    dismissChecklist: (userId) =>
      update(userId, (current) => ({ ...current, checklistDismissed: true })),
    showBanner: (step) => set({ banner: step }),
    hideBanner: () => set({ banner: null }),
  };
});

/** Progresso da conta logada (vazio enquanto carrega ou sem conta). */
export function useDiscoveryProgress(): {
  userId: string | null;
  ready: boolean;
  progress: DiscoveryProgress;
} {
  const userId = useAuth((state) => state.userId);
  const progress = useDiscoveryStore((state) =>
    userId ? state.accounts[userId] : undefined,
  );
  const ready = useDiscoveryStore((state) => (userId ? !!state.ready[userId] : false));
  return {
    userId: userId ?? null,
    ready,
    progress: progress ?? EMPTY_DISCOVERY_PROGRESS,
  };
}
