import {
  ASSISTANT_MAX_PRICE_SHARE,
  ASSISTANT_WORST_COST_PER_USE,
  PLAN_PRICING,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  assistantLimit,
  base64Bytes,
  baseMimeType,
  bestNameMatch,
  fileProblem,
  monthKey,
  nameTokens,
  sanitizeItem,
} from "./assistant.domain";

const products = [
  { id: "1", name: "Marmita de frango" },
  { id: "2", name: "Marmita fitness" },
  { id: "3", name: "Bolo de cenoura" },
  { id: "4", name: "Bolo de chocolate" },
  { id: "5", name: "Brigadeiro gourmet" },
];

describe("nameTokens", () => {
  it("tira acento, plural simples e tratamentos", () => {
    expect(nameTokens("Dona Célia das Marmitas")).toEqual(["celia", "marmita"]);
  });
});

describe("bestNameMatch", () => {
  it("acha o produto mesmo falado de outro jeito", () => {
    expect(bestNameMatch("3 brigadeiros", products)).toBeNull();
    expect(bestNameMatch("brigadeiros", products)?.id).toBe("5");
    expect(bestNameMatch("marmita frango", products)?.id).toBe("1");
  });

  it("não troca um sabor por outro", () => {
    expect(bestNameMatch("bolo de morango", products)).toBeNull();
    expect(bestNameMatch("bolo de cenoura", products)?.id).toBe("3");
  });

  it("acha a cliente pelo primeiro nome", () => {
    const clients = [
      { id: "a", name: "Célia Santos" },
      { id: "b", name: "Rosa Lima" },
    ];
    expect(bestNameMatch("dona Célia", clients)?.id).toBe("a");
    expect(bestNameMatch("Maria", clients)).toBeNull();
  });
});

describe("arquivos", () => {
  it("mede o tamanho real do base64", () => {
    expect(base64Bytes(Buffer.from("olá mundo").toString("base64"))).toBe(10);
  });

  it("aceita áudio do app e recusa formato estranho", () => {
    expect(
      fileProblem({ data: "AAAA", mimeType: "audio/webm;codecs=opus" }, "audio"),
    ).toBeNull();
    expect(fileProblem({ data: "AAAA", mimeType: "audio/mp4" }, "audio")).toBeNull();
    expect(fileProblem({ data: "AAAA", mimeType: "application/pdf" }, "audio")).toContain(
      "formato",
    );
    expect(fileProblem({ data: "AAAA", mimeType: "image/jpeg" }, "image")).toBeNull();
  });
});

describe("limpeza do que a IA devolve", () => {
  it("corrige quantidade inválida e ignora preço zerado", () => {
    expect(sanitizeItem({ name: " Marmita ", quantity: 0, unitPrice: 0 })).toEqual({
      name: "Marmita",
      quantity: 1,
      unitPrice: null,
    });
    expect(sanitizeItem({ name: "", quantity: 1, unitPrice: 5 })).toBeNull();
  });

  it("usa o mês de Brasília", () => {
    expect(monthKey(new Date("2026-10-01T01:00:00Z"))).toBe("2026-09");
  });
});

describe("baseMimeType", () => {
  it("tira os parâmetros do tipo", () => {
    expect(baseMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(baseMimeType("IMAGE/JPEG")).toBe("image/jpeg");
  });
});

describe("assistantLimit", () => {
  it.each(["essential", "professional"] as const)(
    "no pior caso, o plano %s nunca gasta mais que a fração do preço com IA",
    (plan) => {
      const cheapestMonth = PLAN_PRICING[plan].annual / 12;
      const worstSpend = assistantLimit(plan) * ASSISTANT_WORST_COST_PER_USE;
      expect(assistantLimit(plan)).toBeGreaterThan(0);
      expect(worstSpend).toBeLessThanOrEqual(cheapestMonth * ASSISTANT_MAX_PRICE_SHARE);
    },
  );

  it("mantém o grátis com teto pequeno", () => {
    expect(assistantLimit("free")).toBe(15);
  });
});
