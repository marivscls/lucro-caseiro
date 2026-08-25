import { describe, expect, it } from "vitest";

import {
  advanceGettingStartedStage,
  createGettingStartedTranslator,
  getGettingStartedGuideCopy,
  getGettingStartedStage,
  gettingStartedProgressLabel,
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

  it("sempre mostra o guia para conta nova sem produto nem venda", () => {
    expect(
      shouldShowGettingStarted({
        settled: true,
        completed: false,
        started: false,
        hasProduct: false,
        hasSale: false,
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
  it("abre o overlay na primeira etapa para conta nova", () => {
    expect(
      resolveGettingStartedPresentation({
        settled: true,
        completed: false,
        started: false,
        hasProduct: false,
        hasSale: false,
      }),
    ).toEqual({
      show: true,
      showReopen: false,
      stage: "product",
    });
  });

  it("fecha o guia real sem perder a etapa derivada dos dados", () => {
    expect(
      resolveGettingStartedPresentation({
        dismissed: true,
        settled: true,
        completed: false,
        started: true,
        hasProduct: true,
        hasSale: true,
      }),
    ).toEqual({ show: false, showReopen: true, stage: "result" });
  });
});

describe("advanceGettingStartedStage", () => {
  it("avanca produto -> venda -> resultado -> fim", () => {
    expect(advanceGettingStartedStage("product")).toBe("sale");
    expect(advanceGettingStartedStage("sale")).toBe("result");
    expect(advanceGettingStartedStage("result")).toBeNull();
  });
});

describe("catálogo localizado de Primeiros Passos", () => {
  it("mantem os titulos do guia em tela cheia", () => {
    expect(getGettingStartedGuideCopy("product").title).toBe("Cadastre o que você vende");
    expect(getGettingStartedGuideCopy("sale").title).toBe("Registre sua primeira venda");
    expect(getGettingStartedGuideCopy("result").title).toBe(
      "Veja o que sua venda rendeu",
    );
  });

  it("usa os textos oficiais das etapas 1 e 3", () => {
    expect(getGettingStartedGuideCopy("product").description).toBe(
      "Comece pelo essencial: dê um nome e defina o preço do seu primeiro produto.",
    );
    expect(getGettingStartedGuideCopy("product").info).toBe(
      "Você poderá adicionar fotos, custos e outros detalhes depois.",
    );
    expect(getGettingStartedGuideCopy("result")).toEqual({
      title: "Veja o que sua venda rendeu",
      description:
        "Pronto: sua primeira venda já está organizada. Confira o resultado para fechar o passo a passo.",
      info: "No Financeiro, você acompanha vendas, custos e o que realmente sobrou.",
      action: "Ver meu resultado",
      heroAlt: "Painel financeiro com gráfico de crescimento",
    });
    expect(gettingStartedStageChip(1)).toBe("ETAPA 1 DE 3");
    expect(gettingStartedStageChip(3)).toBe("ETAPA 3 DE 3");
    expect(gettingStartedProgressLabel(3)).toBe("Etapa 3 de 3");
  });

  it("aceita traduções expandidas sem alterar o contrato do componente", () => {
    const translate = createGettingStartedTranslator({
      "onboarding.result.title":
        "Veja com todos os detalhes quanto a sua primeira venda realmente rendeu",
    });

    expect(getGettingStartedGuideCopy("result", translate).title).toContain(
      "primeira venda",
    );
  });
});
