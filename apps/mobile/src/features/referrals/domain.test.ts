import type { ReferralSummary } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import {
  claimProgress,
  cleanCode,
  inviteMessage,
  inviteUrl,
  invitedSummary,
} from "./domain";

function summary(overrides: Partial<ReferralSummary> = {}): ReferralSummary {
  return {
    code: "ANABCD",
    invitedCount: 0,
    rewardedCount: 0,
    referredByName: null,
    rewarded: false,
    canClaim: false,
    salesCount: 0,
    rewardDays: 30,
    requiredSales: 3,
    ...overrides,
  };
}

describe("referrals domain", () => {
  it("monta o link do site com UTM e código", () => {
    const url = inviteUrl({ id: "lucro-caseiro", androidPackage: "x" }, "ANABCD");
    expect(url).toContain("utm_source=indicacao");
    expect(url).toContain("ref=ANABCD");
  });

  it("outras marcas vão para a loja", () => {
    const url = inviteUrl({ id: "outra", androidPackage: "com.outra" }, "ANABCD");
    expect(url).toContain("id=com.outra");
  });

  it("a mensagem diz onde digitar o código", () => {
    const msg = inviteMessage("Lucro Caseiro", "ANABCD", "https://x");
    expect(msg).toContain("*ANABCD*");
    expect(msg).toContain("Indique e ganhe");
  });

  it("mostra quantas vendas faltam para quem foi convidada", () => {
    expect(claimProgress(summary())).toBeNull();
    expect(claimProgress(summary({ referredByName: "Bia", salesCount: 1 }))).toEqual({
      done: 1,
      total: 3,
      label: "Faltam 2 vendas",
    });
    expect(claimProgress(summary({ referredByName: "Bia", salesCount: 2 }))?.label).toBe(
      "Falta 1 venda",
    );
    expect(claimProgress(summary({ referredByName: "Bia", rewarded: true }))).toBeNull();
  });

  it("resume os convites", () => {
    expect(invitedSummary(summary())).toBe("Você ainda não convidou ninguém.");
    expect(invitedSummary(summary({ invitedCount: 2, rewardedCount: 1 }))).toBe(
      "2 pessoas entraram com o seu código · 1 mês ganho",
    );
  });

  it("limpa o código digitado", () => {
    expect(cleanCode(" ana-bcd ")).toBe("ANABCD");
  });
});
