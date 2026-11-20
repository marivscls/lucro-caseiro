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
    expect(content).toContain("Premium");
    expect(content).toContain("R$ 49,90/mês");
    expect(content).toContain("R$ 449/ano");
    expect(content).not.toContain("29,90");
    expect(content).not.toContain("69,90");
    expect(content).toContain("vendas ilimitadas");
  });
  it("offers a single paid plan with a Premium trial", () => {
    const answer = answerHelpQuestion("quais planos temos disponiveis?", "food");
    expect(answer.text).toContain("dois planos");
    expect(answer.steps.join(" ")).toContain("teste de 7 dias: coloca o cartão");
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
    expect(answer.text).toContain("Falar com a equipe");
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

  it("descreve o Gratuito enxuto de 2026-11-15", () => {
    const answer = answerHelpQuestion("O que inclui o plano gratuito?", "food");
    const content = answer.steps.join(" ");
    expect(content).toContain("até 30 clientes e 15 produtos");
    expect(content).toContain("5 encomendas novas por mês");
    expect(content).toContain("catálogo com 5 produtos");
    expect(content).toContain("Financeiro da semana atual");
    expect(content).toContain("fiado com cobrança por link e Pix");
    expect(content).not.toContain("50 clientes");
  });

  it("explica que fiado novo é Premium e dar baixa é livre", () => {
    const answer = answerHelpQuestion("como cobrar cliente no fiado?", "food");
    expect(answer.action?.route).toBe("/fiado");
    expect(answer.steps.join(" ")).toContain("Premium");
    expect(answer.steps.join(" ")).toContain("Dar baixa é liberado");
  });
});
