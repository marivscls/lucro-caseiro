import { describe, expect, it } from "vitest";

import { emptyBusinessProfile, type BusinessProfileAnswers } from "./profile-data";
import { welcomeContent } from "./welcome-content";

function profile(overrides: Partial<BusinessProfileAnswers>): BusinessProfileAnswers {
  return {
    ...emptyBusinessProfile,
    name: "Ana",
    segment: "sweets",
    stage: "starting",
    channels: ["whatsapp"],
    ...overrides,
  };
}

describe("welcome after the business questionnaire", () => {
  it("starts with pricing when the questionnaire was skipped", () => {
    const content = welcomeContent(null);
    expect(content.action).toEqual({
      label: "Calcular meu primeiro preço",
      route: "/pricing",
    });
    expect(content.videoArea).toBe("pricing");
  });

  it.each([
    ["price", "/pricing", "pricing"],
    ["orders", "/tabs/new-sale", "sales"],
    ["money", "/tabs/finance", "finance"],
    ["catalog", "/catalog", "catalog"],
  ] as const)("follows the %s priority", (goal, route, videoArea) => {
    const content = welcomeContent(profile({ goal }));
    expect(content.action.route).toBe(route);
    expect(content.videoArea).toBe(videoArea);
    expect(content.example.rows).toHaveLength(3);
  });

  it("uses the agenda for service providers who want to organize orders", () => {
    const content = welcomeContent(profile({ segment: "services", goal: "orders" }));
    expect(content.action.route).toBe("/agenda");
    expect(content.videoArea).toBe("agenda");
    expect(content.headline).toContain("atendimento");
  });

  it("talks about services when a service provider starts with the price", () => {
    const content = welcomeContent(profile({ segment: "services", goal: "price" }));
    expect(content.headline).toContain("serviço");
    expect(content.action.route).toBe("/services?create=onboarding");
  });
});
