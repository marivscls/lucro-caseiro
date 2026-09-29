import { describe, expect, it } from "vitest";

import { LimitExceededError, ValidationError } from "../../shared/errors";
import type {
  IAssistantAi,
  IAssistantBusiness,
  IAssistantUsageRepo,
  RawSaleDraft,
} from "./assistant.types";
import { AssistantUseCases } from "./assistant.usecases";

const NOW = new Date("2026-09-28T15:00:00Z");
const P1 = "11111111-1111-4111-8111-111111111111";
const C1 = "22222222-2222-4222-8222-222222222222";

function ai(draft: Partial<RawSaleDraft> = {}): IAssistantAi {
  return {
    parseSale: () =>
      Promise.resolve({
        transcript: "vendi 3 marmitas de frango pra dona Célia fiado",
        clientName: "Célia",
        items: [{ name: "marmitas de frango", quantity: 3, unitPrice: null }],
        paymentMethod: "credit",
        notes: null,
        ...draft,
      }),
  };
}

function usage(start = 0): IAssistantUsageRepo & { count: number } {
  const repo = {
    count: start,
    getCount: () => Promise.resolve(repo.count),
    increment: () => Promise.resolve(++repo.count),
  };
  return repo;
}

function business(overrides: Partial<IAssistantBusiness> = {}): IAssistantBusiness {
  return {
    listProducts: () =>
      Promise.resolve([{ id: P1, name: "Marmita de frango", price: 18 }]),
    listClients: () => Promise.resolve([{ id: C1, name: "Célia Santos" }]),
    activePlan: () => Promise.resolve("free"),
    ...overrides,
  };
}

describe("AssistantUseCases.draftSale", () => {
  it("casa produto e cliente com o cadastro e usa o preço cadastrado", async () => {
    const counter = usage();
    const sut = new AssistantUseCases(ai(), counter, business(), () => NOW);
    const draft = await sut.draftSale("u", { text: "vendi 3 marmitas pra Célia fiado" });
    expect(draft).toMatchObject({
      clientId: C1,
      clientName: "Célia Santos",
      paymentMethod: "credit",
      items: [{ productId: P1, name: "Marmita de frango", quantity: 3, unitPrice: 18 }],
      usage: { used: 1, limit: 15 },
    });
  });

  it("mantém o item falado quando não há produto parecido", async () => {
    const sut = new AssistantUseCases(
      ai({ items: [{ name: "pudim", quantity: 1, unitPrice: 25 }], clientName: null }),
      usage(),
      business(),
      () => NOW,
    );
    const draft = await sut.draftSale("u", { text: "um pudim de 25 no pix" });
    expect(draft.items).toEqual([
      { productId: null, name: "pudim", quantity: 1, unitPrice: 25 },
    ]);
    expect(draft.clientId).toBeNull();
  });

  it("bloqueia quando o limite do mês acabou, sem gastar a IA", async () => {
    let called = false;
    const sut = new AssistantUseCases(
      {
        ...ai(),
        parseSale: () => {
          called = true;
          return Promise.reject(new Error("não deveria chamar"));
        },
      },
      usage(15),
      business(),
      () => NOW,
    );
    await expect(sut.draftSale("u", { text: "vendi um bolo" })).rejects.toBeInstanceOf(
      LimitExceededError,
    );
    expect(called).toBe(false);
  });

  it("recusa áudio em formato que o app não grava", async () => {
    const sut = new AssistantUseCases(ai(), usage(), business(), () => NOW);
    await expect(
      sut.draftSale("u", { audio: { data: "AAAA", mimeType: "video/mp4" } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
