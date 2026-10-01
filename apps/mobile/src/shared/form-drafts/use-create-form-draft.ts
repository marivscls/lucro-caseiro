import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "../hooks/use-auth";
import { createFormDrafts } from "./controller";
import type { CreateDraftData, CreateDraftFeature } from "./schemas";

export { createFormDrafts, clearCreateFormDrafts } from "./controller";

export function useCreateDraftRecord(feature: CreateDraftFeature) {
  const userId = useAuth((auth) => auth.userId);
  const state = useSyncExternalStore(
    createFormDrafts.subscribe,
    createFormDrafts.getSnapshot,
  );
  useEffect(() => {
    if (userId) void createFormDrafts.activate(userId);
  }, [userId, state.ownerId]);
  const ready = !userId || (state.ready && state.ownerId === userId);
  return {
    userId,
    ready,
    error: state.ownerId === userId && state.error,
    record: ready && userId ? state.records[feature] : undefined,
  };
}

export function useCreateFormDraft<K extends CreateDraftFeature>({
  feature,
  enabled,
  snapshot,
  restore,
  resetExtras,
}: {
  feature: K;
  enabled: boolean;
  snapshot: CreateDraftData<K>;
  restore: (data: CreateDraftData<K>) => void;
  resetExtras?: () => void;
}) {
  const { userId, ready, error, record } = useCreateDraftRecord(feature);
  const initial = useRef(snapshot);
  const callbacks = useRef({ restore, resetExtras });
  callbacks.current = { restore, resetExtras };
  const initialized = useRef<string | null>(null);
  const skipSnapshot = useRef<string | null>(null);
  const lastWritten = useRef<string | null>(null);
  const previousUser = useRef(userId);
  const [restored, setRestored] = useState(false);
  const serialized = JSON.stringify(snapshot);
  const defaultSerialized = JSON.stringify(initial.current);

  useEffect(() => {
    if (previousUser.current !== userId) {
      previousUser.current = userId;
      initialized.current = null;
      lastWritten.current = null;
      skipSnapshot.current = serialized;
      callbacks.current.restore(initial.current);
      callbacks.current.resetExtras?.();
      setRestored(false);
    }
  }, [userId, serialized]);

  useEffect(() => {
    if (!enabled) {
      initialized.current = null;
      return;
    }
    if (!ready || !userId || initialized.current === userId) return;
    initialized.current = userId;
    // An edit made during hydration takes precedence over the saved version.
    if (record && serialized === defaultSerialized) {
      skipSnapshot.current = serialized;
      callbacks.current.restore(record.data as CreateDraftData<K>);
      setRestored(true);
    }
  }, [enabled, ready, userId, record, serialized, defaultSerialized]);

  useEffect(() => {
    if (!enabled || !ready || !userId || initialized.current !== userId) return;
    if (skipSnapshot.current === serialized) return;
    skipSnapshot.current = null;
    if (lastWritten.current === serialized) return;
    lastWritten.current = serialized;
    if (serialized === defaultSerialized) createFormDrafts.discard(userId, feature);
    else
      createFormDrafts.save(
        userId,
        feature,
        JSON.parse(serialized) as CreateDraftData<K>,
      );
  }, [enabled, ready, userId, feature, serialized, defaultSerialized]);

  const discard = useCallback(() => {
    if (!enabled) return;
    skipSnapshot.current = serialized;
    lastWritten.current = null;
    if (userId) createFormDrafts.discard(userId, feature);
    callbacks.current.restore(initial.current);
    callbacks.current.resetExtras?.();
    setRestored(false);
  }, [enabled, userId, feature, serialized]);

  return { ready: !enabled || ready, error, restored, discard };
}
