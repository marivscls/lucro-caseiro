export type TrialReminderStage = "three_days" | "one_day" | "ended";

export function buildTrialReminderEmail(
  stage: TrialReminderStage,
  expiresAt: string,
): { subject: string; text: string; html: string } {
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) throw new Error("Invalid trial expiry date");
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(end);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  })
    .format(end)
    .replace(":", "h");
  const deadline = `${date}, às ${time} (horário de Brasília)`;

  let copy: {
    subject: string;
    eyebrow: string;
    title: string;
    body: string;
    next: string;
  };
  switch (stage) {
    case "three_days":
      copy = {
        subject: "Seu teste do Essencial segue por mais alguns dias",
        eyebrow: "SEU TESTE CONTINUA",
        title: "Aproveite estes dias com calma",
        body: `Seu acesso ao Essencial vai até ${deadline}. Ainda dá tempo de explorar os recursos no seu ritmo. Depois, sua conta continua no Gratuito e seus dados continuam salvos, sem cobrança automática.`,
        next: "Se quiser manter os recursos do Essencial depois desse dia, consulte os planos no app. A escolha é sua.",
      };
      break;
    case "one_day":
      copy = {
        subject: "Seu teste do Essencial termina em breve",
        eyebrow: "UM LEMBRETE TRANQUILO",
        title: "Seu trabalho continua com você",
        body: `Seu acesso ao Essencial termina em ${deadline}. Depois, sua conta continua no Gratuito e seus dados continuam salvos, sem cobrança automática.`,
        next: "Você pode continuar no Gratuito ou escolher um plano no app. Assinar é opcional.",
      };
      break;
    case "ended":
      copy = {
        subject: "Seu teste terminou; seus dados continuam salvos",
        eyebrow: "SEU TESTE TERMINOU",
        title: "Pode seguir no seu ritmo",
        body: "Seus 7 dias do Essencial chegaram ao fim e sua conta voltou ao plano Gratuito. Seus dados continuam salvos, sem cobrança automática.",
        next: "Você pode continuar usando os recursos gratuitos. Para voltar aos recursos do Essencial, consulte os planos no app quando fizer sentido para você.",
      };
      break;
  }

  const text = [
    "Oi!",
    "",
    copy.title,
    "",
    copy.body,
    "",
    copy.next,
    "",
    "Abrir o Lucro Caseiro: lucrocaseiro://",
    "",
    "Estamos por aqui,",
    "Lucro Caseiro",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.subject}</title></head>
  <body style="margin:0;background:#FAF8F6;color:#2C2A29;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF8F6">
      <tr><td align="center" style="padding:28px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="max-width:600px;background:#FFFFFF;border:1px solid #E8E3DE;border-radius:18px">
          <tr><td bgcolor="#FAF1F3" style="padding:30px 36px;background:#FAF1F3;border-radius:17px 17px 0 0">
            <p style="margin:0;color:#A85A67;font-size:12px;font-weight:700;letter-spacing:1px">LUCRO CASEIRO · ${copy.eyebrow}</p>
            <h1 style="margin:12px 0 0;color:#5F2B33;font-size:29px;line-height:1.2">${copy.title}</h1>
          </td></tr>
          <tr><td style="padding:30px 36px 36px">
            <p style="margin:0;font-size:16px;line-height:26px">Oi!</p>
            <p style="margin:18px 0 0;font-size:16px;line-height:26px">${copy.body}</p>
            <p style="margin:18px 0 0;color:#6B6660;font-size:15px;line-height:24px">${copy.next}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px"><tr><td bgcolor="#A85A67" style="border-radius:8px">
              <a href="lucrocaseiro://" style="display:inline-block;padding:15px 24px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none">Abrir o Lucro Caseiro</a>
            </td></tr></table>
            <p style="margin:14px 0 0;color:#6B6660;font-size:12px;line-height:19px">Se o botão não abrir, acesse o app pelo ícone no celular.</p>
          </td></tr>
        </table>
        <p style="max-width:600px;margin:20px 0 0;color:#6B6660;font-size:12px;line-height:20px">Esta mensagem acompanha o teste do Essencial no Lucro Caseiro.</p>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject: copy.subject, text, html };
}
