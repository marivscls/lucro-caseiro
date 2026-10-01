import { useState } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/use-auth";
import {
  CREATE_DRAFT_FEATURES,
  type CreateDraftData,
  type CreateDraftFeature,
} from "./schemas";
import { draftDefaults, draftFixtures } from "./fixtures.test-support";

const storage = vi.hoisted(() => ({
  value: null as string | null,
  read: null as Promise<string | null> | null,
}));
vi.mock("./storage", () => ({
  createDraftStorage: {
    getItem: () => storage.read ?? Promise.resolve(storage.value),
    setItem: (_key: string, value: string) => {
      storage.value = value;
      return Promise.resolve();
    },
    removeItem: () => {
      storage.value = null;
      return Promise.resolve();
    },
  },
}));
import {
  clearCreateFormDrafts,
  createFormDrafts,
  useCreateFormDraft,
} from "./use-create-form-draft";

function useForm<K extends CreateDraftFeature>(feature: K, enabled = true) {
  const [snapshot, setSnapshot] = useState<CreateDraftData<K>>(draftDefaults[feature]);
  const session = useCreateFormDraft({
    feature,
    enabled,
    snapshot,
    restore: setSnapshot,
  });
  return { snapshot, setSnapshot, session };
}
beforeEach(async () => {
  storage.read = null;
  await clearCreateFormDrafts();
  useAuth.setState({ userId: "A" });
});
afterEach(async () => {
  cleanup();
  await clearCreateFormDrafts();
  useAuth.setState({ userId: null });
});

describe("retomada sem ressuscitar cadastro descartado", () => {
  it.each(CREATE_DRAFT_FEATURES)(
    "%s: recarga, limpar, cancelar/concluir e novo cadastro vazio",
    async (feature) => {
      const first = renderHook(() => useForm(feature));
      await waitFor(() => expect(first.result.current.session.ready).toBe(true));
      act(() => first.result.current.setSnapshot(draftFixtures[feature]));
      await act(() => createFormDrafts.flush());
      first.unmount();
      const reopened = renderHook(() => useForm(feature));
      await waitFor(() =>
        expect(reopened.result.current.snapshot).toEqual(draftFixtures[feature]),
      );
      expect(reopened.result.current.session.restored).toBe(true);
      act(() => reopened.result.current.session.discard());
      await act(() => createFormDrafts.flush());
      expect(reopened.result.current.snapshot).toEqual(draftDefaults[feature]);
      expect(createFormDrafts.getSnapshot().records[feature]).toBeUndefined();
      reopened.unmount();
      const empty = renderHook(() => useForm(feature));
      await waitFor(() => expect(empty.result.current.session.ready).toBe(true));
      expect(empty.result.current.snapshot).toEqual(draftDefaults[feature]);
    },
  );

  it("troca de conta com formulário montado não grava nem exibe o rascunho de A para B", async () => {
    const form = renderHook(() => useForm("suppliers"));
    await waitFor(() => expect(form.result.current.session.ready).toBe(true));
    act(() => form.result.current.setSnapshot(draftFixtures.suppliers));
    await act(() => createFormDrafts.flush());
    act(() => useAuth.setState({ userId: "B" }));
    await waitFor(() =>
      expect(form.result.current.snapshot).toEqual(draftDefaults.suppliers),
    );
    await waitFor(() => expect(createFormDrafts.getSnapshot().ownerId).toBe("B"));
    await act(() => createFormDrafts.flush());
    expect(createFormDrafts.getSnapshot().records).toEqual({});
    expect(storage.value).toBeNull();
  });

  it("edição de registro não restaura nem altera rascunho de criação", async () => {
    await createFormDrafts.activate("A");
    createFormDrafts.save("A", "quotes", draftFixtures.quotes);
    await createFormDrafts.flush();
    const editing = renderHook(() => useForm("quotes", false));
    expect(editing.result.current.snapshot).toEqual(draftDefaults.quotes);
    act(() => editing.result.current.session.discard());
    await act(() => createFormDrafts.flush());
    expect(createFormDrafts.getSnapshot().records.quotes?.data).toEqual(
      draftFixtures.quotes,
    );
  });

  it("logout real do store de auth aguarda apagar rascunhos antes de abrir outra sessão", async () => {
    const form = renderHook(() => useForm("quotes"));
    await waitFor(() => expect(form.result.current.session.ready).toBe(true));
    act(() => form.result.current.setSnapshot(draftFixtures.quotes));
    await act(() => createFormDrafts.flush());
    expect(storage.value).toContain("Proposta QA");
    await act(() => useAuth.getState().signOut());
    expect(storage.value).toBeNull();
    expect(form.result.current.snapshot).toEqual(draftDefaults.quotes);
    act(() => useAuth.setState({ userId: "A" }));
    await waitFor(() => expect(form.result.current.session.ready).toBe(true));
    expect(form.result.current.snapshot).toEqual(draftDefaults.quotes);
  });

  it("edição recebida durante hidratação vence o rascunho antigo", async () => {
    let release!: (value: string | null) => void;
    storage.read = new Promise<string | null>((resolve) => {
      release = resolve;
    });
    const form = renderHook(() => useForm("recipes"));
    await waitFor(() => expect(createFormDrafts.getSnapshot().ownerId).toBe("A"));
    const current = {
      ...draftFixtures.recipes,
      name: "Edição mais nova QA",
      yieldQuantity: "1,75",
    };
    act(() => form.result.current.setSnapshot(current));
    await act(async () => {
      release(
        JSON.stringify({
          version: 1,
          ownerId: "A",
          records: {
            recipes: { data: draftFixtures.recipes, savedAt: Date.now() },
          },
        }),
      );
      await createFormDrafts.activate("A");
    });
    await waitFor(() => expect(form.result.current.session.ready).toBe(true));
    await act(() => createFormDrafts.flush());
    expect(form.result.current.snapshot).toEqual(current);
    expect(createFormDrafts.getSnapshot().records.recipes?.data).toEqual(current);
    storage.read = null;
  });
});
