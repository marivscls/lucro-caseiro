import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { apiClient } from "../utils/api-client";
import { useNetwork } from "./use-network";

export interface OfflineOperation {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  endpoint: string;
  payload?: unknown;
  createdAt: string;
  status: "pending" | "failed";
  retries: number;
}

interface OfflineQueueState {
  operations: OfflineOperation[];
  isSyncing: boolean;
  enqueue: (
    op: Omit<OfflineOperation, "id" | "createdAt" | "status" | "retries">,
  ) => void;
  dequeue: (id: string) => void;
  markFailed: (id: string) => void;
  setSyncing: (syncing: boolean) => void;
  clear: () => void;
}

const MAX_QUEUE_SIZE = 100;

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      operations: [],
      isSyncing: false,

      enqueue: (op) =>
        set((state) => {
          if (state.operations.length >= MAX_QUEUE_SIZE) return state;
          return {
            operations: [
              ...state.operations,
              {
                ...op,
                // eslint-disable-next-line sonarjs/pseudo-random -- non-security ID for offline queue
                id: `${Date.now()}-${String(Math.random()).slice(2, 10)}`,
                createdAt: new Date().toISOString(),
                status: "pending" as const,
                retries: 0,
              },
            ],
          };
        }),

      dequeue: (id) =>
        set((state) => ({
          operations: state.operations.filter((o) => o.id !== id),
        })),

      markFailed: (id) =>
        set((state) => ({
          operations: state.operations.map((o) =>
            o.id === id ? { ...o, status: "failed" as const, retries: o.retries + 1 } : o,
          ),
        })),

      setSyncing: (syncing) => set({ isSyncing: syncing }),

      clear: () => set({ operations: [] }),
    }),
    {
      name: "offline-queue",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ operations: state.operations }),
    },
  ),
);

/**
 * Process the offline queue — call this when connection is restored.
 */
export async function processOfflineQueue(authToken: string): Promise<{
  synced: number;
  failed: number;
}> {
  const { operations, dequeue, markFailed, setSyncing } = useOfflineQueue.getState();

  const pending = operations.filter(
    (o) => o.status === "pending" || (o.status === "failed" && o.retries < 3),
  );

  if (pending.length === 0) return { synced: 0, failed: 0 };

  setSyncing(true);
  let synced = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      await apiClient(op.endpoint, {
        method: op.method,
        body: op.payload,
        token: authToken,
      });
      dequeue(op.id);
      synced++;
    } catch {
      markFailed(op.id);
      failed++;
    }
  }

  setSyncing(false);
  return { synced, failed };
}

/**
 * Subscribe to network changes and auto-sync when coming back online.
 */
export function setupAutoSync(getAuthToken: () => string | null): () => void {
  let wasOffline = false;

  return useNetwork.subscribe((state) => {
    if (!state.isOnline) {
      wasOffline = true;
      return;
    }

    if (wasOffline && state.isOnline) {
      wasOffline = false;
      const token = getAuthToken();
      if (token) {
        processOfflineQueue(token).catch(() => {});
      }
    }
  });
}
