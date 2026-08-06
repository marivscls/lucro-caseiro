import type { PaidPlan } from "@lucro-caseiro/contracts";
import { resolveBrand } from "@lucro-caseiro/brands";
import { createHash } from "node:crypto";

import type {
  SubscriptionLifecycleEvent,
  SubscriptionLifecycleKind,
} from "../subscription/subscription.types";
import type { EmailSender } from "./resend-email";

export type SubscriptionEmailKind = SubscriptionLifecycleKind;
export type SubscriptionEmailEvent = SubscriptionLifecycleEvent;

const PLAN_NAMES: Record<PaidPlan, string> = {
  essential: "Essencial",
  professional: "Profissional",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function buildSubscriptionLifecycleEmail(event: SubscriptionEmailEvent): {
  subject: string;
  text: string;
  html: string;
} {
  const planName = PLAN_NAMES[event.plan];
  const renewalDate = formatDate(event.expiresAt);
  const { theme } = resolveBrand("lucro-caseiro");

  const copy = {
    activated: {
      subject: `Seu plano ${planName} est\u00e1 ativo \u2705`,
      eyebrow: "ASSINATURA ATIVA",
      title: `Boas-vindas ao ${planName}!`,
      body: `Seu plano ${planName} foi ativado com sucesso. Os recursos da assinatura j\u00e1 est\u00e3o dispon\u00edveis no Lucro Caseiro.`,
    },
    renewed: {
      subject: `Seu plano ${planName} foi renovado \u2705`,
      eyebrow: "RENOVA\u00c7\u00c3O CONFIRMADA",
      title: "Sua assinatura continua ativa",
      body: `A renova\u00e7\u00e3o do plano ${planName} foi confirmada. Voc\u00ea continua com acesso aos recursos da sua assinatura.`,
    },
    payment_failed: {
      subject: "N\u00e3o conseguimos renovar sua assinatura",
      eyebrow: "PAGAMENTO N\u00c3O CONFIRMADO",
      title: "Precisamos da sua aten\u00e7\u00e3o",
      body: `N\u00e3o foi poss\u00edvel confirmar a cobran\u00e7a do plano ${planName}. Verifique a forma de pagamento na mesma loja ou plataforma em que realizou a assinatura.`,
    },
    cancelled: {
      subject: "Sua assinatura do Lucro Caseiro foi encerrada",
      eyebrow: "ASSINATURA ENCERRADA",
      title: "Seu plano voltou ao Gratuito",
      body: `A assinatura do plano ${planName} foi encerrada. Seus dados continuam salvos e voc\u00ea pode assinar novamente quando quiser.`,
    },
  }[event.kind];

  const dateLine =
    renewalDate && event.kind !== "cancelled"
      ? `Pr\u00f3xima renova\u00e7\u00e3o ou validade: ${renewalDate}.`
      : null;
  const managementLine =
    event.kind === "payment_failed" || event.kind === "cancelled"
      ? "O gerenciamento da assinatura deve ser feito pela mesma loja ou plataforma usada na contrata\u00e7\u00e3o."
      : "Voc\u00ea pode acompanhar seu plano pelo aplicativo.";

  const text = [
    "Oi!",
    "",
    copy.title,
    "",
    copy.body,
    ...(dateLine ? ["", dateLine] : []),
    "",
    managementLine,
    "",
    "Abra o Lucro Caseiro: lucrocaseiro://",
    "",
    "Equipe Lucro Caseiro",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:${theme.background};font-family:Arial,sans-serif;color:#292d38">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${theme.background}">
      <tr><td align="center" style="padding:28px 12px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden">
          <tr><td bgcolor="${theme.primary}" style="padding:30px 36px;color:#fff">
            <div style="font-size:13px;font-weight:700;letter-spacing:1.5px">LUCRO CASEIRO</div>
            <div style="margin-top:8px;font-size:25px;font-weight:800">${copy.title}</div>
          </td></tr>
          <tr><td style="padding:36px">
            <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:${theme.primarySoft};color:${theme.primaryStrong};font-size:12px;font-weight:800;letter-spacing:1px">${copy.eyebrow}</div>
            <p style="margin:24px 0 0;font-size:17px;line-height:1.6">Oi!</p>
            <p style="margin:16px 0 0;font-size:17px;line-height:1.6">${copy.body}</p>
            ${dateLine ? `<p style="margin:18px 0 0;padding:16px 18px;border-radius:14px;background:${theme.primarySoft};font-size:15px;line-height:1.5"><strong>${dateLine}</strong></p>` : ""}
            <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#5d6470">${managementLine}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px"><tr><td bgcolor="${theme.primaryStrong}" style="border-radius:14px">
              <a href="lucrocaseiro://" style="display:inline-block;padding:15px 24px;color:#fff;text-decoration:none;font-size:16px;font-weight:700">Abrir o Lucro Caseiro</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:22px 36px;border-top:1px solid #eee7e8;color:#777;font-size:13px">Feito para quem empreende com amor \u00b7 Equipe Lucro Caseiro</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject: copy.subject, text, html };
}

export function createSubscriptionEmailNotifier(
  sendEmail: EmailSender,
  replyTo?: string,
): (event: SubscriptionEmailEvent) => Promise<void> {
  return async (event) => {
    const content = buildSubscriptionLifecycleEmail(event);
    const keyHash = createHash("sha256")
      .update(`${event.userId}:${event.kind}:${event.deduplicationKey}`)
      .digest("hex")
      .slice(0, 32);

    await sendEmail({
      to: event.email,
      ...content,
      idempotencyKey: `subscription-${event.kind}-${keyHash}`,
      ...(replyTo ? { replyTo } : {}),
    });
  };
}
