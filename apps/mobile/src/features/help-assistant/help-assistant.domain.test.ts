import { describe, expect, it } from "vitest";
import { answerHelpQuestion } from "./help-assistant.domain";

describe("help assistant", () => {
  it.each([
    "quais planos temos disponiveis?",
    "QUAIS PLANOS ESTÃO DISPONÍVEIS?",
    "Qual o preço dos planos?",
    "Quanto custa a assinatura?",
    "Qual a diferença entre Essencial e Profissional?",
    "O que inclui o plano gratuito?",
    "Como assinar o Profissional?",
    "O plano tem catálogo e produtos ilimitados?",
  ])("explains the available plans before matching other topics: %s", (question) => {
    const answer = answerHelpQuestion(question, "food");
    expect(answer.kind).toBe("guide");
    expect(answer.action?.route).toBe("/plans");
    const content = [answer.text, ...answer.steps].join(" ");
    expect(content).toContain("Gratuito");
    expect(content).toContain("Essencial");
    expect(content).toContain("Profissional");
    expect(content).toContain("29,90/mês");
    expect(content).toContain("69,90/mês");
    expect(content).toContain("299,00/ano");
    expect(content).toContain("699,00/ano");
    expect(content).toContain("30 vendas por mês");
  });
  it("keeps plan failures and cancellation ahead of the plan comparison", () => {
    expect(answerHelpQuestion("Não consigo assinar o plano", "food").kind).toBe(
      "handoff",
    );
    const cancellation = answerHelpQuestion("Como cancelar meu plano?", "food");
    expect(cancellation.steps.join(" ")).toContain("Google Play");
    expect(cancellation.action?.route).not.toBe("/plans");
  });
  it("does not confuse planning a sale with subscription plans", () => {
    expect(answerHelpQuestion("Como planejar uma venda?", "food").action?.route).toBe(
      "/tabs/new-sale",
    );
  });
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
