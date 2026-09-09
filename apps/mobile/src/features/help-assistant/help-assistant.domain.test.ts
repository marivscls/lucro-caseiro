import { describe, expect, it } from "vitest";
import { answerHelpQuestion } from "./help-assistant.domain";

describe("help assistant", () => {
  it.each([
    "Como cadastro meu primeiro produto?",
    "quero adicionar um produto",
    "onde coloco o produto?",
  ])("answers a product question: %s", (question) => {
    const answer = answerHelpQuestion(question, "food");
    expect(answer.kind).toBe("guide");
    expect(answer.action?.route).toBe("/products");
    expect(answer.steps.length).toBeGreaterThan(0);
  });
  it("recognizes pricing without requiring an exact FAQ phrase", () => {
    const answer = answerHelpQuestion("Como sei quanto cobrar?", "food");
    expect(answer.action?.route).toBe("/pricing");
    expect(answer.steps.join(" ")).toContain("custos");
  });
  it("guides service businesses to the appropriate screen", () => {
    expect(answerHelpQuestion("como calcular o preço?", "beauty").action?.route).toBe(
      "/services",
    );
  });
  it("directs reports of failures to human support", () => {
    const answer = answerHelpQuestion("O app dá erro quando salvo o produto", "food");
    expect(answer.kind).toBe("handoff");
    expect(answer.text).toContain("email");
  });
  it("does not invent an answer outside the app's instructions", () => {
    const answer = answerHelpQuestion("qual a temperatura ideal para assar pão?", "food");
    expect(answer.kind).toBe("unknown");
    expect(answer.steps).toEqual([]);
  });
  it("does not claim access to financial records", () => {
    const answer = answerHelpQuestion("Qual foi o meu lucro este mês?", "food");
    expect(answer.text).toContain("não consulto os dados");
    expect(answer.action?.route).toBe("/finance");
  });
  it("handles cancellation with provider-specific guidance, without cancelling anything", () => {
    const answer = answerHelpQuestion("Quero cancelar minha assinatura", "other");
    expect(answer.steps.join(" ")).toContain("Google Play");
    expect(answer.steps.join(" ")).toContain("Stripe");
    expect(answer.text).not.toContain("cancelada");
  });
  it("returns a prompt for a vague or empty question", () => {
    expect(answerHelpQuestion("ajuda", "other").kind).toBe("unknown");
    expect(answerHelpQuestion(" ", "other").kind).toBe("unknown");
  });
});
