import type { GuidanceArea } from "../../shared/guidance/guidance.domain";
import { profileRecommendation, type BusinessProfileAnswers } from "./profile-data";

export type WelcomeRoute = NonNullable<ReturnType<typeof profileRecommendation>>["route"];

export interface WelcomeContent {
  /** Continua depois de "Conta criada, Nome." */
  headline: string;
  subtitle: string;
  example: {
    title: string;
    rows: readonly { label: string; value: string }[];
    highlight: { label: string; value: string };
  };
  /** Área cujo tutorial em vídeo acompanha a boas-vindas. */
  videoArea: GuidanceArea;
  action: { label: string; route: WelcomeRoute };
}

const PRICE: WelcomeContent = {
  headline: "Agora, o preço certo do seu primeiro produto",
  subtitle: "Em uns 2 minutos você sabe quanto cobrar e quanto sobra.",
  example: {
    title: "Exemplo: brigadeiro gourmet",
    rows: [
      { label: "Materiais", value: "R$ 0,95" },
      { label: "Seu tempo", value: "R$ 0,65" },
      { label: "Seu ganho", value: "R$ 1,40" },
    ],
    highlight: { label: "Preço para cobrar", value: "R$ 3,00" },
  },
  videoArea: "pricing",
  action: { label: "Calcular meu primeiro preço", route: "/pricing" },
};

/**
 * Boas-vindas depois do questionário: o texto, o exemplo e o vídeo seguem a
 * prioridade escolhida. Sem respostas (questionário pulado), começa pelo preço.
 * A ação e o destino vêm de `profileRecommendation`, os mesmos do Início.
 */
export function welcomeContent(profile: BusinessProfileAnswers | null): WelcomeContent {
  const recommendation = profile ? profileRecommendation(profile) : undefined;
  if (!profile || !recommendation) return PRICE;
  const action = { label: recommendation.action, route: recommendation.route };
  const service = profile.segment === "services";

  switch (profile.goal) {
    case "orders":
      return service
        ? {
            headline: "Agora, seu primeiro atendimento na agenda",
            subtitle: "Cliente, serviço e horário num lugar só, sem esquecer ninguém.",
            example: {
              title: "Exemplo: atendimento de sábado",
              rows: [
                { label: "Cliente", value: "Joana" },
                { label: "Serviço", value: "Pé e mão" },
                { label: "Horário", value: "Sáb, 14h" },
              ],
              highlight: { label: "Valor do atendimento", value: "R$ 55,00" },
            },
            videoArea: "agenda",
            action,
          }
        : {
            headline: "Agora, sua primeira venda anotada",
            subtitle: "Em menos de 1 minuto você sabe quem pagou e quem ficou devendo.",
            example: {
              title: "Exemplo: encomenda de bolo",
              rows: [
                { label: "Cliente", value: "Joana" },
                { label: "Valor da venda", value: "R$ 120,00" },
                { label: "Sinal pago", value: "R$ 60,00" },
              ],
              highlight: { label: "Falta receber", value: "R$ 60,00" },
            },
            videoArea: "sales",
            action,
          };
    case "money":
      return {
        headline: "Agora, quanto sobra no seu mês",
        subtitle: "Anote o que entra e o que sai e veja o resultado sem planilha.",
        example: {
          title: "Exemplo: uma semana de vendas",
          rows: [
            { label: "Entradas", value: "R$ 850,00" },
            { label: "Materiais e embalagens", value: "R$ 310,00" },
            { label: "Gás e luz", value: "R$ 90,00" },
          ],
          highlight: { label: "Sobrou para você", value: "R$ 450,00" },
        },
        videoArea: "finance",
        action,
      };
    case "catalog":
      return {
        headline: "Agora, sua vitrine para mandar no WhatsApp",
        subtitle: "Escolha o que mostrar, defina o preço e compartilhe um link.",
        example: service
          ? {
              title: "Exemplo: serviço na vitrine",
              rows: [
                { label: "Serviço", value: "Design de sobrancelha" },
                { label: "Duração", value: "40 min" },
                { label: "Preço", value: "R$ 45,00" },
              ],
              highlight: { label: "Pedido no WhatsApp", value: "1 toque" },
            }
          : {
              title: "Exemplo: item da vitrine",
              rows: [
                { label: "Produto", value: "Bolo de pote" },
                { label: "Preço", value: "R$ 12,00" },
                { label: "Entrega", value: "Retirada ou entrega" },
              ],
              highlight: { label: "Pedido no WhatsApp", value: "1 toque" },
            },
        videoArea: "catalog",
        action,
      };
    default:
      return {
        ...PRICE,
        headline: service
          ? "Agora, o preço certo do seu primeiro serviço"
          : PRICE.headline,
        action,
      };
  }
}
