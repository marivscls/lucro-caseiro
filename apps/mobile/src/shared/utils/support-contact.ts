import { Linking } from "react-native";

import { appMetadata } from "../../features/analytics/metadata";
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

export function supportWhatsAppUrl(brandName: string, question = ""): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    supportWhatsAppMessage(brandName, question),
  )}`;
}

export function openSupportWhatsApp(brandName: string, question = ""): void {
  void Linking.openURL(supportWhatsAppUrl(brandName, question)).catch(() =>
    showAlert({
      title: "Não foi possível abrir o WhatsApp",
      message: `Chame a gente no WhatsApp ${SUPPORT_WHATSAPP_LABEL} ou escreva para ${SUPPORT_EMAIL}.`,
    }),
  );
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
        message: `Não foi possível abrir o aplicativo de e-mail. Escreva para ${SUPPORT_EMAIL} ou chame no WhatsApp ${SUPPORT_WHATSAPP_LABEL}.`,
      }),
  );
}
