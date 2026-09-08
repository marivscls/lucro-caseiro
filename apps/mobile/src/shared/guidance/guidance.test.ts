import { describe, expect, it, vi, beforeEach } from "vitest";
import { advanceGuidance, parseGuidance, shouldIntroduce } from "./guidance.domain";
import { completedAreas } from "./completion";
import { useGuidanceStore } from "./guidance-store";
const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock("../utils/async-storage", () => ({ asyncStorage: storage }));
beforeEach(() => {
  vi.clearAllMocks();
  useGuidanceStore.setState({ accounts: {}, ready: {} });
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});
describe("orientação e resultado são estados independentes", () => {
  it("abrir ajuda não conclui nem dispensa uma tarefa", () => {
    const progress = advanceGuidance({}, "presented");
    expect(progress.completed).toBeUndefined();
    expect(shouldIntroduce(progress, false)).toBe(true);
    expect(shouldIntroduce(advanceGuidance(progress, "dismissed"), false)).toBe(false);
    expect(shouldIntroduce({}, true)).toBe(false);
  });
  it("ignora armazenamento corrompido e propriedades fora do contrato", () => {
    expect(parseGuidance("invalid")).toEqual({});
    expect(parseGuidance('[{"products":true}]')).toEqual({});
    expect(
      parseGuidance(
        '{"products":{"completed":"true","dismissed":true},"unknown":{"completed":true}}',
      ),
    ).toEqual({ products: { presented: false, dismissed: true, completed: false } });
  });
  it("não confunde clique ou preparação com venda concluída", () => {
    expect(completedAreas("guidance_sales_task_started")).toEqual([]);
    expect(completedAreas("catalog_published")).toEqual([]);
    expect(completedAreas("catalog_content_published")).toEqual(["catalog"]);
    expect(completedAreas("product_created")).toEqual(["products"]);
    expect(completedAreas("pricing_result_viewed")).toEqual(["pricing"]);
    expect(completedAreas("sale_completed")).toEqual(["sales", "new_sale"]);
  });
  it("isola contas e conserva dispensa depois de carregar", async () => {
    storage.getItem.mockImplementation((key: string) =>
      Promise.resolve(key.endsWith(":a") ? '{"products":{"dismissed":true}}' : null),
    );
    await Promise.all([
      useGuidanceStore.getState().load("a"),
      useGuidanceStore.getState().load("b"),
    ]);
    expect(useGuidanceStore.getState().accounts.a.products?.dismissed).toBe(true);
    expect(useGuidanceStore.getState().accounts.b.products).toBeUndefined();
  });
  it("não perde uma decisão tomada enquanto a persistência carrega", async () => {
    let resolve!: (value: string) => void;
    storage.getItem.mockReturnValue(
      new Promise<string>((done) => {
        resolve = done;
      }),
    );
    const load = useGuidanceStore.getState().load("race");
    useGuidanceStore.getState().mark("race", "products", "dismissed");
    resolve('{"products":{"presented":true}}');
    await load;
    await vi.waitFor(() => expect(storage.setItem).toHaveBeenCalled());
    expect(useGuidanceStore.getState().accounts.race.products).toMatchObject({
      presented: true,
      dismissed: true,
    });
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).products.dismissed).toBe(true);
  });
  it("falhas de armazenamento não bloqueiam decisão em memória", async () => {
    storage.getItem.mockRejectedValue(new Error("indisponível"));
    storage.setItem.mockRejectedValue(new Error("sem espaço"));
    await useGuidanceStore.getState().load("offline");
    useGuidanceStore.getState().mark("offline", "finance", "completed");
    await vi.waitFor(() => expect(storage.setItem).toHaveBeenCalled());
    expect(useGuidanceStore.getState().ready.offline).toBe(true);
    expect(useGuidanceStore.getState().accounts.offline.finance?.completed).toBe(true);
  });
});
