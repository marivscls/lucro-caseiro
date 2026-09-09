import { WELCOME_EMAIL_HTML } from "./welcome-email.template";

export interface WelcomeProfile {
  name: string;
  businessName: string | null;
  businessType: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildWelcomeEmail(profile: WelcomeProfile): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = profile.name.trim().split(/\s+/)[0]?.slice(0, 60) ?? "";
  const service =
    profile.businessType === "services" || profile.businessType === "beauty";
  const subject = firstName
    ? `${firstName}, seu negócio é bem-vindo aqui.`
    : "Seu negócio é bem-vindo no Lucro Caseiro.";
  const productCosts =
    profile.businessType === "food"
      ? "Inclua ingredientes, embalagens e outras despesas para produzir e vender."
      : "Inclua materiais ou custo de compra, embalagem, taxas e outras despesas.";
  const fields: Record<string, string> = {
    subject,
    preheader: service
      ? "Organize seus serviços, defina os preços e acompanhe seus atendimentos."
      : "Organize os custos, calcule o preço e acompanhe suas vendas com o Lucro Caseiro.",
    business: profile.businessName?.trim().slice(0, 150) || "seu negócio",
    greeting: firstName ? `Oi, ${firstName}!` : "Oi!",
    intro: service
      ? "Não precisa organizar tudo de uma vez. Escolha um serviço e comece por ele. Um atendimento de cada vez."
      : "Não precisa organizar tudo de uma vez. Escolha um produto e comece por ele. Um passo de cada vez.",
    step1title: service ? "Cadastre um serviço" : "Reúna os custos",
    step1body: service
      ? "Em Serviços, informe o que você oferece, o tempo necessário e os materiais utilizados."
      : productCosts,
    step2title: service ? "Defina seu preço" : "Calcule o preço de venda",
    step2body: service
      ? "Na área de Serviços, considere seu tempo e os custos do atendimento ao definir o preço."
      : "Abra a Precificação e use esses custos para definir o preço do produto.",
    step3title: service ? "Organize os atendimentos" : "Acompanhe suas vendas",
    step3body: service
      ? "Use a Agenda para registrar os próximos compromissos e acompanhar os atendimentos."
      : "Registre as próximas vendas para manter o movimento do negócio organizado.",
    supportTitle: "Como podemos ajudar você?",
    supportBody:
      "Responda a este email contando o que você faz e em qual etapa precisa de ajuda. Você também encontra orientações na área de Suporte do app.",
  };
  const replacements = new Map(Object.entries(fields));
  const html = WELCOME_EMAIL_HTML.replace(/\{\{(\w+)\}\}/g, (_token, key: string) =>
    escapeHtml(replacements.get(key) ?? ""),
  );
  const text = [
    "Seu negócio é bem-vindo aqui.",
    `Vamos simplificar as contas de ${fields.business}.`,
    "",
    fields.greeting,
    "",
    fields.intro,
    "",
    `1. ${fields.step1title}`,
    fields.step1body,
    "",
    `2. ${fields.step2title}`,
    fields.step2body,
    "",
    `3. ${fields.step3title}`,
    fields.step3body,
    "",
    "Continuar no Lucro Caseiro: lucrocaseiro://",
    "Se o link não abrir, acesse o app pelo ícone no celular.",
    "",
    fields.supportTitle,
    fields.supportBody,
    "",
    "Estamos por aqui,",
    "Lucro Caseiro",
    "",
    "Conheça também nosso site: https://lucrocaseiro.com.br",
    "Esta mensagem acompanha seu cadastro no Lucro Caseiro.",
  ].join("\n");
  return { subject, html, text };
}
