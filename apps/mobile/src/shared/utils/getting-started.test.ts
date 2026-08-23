import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_GUIDE_COPY,
  GETTING_STARTED_GUIDE_PREVIEW_HINT,
  advanceGettingStartedStage,
  getGettingStartedStage,
  gettingStartedStageChip,
  resolveGettingStartedPresentation,
  shouldShowGettingStarted,
} from "./getting-started";

describe("getGettingStartedStage", () => {
  it.each([
    [false, false, "product"],
    [true, false, "sale"],
    [true, true, "result"],
  ] as const)("resolve produto=%s venda=%s como %s", (hasProduct, hasSale, stage) => {
    expect(getGettingStartedStage(hasProduct, hasSale)).toBe(stage);
  });
});

describe("shouldShowGettingStarted", () => {
  it("espera os dados antes de decidir", () => {
    expect(
      shouldShowGettingStarted({
        settled: false,
        completed: false,
        started: false,
        hasProduct: false,
        hasSale: false,
      }),
    ).toBe(false);
  });

  it("acompanha um fluxo iniciado ate a etapa de resultado", () => {
    expect(
      shouldShowGettingStarted({
        settled: true,
        completed: false,
        started: true,
        hasProduct: true,
        hasSale: true,
      }),
    ).toBe(true);
  });

  it("nao reapresenta o guia concluido nem o estreia para uma conta ja ativa", () => {
    const base = {
      settled: true,
      hasProduct: true,
      hasSale: true,
    };

    expect(shouldShowGettingStarted({ ...base, completed: true, started: true })).toBe(
      false,
    );
    expect(shouldShowGettingStarted({ ...base, completed: false, started: false })).toBe(
      false,
    );
  });
});

describe("resolveGettingStartedPresentation", () => {
  const activeAccount = {
    settled: true,
    completed: true,
    started: true,
    hasProduct: true,
    hasSale: true,
  };

  it("na previa mostra a primeira etapa mesmo para conta ja ativa", () => {
    expect(
      resolveGettingStartedPresentation({ preview: true, ...activeAccount }),
    ).toEqual({
      show: true,
      showReopen: false,
      stage: "product",
    });
  });

  it("na previa ignora dados reais e respeita etapa e dismiss", () => {
    expect(
      resolveGettingStartedPresentation({
        preview: true,
        previewDismissed: false,
        previewStage: "sale",
        ...activeAccount,
      }),
    ).toEqual({
      show: true,
      showReopen: false,
      stage: "sale",
    });

    expect(
      resolveGettingStartedPresentation({
        preview: true,
        previewDismissed: true,
        previewStage: "result",
        ...activeAccount,
      }),
    ).toEqual({
      show: false,
      showReopen: true,
      stage: "result",
    });
  });
});

describe("advanceGettingStartedStage", () => {
  it("avanca produto -> venda -> resultado -> fim", () => {
    expect(advanceGettingStartedStage("product")).toBe("sale");
    expect(advanceGettingStartedStage("sale")).toBe("result");
    expect(advanceGettingStartedStage("result")).toBeNull();
  });
});

describe("GETTING_STARTED_GUIDE_COPY", () => {
  it("mantem os titulos do guia em tela cheia", () => {
    expect(GETTING_STARTED_GUIDE_COPY.product.title).toBe("Cadastre o que você vende");
    expect(GETTING_STARTED_GUIDE_COPY.sale.title).toBe("Registre sua primeira venda");
    expect(GETTING_STARTED_GUIDE_COPY.result.title).toBe("Veja o que sua venda rendeu");
  });

  it("usa o texto da etapa 1 da referencia visual", () => {
    expect(GETTING_STARTED_GUIDE_COPY.product.description).toBe(
      "Comece pelo essencial: dê um nome e defina o preço do seu primeiro produto.",
    );
    expect(GETTING_STARTED_GUIDE_COPY.product.tip).toBe(
      "Você poderá adicionar fotos, custos e outros detalhes depois.",
    );
    expect(GETTING_STARTED_GUIDE_COPY.product.action).toBe("Cadastrar primeiro produto");
    expect(GETTING_STARTED_GUIDE_PREVIEW_HINT).toBe(
      "Modo de prévia: avance sem alterar seus dados.",
    );
    expect(gettingStartedStageChip(1)).toBe("ETAPA 1 DE 3");
  });
});
