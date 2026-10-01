import { describe, expect, it, vi } from "vitest";
import { CREATE_DRAFT_KEY, CREATE_DRAFT_TTL, createFormDraftSession } from "./session";
import { CREATE_DRAFT_FEATURES, parseCreateDraft } from "./schemas";
import { draftFixtures } from "./fixtures.test-support";

function memoryStorage(initial: string | null = null) {
  let value = initial;
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
    read: () => value,
  };
}

describe("cadastros interrompidos: sessão por usuário", () => {
  it.each(CREATE_DRAFT_FEATURES)(
    "recupera campos e etapa de %s numa nova sessão",
    async (feature) => {
      const storage = memoryStorage();
      const first = createFormDraftSession(storage);
      await first.activate("A");
      first.save("A", feature, draftFixtures[feature]);
      await first.flush();
      const reopened = createFormDraftSession(storage);
      await reopened.activate("A");
      expect(reopened.getSnapshot().records[feature]?.data).toEqual(
        draftFixtures[feature],
      );
    },
  );

  it.each(CREATE_DRAFT_FEATURES)(
    "descarte de %s não ressuscita uma escrita pendente",
    async (feature) => {
      const storage = memoryStorage();
      const first = createFormDraftSession(storage);
      await first.activate("A");
      first.save("A", feature, draftFixtures[feature]);
      first.discard("A", feature);
      await first.flush();
      const reopened = createFormDraftSession(storage);
      await reopened.activate("A");
      expect(reopened.getSnapshot().records).toEqual({});
      expect(storage.read()).toBeNull();
    },
  );

  it("isola usuários e apaga o registro antigo também no disco", async () => {
    const storage = memoryStorage();
    const first = createFormDraftSession(storage);
    await first.activate("A");
    first.save("A", "suppliers", draftFixtures.suppliers);
    await first.flush();
    await first.activate("B");
    first.save("A", "quotes", draftFixtures.quotes); // Stale component cannot write.
    expect(first.getSnapshot().records).toEqual({});
    await first.flush();
    await first.activate("A");
    expect(first.getSnapshot().records).toEqual({});
  });

  it("logout limpa todos os formulários com writes ainda na fila", async () => {
    const storage = memoryStorage();
    const session = createFormDraftSession(storage);
    await session.activate("A");
    for (const feature of CREATE_DRAFT_FEATURES)
      session.save("A", feature, draftFixtures[feature]);
    await session.clear();
    expect(session.getSnapshot().records).toEqual({});
    expect(storage.read()).toBeNull();
  });

  it("uma leitura atrasada não repõe um rascunho depois do logout", async () => {
    let release!: (value: string | null) => void;
    const getItem = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          release = resolve;
        }),
    );
    const session = createFormDraftSession({
      getItem,
      setItem: async () => {},
      removeItem: async () => {},
    });
    const loading = session.activate("A");
    await vi.waitFor(() => expect(getItem).toHaveBeenCalled());
    await session.clear();
    release(
      JSON.stringify({
        version: 1,
        ownerId: "A",
        records: { quotes: { data: draftFixtures.quotes, savedAt: Date.now() } },
      }),
    );
    await loading;
    expect(session.getSnapshot()).toMatchObject({ ownerId: null, records: {} });
  });

  it("cancelar durante a leitura apaga somente aquele formulário", async () => {
    let release!: (value: string | null) => void;
    const storage = memoryStorage();
    const getItem = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          release = resolve;
        }),
    );
    const session = createFormDraftSession({ ...storage, getItem });
    const loading = session.activate("A");
    await vi.waitFor(() => expect(getItem).toHaveBeenCalled());
    session.discard("A", "quotes");
    release(
      JSON.stringify({
        version: 1,
        ownerId: "A",
        records: {
          quotes: { data: draftFixtures.quotes, savedAt: Date.now() },
          suppliers: { data: draftFixtures.suppliers, savedAt: Date.now() },
        },
      }),
    );
    await loading;
    await session.flush();
    expect(Object.keys(session.getSnapshot().records)).toEqual(["suppliers"]);
    expect(storage.read()).not.toContain('"quotes"');
  });

  it.each([
    "{malformed",
    JSON.stringify({ version: 9, ownerId: "A" }),
    JSON.stringify({
      version: 1,
      ownerId: "A",
      records: {
        recipes: { data: { ...draftFixtures.recipes, step: 99 }, savedAt: Date.now() },
      },
    }),
  ])("remove storage inválido sem quebrar a tela: %s", async (stored) => {
    const storage = memoryStorage(stored);
    const session = createFormDraftSession(storage);
    await session.activate("A");
    await session.flush();
    expect(session.getSnapshot()).toMatchObject({ ready: true, records: {} });
    expect(storage.read()).toBeNull();
  });

  it("expira em 24 horas, sem descartar outro rascunho recente", async () => {
    const time = 3 * CREATE_DRAFT_TTL;
    const stored = {
      version: 1,
      ownerId: "A",
      records: {
        recipes: { data: draftFixtures.recipes, savedAt: time - CREATE_DRAFT_TTL },
        quotes: { data: draftFixtures.quotes, savedAt: time - 500 },
      },
    };
    const storage = memoryStorage(JSON.stringify(stored));
    const session = createFormDraftSession(storage, () => time);
    await session.activate("A");
    await session.flush();
    expect(Object.keys(session.getSnapshot().records)).toEqual(["quotes"]);
    expect(storage.read()).not.toContain('"recipes"');
  });

  it("não armazena credenciais, arquivos, respostas ou fotos fora da whitelist", async () => {
    const injected = {
      ...draftFixtures.labels,
      token: "qa-secret",
      logoUri: "file://private-image",
      apiResponse: { client: "PII" },
      labelData: { ...draftFixtures.labels.labelData, nutrition: { calories: "extra" } },
    };
    const cleaned = parseCreateDraft("labels", injected);
    expect(cleaned).toEqual(draftFixtures.labels);
    const storage = memoryStorage();
    const session = createFormDraftSession(storage);
    await session.activate("A");
    session.save("A", "labels", injected);
    await session.flush();
    expect(storage.read()).not.toMatch(/qa-secret|private-image|PII|nutrition/);
  });

  it("informa falha de storage e continua pronto para o formulário", async () => {
    const storage = {
      getItem: () => Promise.reject(new Error("unavailable")),
      setItem: () => Promise.reject(new Error("quota")),
      removeItem: async () => {},
    };
    const session = createFormDraftSession(storage);
    await session.activate("A");
    session.save("A", "quotes", draftFixtures.quotes);
    await session.flush();
    expect(session.getSnapshot()).toMatchObject({ ready: true, error: true });
    expect(CREATE_DRAFT_KEY).not.toMatch(/token|auth/);
  });
});
