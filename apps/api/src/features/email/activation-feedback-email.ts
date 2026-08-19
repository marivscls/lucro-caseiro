import { resolveBrand } from "@lucro-caseiro/brands";

export function buildActivationFeedbackEmail(): {
  subject: string;
  text: string;
  html: string;
} {
  const { theme } = resolveBrand("lucro-caseiro");
  const subject = "Posso te fazer uma pergunta rápida sobre o Lucro Caseiro?";
  const question =
    "Quando você entrou no Lucro Caseiro, teve alguma dificuldade ou algo impediu você de cadastrar seu primeiro produto ou sua primeira venda?";

  const text = [
    "Oi!",
    "",
    "Estamos melhorando o Lucro Caseiro e gostaríamos muito da sua sinceridade.",
    "",
    question,
    "",
    "Pode responder este e-mail com uma frase mesmo. Sua resposta vai nos ajudar a deixar o app mais simples e útil para quem empreende.",
    "",
    "Obrigada por experimentar o Lucro Caseiro!",
    "",
    "Equipe Lucro Caseiro",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:${theme.background};font-family:Arial,Helvetica,sans-serif;color:#292d38">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${theme.background}">
      <tr>
        <td align="center" style="padding:28px 14px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #eee7e8;border-radius:18px;overflow:hidden">
            <tr>
              <td bgcolor="${theme.primaryStrong}" style="padding:24px 30px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:1px">
                LUCRO CASEIRO
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px">
                <p style="margin:0;font-size:17px;line-height:1.6">Oi!</p>
                <p style="margin:16px 0 0;font-size:17px;line-height:1.6">Estamos melhorando o Lucro Caseiro e gostaríamos muito da sua sinceridade.</p>
                <div style="margin-top:22px;padding:20px;border-left:4px solid ${theme.primary};border-radius:10px;background:${theme.primarySoft};font-size:18px;font-weight:700;line-height:1.5;color:${theme.primaryStrong}">
                  ${question}
                </div>
                <p style="margin:22px 0 0;font-size:16px;line-height:1.6">Pode responder este e-mail com uma frase mesmo. Sua resposta vai nos ajudar a deixar o app mais simples e útil para quem empreende.</p>
                <p style="margin:22px 0 0;font-size:15px;font-weight:700;line-height:1.6;color:${theme.primaryStrong}">Obrigada por experimentar o Lucro Caseiro!</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px;border-top:1px solid #eee7e8;color:#77716e;font-size:13px;line-height:1.5">
                Equipe Lucro Caseiro
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
