import {
  MeiSummaryDto,
  PixSettingsDto,
  ReferralSummaryDto,
} from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import { handleMockRequest, type MockRequest } from "./api";
import { seededDemoData, type DemoData } from "./fixtures";

const NOW = new Date("2026-09-23T12:00:00").getTime();
const account = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana@exemplo.com",
  name: "Ana",
  createdAt: new Date(NOW).toISOString(),
};

function makeSut(data: DemoData = seededDemoData(account, NOW)) {
  const request = (method: string, pathWithQuery: string, body = {}) => {
    const url = new URL(pathWithQuery, "https://demo.local");
    const input: MockRequest = {
      method,
      path: url.pathname,
      query: url.searchParams,
      body,
      data,
      now: NOW,
    };
    return handleMockRequest(input);
  };
  return { data, request };
}

describe("demo: Pix, indicação, MEI e anotar falando", () => {
  it("salva a chave Pix normalizada e recusa chave inválida", () => {
    const { request } = makeSut();
    const saved = request("PUT", "/api/v1/fiado/pix", {
      pixKeyType: "phone",
      pixKey: "(11) 98765-4321",
      pixCity: "São Paulo",
    });
    expect(PixSettingsDto.parse(saved.body).pixKey).toBe("+5511987654321");
    expect(request("GET", "/api/v1/fiado/pix").body).toEqual(saved.body);
    expect(
      request("PUT", "/api/v1/fiado/pix", { pixKeyType: "cpf_cnpj", pixKey: "123" })
        .status,
    ).toBe(400);
  });

  it("monta o resumo do MEI no formato do contrato", () => {
    const { request } = makeSut();
    request("PUT", "/api/v1/mei/settings", { activity: "services" });
    const summary = MeiSummaryDto.parse(
      request("GET", "/api/v1/mei/summary?year=2026&month=9").body,
    );
    expect(summary.activity).toBe("services");
    expect(summary.months).toHaveLength(9);
  });

  it("devolve o resumo de indicação e bloqueia a IA", () => {
    const { request } = makeSut();
    expect(() =>
      ReferralSummaryDto.parse(request("GET", "/api/v1/referrals").body),
    ).not.toThrow();
    expect(
      request("POST", "/api/v1/assistant/sale-draft", { text: "2 bolos" }).status,
    ).toBe(400);
  });
});
