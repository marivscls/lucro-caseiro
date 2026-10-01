import {
  CREATE_DRAFT_FEATURES,
  parseCreateDraft,
  type CreateDraftData,
  type CreateDraftFeature,
} from "./schemas";
import type { CreateDraftStorage } from "./storage";

export const CREATE_DRAFT_KEY = "create-form-drafts.v1";
export const CREATE_DRAFT_TTL = 24 * 60 * 60 * 1000;
const MAX_STORED_LENGTH = 64000;
type Records = Partial<{
  [K in CreateDraftFeature]: { data: CreateDraftData<K>; savedAt: number };
}>;
interface DraftState {
  ownerId: string | null;
  ready: boolean;
  error: boolean;
  records: Records;
}

/** Serialized writes and a generation guard prevent cleared drafts from coming back. */
export function createFormDraftSession(storage: CreateDraftStorage, now = Date.now) {
  let state: DraftState = { ownerId: null, ready: false, error: false, records: {} };
  let generation = 0;
  let queue = Promise.resolve();
  let loading = Promise.resolve();
  let discardedDuringLoad = new Set<CreateDraftFeature>();
  const listeners = new Set<() => void>();
  function publish(patch: Partial<DraftState>) {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  }
  function enqueue(operation: () => Promise<void>) {
    queue = queue.then(operation).catch(() => {
      publish({ error: true });
    });
    return queue;
  }
  function persist() {
    const currentGeneration = generation;
    const snapshot = JSON.stringify({
      version: 1,
      ownerId: state.ownerId,
      records: state.records,
    });
    if (snapshot.length > MAX_STORED_LENGTH) {
      publish({ error: true });
      return;
    }
    void enqueue(async () => {
      if (currentGeneration !== generation) return;
      if (Object.keys(JSON.parse(snapshot).records).length)
        await storage.setItem(CREATE_DRAFT_KEY, snapshot);
      else await storage.removeItem(CREATE_DRAFT_KEY);
    });
  }
  async function activate(ownerId: string) {
    if (state.ownerId === ownerId) return loading;
    const currentGeneration = ++generation;
    discardedDuringLoad = new Set();
    publish({ ownerId, ready: false, error: false, records: {} });
    loading = (async () => {
      try {
        await queue;
        const raw = await storage.getItem(CREATE_DRAFT_KEY);
        if (generation !== currentGeneration) return;
        let records: Records = {};
        if (raw) {
          const stored = JSON.parse(raw) as {
            version?: unknown;
            ownerId?: unknown;
            records?: unknown;
          };
          if (
            stored.version === 1 &&
            stored.ownerId === ownerId &&
            stored.records &&
            typeof stored.records === "object"
          ) {
            for (const feature of CREATE_DRAFT_FEATURES) {
              const record = (stored.records as Record<string, unknown>)[feature];
              if (!record || typeof record !== "object") continue;
              const { data, savedAt } = record as { data: unknown; savedAt: unknown };
              const parsed = parseCreateDraft(feature, data);
              if (
                !discardedDuringLoad.has(feature) &&
                parsed &&
                typeof savedAt === "number" &&
                Number.isFinite(savedAt) &&
                savedAt <= now() &&
                now() - savedAt < CREATE_DRAFT_TTL
              )
                records = { ...records, [feature]: { data: parsed, savedAt } };
            }
          }
        }
        publish({ records, ready: true });
        persist(); // Purges mismatched, expired and invalid records from storage too.
      } catch {
        if (generation !== currentGeneration) return;
        publish({ ready: true, error: true, records: {} });
        void enqueue(() => storage.removeItem(CREATE_DRAFT_KEY));
      }
    })();
    return loading;
  }
  function save<K extends CreateDraftFeature>(
    ownerId: string,
    feature: K,
    data: CreateDraftData<K>,
  ) {
    if (!state.ready || state.ownerId !== ownerId) return;
    const parsed = parseCreateDraft(feature, data);
    if (!parsed) {
      publish({ error: true });
      return;
    }
    publish({
      records: { ...state.records, [feature]: { data: parsed, savedAt: now() } },
    });
    persist();
  }
  function discard(ownerId: string, feature: CreateDraftFeature) {
    if (state.ownerId !== ownerId) return;
    if (!state.ready) {
      discardedDuringLoad.add(feature);
      return;
    }
    const records = { ...state.records };
    delete records[feature];
    publish({ records });
    persist();
  }
  function clear() {
    ++generation;
    discardedDuringLoad = new Set();
    publish({ ownerId: null, ready: false, error: false, records: {} });
    return enqueue(() => storage.removeItem(CREATE_DRAFT_KEY));
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    activate,
    save,
    discard,
    clear,
    flush: () => queue,
  };
}
