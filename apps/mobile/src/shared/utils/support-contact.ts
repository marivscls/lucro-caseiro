import type { UserProfile } from "@lucro-caseiro/contracts";
import { isPaidPlan, resolveActivePlan } from "@lucro-caseiro/contracts";
import { Linking, Platform } from "react-native";

import { appMetadata } from "../../features/analytics/metadata";
import { isProfileOnTrial } from "../../features/subscription/trial";
import { showAlert } from "../components/alert-store";

export const SUPPORT_EMAIL = "contato@orionseven.com.br";
/** WhatsApp Business do suporte (só dígitos, com DDI). */
export const SUPPORT_WHATSAPP = "5548992124950";
export const SUPPORT_WHATSAPP_LABEL = "(48) 99212-4950";
export const SUPPORT_RESPONSE_TIME = "Respondemos em até 1 dia útil.";

const QUESTION_MAX = 400;

function appLabel(): string {
  const { platform, appVersion, appBuild } = appMetadata();
  const build = appBuild ? " (" + appBuild + ")" : "";
  return `${platform} ${appVersion}${build}`;
}

/** Mensagem pronta do WhatsApp: a pessoa revisa antes de enviar. */
export function supportWhatsAppMessage(
  brandName: string,
  question = "",
  app = appLabel(),
): string {
  const trimmed = question.trim().slice(0, QUESTION_MAX);
  const ask = trimmed
    ? `Preciso de ajuda com: ${trimmed}`
    : "Preciso de ajuda com o app. A tela é: ";
  return `Oi! Uso o ${brandName}. ${ask}\n\n(App ${app})`;
}

function encodedMessage(brandName: string, question: string): string {
  return encodeURIComponent(supportWhatsAppMessage(brandName, question));
}

/** Link web: abre a conversa com o suporte (usado no navegador e como reserva). */
export function supportWhatsAppUrl(brandName: string, question = ""): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodedMessage(brandName, question)}`;
}

/** Link do app: abre direto a conversa com o número do suporte no WhatsApp. */
export function supportWhatsAppAppUrl(brandName: string, question = ""): string {
  return `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${encodedMessage(brandName, question)}`;
}

function warnWhatsAppFailed() {
  showAlert({
    title: "Não foi possível abrir o WhatsApp",
    message: `Chame a gente no WhatsApp ${SUPPORT_WHATSAPP_LABEL} ou escreva para ${SUPPORT_EMAIL}.`,
  });
}

/**
 * No celular abre o app do WhatsApp já na conversa do suporte; se o app não
 * abrir (ou no navegador), cai no wa.me, que leva à mesma conversa.
 */
export function openSupportWhatsApp(brandName: string, question = ""): void {
  const webUrl = supportWhatsAppUrl(brandName, question);
  if (Platform.OS === "web") {
    void Linking.openURL(webUrl).catch(warnWhatsAppFailed);
    return;
  }
  void Linking.openURL(supportWhatsAppAppUrl(brandName, question))
    .catch(() => Linking.openURL(webUrl))
    .catch(warnWhatsAppFailed);
}

export function openSupportEmail(brandName: string, question = ""): void {
  const subject = encodeURIComponent(`Suporte ${brandName}`);
  const body = encodeURIComponent(
    `Oi! Preciso de ajuda com:\n\n${question.slice(0, QUESTION_MAX)}\n\n---\n(Conte em qual tela aconteceu e o que você tentou fazer.)\n(App ${appLabel()})`,
  );
  void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(
    () =>
      showAlert({
        title: "Envie sua dúvida por e-mail",
        message: `Não foi possível abrir o aplicativo de e-mail. Escreva para ${SUPPORT_EMAIL} e informe em qual tela aconteceu.`,
      }),
  );
}

type SupportProfile = Pick<UserProfile, "plan" | "planExpiresAt"> & {
  planIsTrial?: boolean;
};

/** WhatsApp do suporte é benefício de quem paga (plano pago ativo, fora do teste). */
export function hasWhatsAppSupport(profile?: SupportProfile | null): boolean {
  if (!profile) return false;
  const paid = isPaidPlan(resolveActivePlan(profile.plan, profile.planExpiresAt));
  return paid && !isProfileOnTrial(profile);
}
