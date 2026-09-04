import { describe, expect, it } from "vitest";
import {
  emptyBusinessProfile,
  goalsForProfile,
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
