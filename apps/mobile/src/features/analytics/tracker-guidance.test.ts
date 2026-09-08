import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackAnalyticsAction } from "./tracker";
import { useGuidanceStore } from "../../shared/guidance/guidance-store";
const mocks = vi.hoisted(() => ({
  userId: "a",
  token: "test-session",
  record: vi.fn(),
  getItem: vi.fn(),
}));
vi.mock("../../shared/hooks/use-auth", () => ({
  useAuth: { getState: () => ({ userId: mocks.userId, token: mocks.token }) },
}));
vi.mock("./api", () => ({ recordProductAnalyticsEvents: mocks.record }));
vi.mock("./installation", () => ({
  getOrCreateInstallationId: () => Promise.resolve("test-installation"),
}));
vi.mock("./metadata", () => ({
  appMetadata: () => ({ platform: "web", appVersion: "test" }),
}));
vi.mock("../../shared/utils/async-storage", () => ({
  asyncStorage: { getItem: mocks.getItem, setItem: () => Promise.resolve(undefined) },
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId = "a";
  mocks.token = "test-session";
  mocks.getItem.mockResolvedValue(null);
  mocks.record.mockResolvedValue(undefined);
  useGuidanceStore.setState({ accounts: {}, ready: {} });
});
const names = () =>
  mocks.record.mock.calls.flatMap(([payload]) =>
    payload.events.map((event: { name: string }) => event.name),
  );
describe("conclusão confirmada e coleta best effort", () => {
  it("emite primeira conclusão uma vez e sem dados do formulário", async () => {
    await trackAnalyticsAction("product_created", mocks.token);
    await trackAnalyticsAction("product_created", mocks.token);
    await vi.waitFor(() =>
      expect(
        names().filter((name) => name === "guidance_products_task_completed"),
      ).toHaveLength(1),
    );
    expect(useGuidanceStore.getState().accounts.a.products?.completed).toBe(true);
    for (const [payload] of mocks.record.mock.calls)
      expect(Object.keys(payload.events[0]).sort((a, b) => a.localeCompare(b))).toEqual([
        "name",
        "type",
      ]);
  });
  it("não repete conclusão já persistida", async () => {
    mocks.getItem.mockResolvedValue('{"products":{"completed":true}}');
    await trackAnalyticsAction("product_created", mocks.token);
    await vi.waitFor(() => expect(useGuidanceStore.getState().ready.a).toBe(true));
    expect(names()).not.toContain("guidance_products_task_completed");
  });
  it("não conclui ao iniciar nem atribui resposta antiga a outra conta", async () => {
    await trackAnalyticsAction("guidance_products_task_started", mocks.token);
    expect(useGuidanceStore.getState().accounts.a?.products?.completed).not.toBe(true);
    mocks.userId = "b";
    mocks.token = "new-session";
    await trackAnalyticsAction("product_created", "test-session");
    expect(useGuidanceStore.getState().accounts.b?.products?.completed).not.toBe(true);
  });
  it("não marca a nova conta quando a leitura da conta anterior termina", async () => {
    let finish!: (value: string | null) => void;
    mocks.getItem.mockReturnValue(
      new Promise<string | null>((resolve) => {
        finish = resolve;
      }),
    );
    await trackAnalyticsAction("product_created", mocks.token);
    mocks.userId = "b";
    mocks.token = "new-session";
    finish(null);
    await vi.waitFor(() => expect(useGuidanceStore.getState().ready.a).toBe(true));
    expect(useGuidanceStore.getState().accounts.b?.products?.completed).not.toBe(true);
    expect(names()).not.toContain("guidance_products_task_completed");
  });
  it("indisponibilidade da coleta não desfaz tarefa concluída", async () => {
    mocks.record.mockRejectedValue(new Error("rede"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(
      trackAnalyticsAction("finance_entry_created", mocks.token),
    ).resolves.toBeUndefined();
    await vi.waitFor(() =>
      expect(useGuidanceStore.getState().accounts.a.finance?.completed).toBe(true),
    );
  });
});
