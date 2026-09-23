import { describe, expect, it } from "vitest";
import {
  emptyBusinessProfile,
  goalsForProfile,
  profileAnswerSummary,
  profileQuestion,
  profileRecommendation,
  stagesForProfile,
  toggleProfileChannel,
} from "./profile-data";

describe("recomendações do perfil", () => {
  it("seleciona vários canais e desmarca só a opção escolhida", () => {
    const channels = toggleProfileChannel(["whatsapp"], "instagram");
    expect(channels).toEqual(["whatsapp", "instagram"]);
    expect(toggleProfileChannel(channels, "whatsapp")).toEqual(["instagram"]);
    expect(channels).toEqual(["whatsapp", "instagram"]);
  });

  it("usa atendimento no momento, objetivo e próximo passo de serviços", () => {
    expect(stagesForProfile("services")[1]?.label).toContain("atendo");
    expect(
      goalsForProfile("services").find((goal) => goal.value === "orders")?.label,
    ).toContain("atendimentos");
    expect(
      profileRecommendation({
        ...emptyBusinessProfile,
        segment: "services",
        goal: "orders",
      }),
    ).toMatchObject({ route: "/agenda", action: "Abrir minha agenda" });
  });

  it("leva o cadastro de serviços ao formulário e a venda de produtos à nova venda", () => {
    expect(
      profileRecommendation({
        ...emptyBusinessProfile,
        segment: "services",
        goal: "price",
      }),
    ).toMatchObject({
      route: "/services?create=onboarding",
      action: "Cadastrar um serviço",
    });
    expect(
      profileRecommendation({
        ...emptyBusinessProfile,
        segment: "retail",
        goal: "orders",
      })?.route,
    ).toBe("/tabs/new-sale");
  });

  it("recomenda a próxima venda quando a conta já possui vendas", () => {
    expect(
      profileRecommendation(
        {
          ...emptyBusinessProfile,
          segment: "retail",
          stage: "starting",
          goal: "orders",
        },
        { hasSale: true },
      )?.title,
    ).toBe("Organize a próxima venda");
  });

  it("inclui o canal escolhido na orientação do catálogo", () => {
    const base = { ...emptyBusinessProfile, goal: "catalog", segment: "craft" };
    expect(profileRecommendation({ ...base, channels: ["whatsapp"] })?.text).toContain(
      "WhatsApp",
    );
    expect(profileRecommendation({ ...base, channels: ["instagram"] })?.text).toContain(
      "Instagram",
    );
    expect(profileRecommendation(base)?.title).toContain("uma peça");
  });

  it("aceita o perfil sem canais e não inventa ação sem prioridade", () => {
    expect(profileRecommendation({ ...emptyBusinessProfile, goal: "money" })?.route).toBe(
      "/tabs/finance",
    );
    expect(profileRecommendation(emptyBusinessProfile)).toBeUndefined();
  });
});

describe("conversa do perfil", () => {
  const ana = {
    ...emptyBusinessProfile,
    name: "Ana Paula",
    business: "Doces da Ana",
    segment: "sweets",
    stage: "selling",
    goal: "price",
  };

  it("chama a pessoa pelo primeiro nome na pergunta do negócio", () => {
    expect(profileQuestion(1, ana)?.title).toBe("Prazer, Ana! O que você faz por aí?");
    expect(profileQuestion(1, emptyBusinessProfile)?.title).toBe(
      "O que você faz por aí?",
    );
    expect(profileQuestion(5, ana)).toBeUndefined();
  });

  it("resume cada resposta no balão da pessoa", () => {
    expect(profileAnswerSummary(0, ana)).toBe("Ana Paula, da Doces da Ana");
    expect(profileAnswerSummary(0, { ...ana, business: " " })).toBe("Ana Paula");
    expect(profileAnswerSummary(1, ana)).toBe("Doces e confeitaria");
    expect(profileAnswerSummary(2, ana)).toBe("Já vendo de vez em quando");
    expect(profileAnswerSummary(3, ana)).toBe("Ainda não divulgo");
    expect(profileAnswerSummary(3, { ...ana, channels: ["whatsapp", "referral"] })).toBe(
      "WhatsApp, Indicação",
    );
    expect(profileAnswerSummary(4, ana)).toBe("Saber quanto cobrar");
  });
});
