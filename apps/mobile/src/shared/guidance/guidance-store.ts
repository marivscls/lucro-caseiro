import { create } from "zustand";
import { asyncStorage } from "../utils/async-storage";
import {
  advanceGuidance,
  parseGuidance,
  type GuidanceArea,
  type GuidanceDecision,
  type GuidanceProgress,
} from "./guidance.domain";
type AccountProgress = Partial<Record<GuidanceArea, GuidanceProgress>>;
interface GuidanceState {
  accounts: Record<string, AccountProgress>;
  ready: Record<string, boolean>;
  load: (userId: string) => Promise<void>;
  mark: (userId: string, area: GuidanceArea, decision: GuidanceDecision) => void;
}
const loading = new Map<string, Promise<void>>();
const writes = new Map<string, Promise<void>>();
const storageKey = (userId: string) => `screen-guidance:v1:${userId}`;
async function readBounded(key: string): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      asyncStorage.getItem(key),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 1500);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export const useGuidanceStore = create<GuidanceState>((set, get) => ({
  accounts: {},
  ready: {},
  load: async (userId) => {
    if (get().ready[userId]) return;
    const pending = loading.get(userId);
    if (pending) return pending;
    const operation = (async () => {
      const saved = parseGuidance(await readBounded(storageKey(userId)));
      set((state) => {
        const merged = { ...saved };
        for (const [area, progress] of Object.entries(state.accounts[userId] ?? {})) {
          const key = area as GuidanceArea;
          merged[key] = { ...saved[key], ...progress };
        }
        return {
          accounts: { ...state.accounts, [userId]: merged },
          ready: { ...state.ready, [userId]: true },
        };
      });
    })();
    loading.set(userId, operation);
    try {
      await operation;
    } finally {
      loading.delete(userId);
    }
  },
  mark: (userId, area, decision) => {
    const previous = get().accounts[userId]?.[area] ?? {};
    if (previous[decision]) return;
    set((state) => ({
      accounts: {
        ...state.accounts,
        [userId]: {
          ...state.accounts[userId],
          [area]: advanceGuidance(previous, decision),
        },
      },
    }));
    const pending = writes.get(userId) ?? Promise.resolve();
    const operation = pending
      .catch(() => undefined)
      .then(async () => {
        await get().load(userId);
        await asyncStorage.setItem(
          storageKey(userId),
          JSON.stringify(get().accounts[userId] ?? {}),
        );
      })
      .catch(() => undefined);
    writes.set(userId, operation);
    void operation.then(() => {
      if (writes.get(userId) === operation) writes.delete(userId);
    });
  },
}));
