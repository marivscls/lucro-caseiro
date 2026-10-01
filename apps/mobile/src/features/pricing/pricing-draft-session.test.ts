import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createPricingDraftSession } from "./pricing-draft-session";
import {
  clearPricingDraft,
  usePricingDraft,
  type PricingDraft,
} from "./use-pricing-draft";

const draft: PricingDraft = {
  alternative: "",
  productId: "",
  ingredient: "12,50",
  packaging: "1,25",
  labor: "",
  fixed: "",
  production: "",
  revenue: "",
  allocation: "unit",
  profit: "5,00",
  profitMode: "money",
  fees: "",
  channelName: "",
  source: "manual",
  packagingIds: [],
};

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: () => Promise.resolve(value),
    setItem: (_key: string, next: string) => {
      value = next;
      return Promise.resolve();
    },
    removeItem: () => {
      value = null;
      return Promise.resolve();
    },
  };
}

afterEach(() => {
  cleanup();
  clearPricingDraft();
});

describe("rascunho de precificação após interrupção", () => {
  it("restaura vírgulas, campos ainda ausentes e etapa em uma nova sessão", async () => {
    const storage = memoryStorage();
    const first = createPricingDraftSession(storage);
    await first.persist.rehydrate();
    first.setState({ key: '["conta-A",null]', draft, step: 3 });
    const reopened = createPricingDraftSession(storage);
    await reopened.persist.rehydrate();
    expect(reopened.getState()).toMatchObject({
      key: '["conta-A",null]',
      draft,
      step: 3,
      hydrated: true,
    });
    expect(reopened.getState().draft?.labor).toBe("");
  });

  it.each([
    "{invalid",
    JSON.stringify({ version: 1, state: { key: "A", draft, step: "3" } }),
    JSON.stringify({
      version: 1,
      state: { key: "A", draft: { ingredient: "12,50" }, step: 3 },
    }),
  ])(
    "abre sem rascunho quando o armazenamento não tem um registro válido: %s",
    async (stored) => {
      const session = createPricingDraftSession(memoryStorage(stored));
      await session.persist.rehydrate();
      expect(session.getState()).toMatchObject({
        key: null,
        draft: null,
        step: 1,
        hydrated: true,
      });
    },
  );

  it("não sobrescreve uma edição iniciada antes da leitura do armazenamento terminar", async () => {
    let release: ((value: string | null) => void) | undefined;
    const read = new Promise<string | null>((resolve) => {
      release = resolve;
    });
    const session = createPricingDraftSession({
      getItem: () => read,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    session.setState({ key: "nova", draft: { ...draft, ingredient: "25,50" }, step: 2 });
    release?.(JSON.stringify({ version: 1, state: { key: "antiga", draft, step: 3 } }));
    await waitFor(() => expect(session.getState().hydrated).toBe(true));
    expect(session.getState()).toMatchObject({
      key: "nova",
      draft: { ingredient: "25,50" },
      step: 2,
    });
  });

  it("não mostra o rascunho de outra conta nem de outra importação", async () => {
    const first = renderHook(() => usePricingDraft(undefined, '["A",null]'));
    await waitFor(() => expect(first.result.current.hydrated).toBe(true));
    act(() => {
      first.result.current.update(draft);
      first.result.current.updateStep(3);
    });
    first.unmount();
    const other = renderHook(() => usePricingDraft(2.5, '["B",2.5]'));
    expect(other.result.current.hasSession).toBe(false);
    expect(other.result.current.draft.ingredient).toBe("2,50");
    expect(other.result.current.draft.profit).toBe("");
    act(() => other.result.current.update({ packaging: "0,50" }));
    expect(other.result.current.savedStep).toBe(1);
  });

  it("limpa os campos e a etapa ao encerrar a conta", async () => {
    const form = renderHook(() => usePricingDraft(undefined, '["A",null]'));
    await waitFor(() => expect(form.result.current.hydrated).toBe(true));
    act(() => {
      form.result.current.update(draft);
      form.result.current.updateStep(3);
    });
    act(() => clearPricingDraft());
    expect(form.result.current.hasSession).toBe(false);
    expect(form.result.current.draft.ingredient).toBe("");
    expect(form.result.current.savedStep).toBe(1);
  });
});
