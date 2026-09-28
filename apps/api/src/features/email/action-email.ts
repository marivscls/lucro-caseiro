export interface FirstPriceEmailInput {
  name: string;
  appUrl: string;
  unsubscribeUrl: string;
  businessAddress: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildFirstPriceEmail(input: FirstPriceEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const firstName = input.name.trim().split(/\s+/)[0]?.slice(0, 60) || "";
  const greeting = firstName ? `Oi, ${firstName}!` : "Oi!";
  const subject = "Vamos calcular o preço do seu primeiro produto?";
  const text = [
    greeting,
    "",
    "Escolha um produto, informe seus custos e veja um preço de venda sugerido. Você pode começar com o que já sabe e ajustar depois.",
    "",
    `Abrir a precificação: ${input.appUrl}`,
    "Se o link não abrir, entre no Lucro Caseiro e toque em Precificação.",
    "",
    "Você recebe esta dica porque escolheu receber orientações por e-mail no app.",
    `Não quer mais essas dicas? ${input.unsubscribeUrl}`,
    `ORIONSEVEN SOFTWARE · ${input.businessAddress}`,
  ].join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:24px;background:#FAF8F6;color:#2C2A29;font-family:Arial,Helvetica,sans-serif"><table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:auto;background:#FFFFFF;border-radius:20px"><tr><td style="padding:32px"><p style="font-size:14px;font-weight:700;color:#B65F72">Lucro Caseiro</p><h1 style="font-size:28px;line-height:1.2">Um produto. Um preço mais claro.</h1><p style="font-size:17px;line-height:1.6">${escapeHtml(greeting)}</p><p style="font-size:17px;line-height:1.6">Escolha um produto, informe seus custos e veja um preço de venda sugerido. Você pode começar com o que já sabe e ajustar depois.</p><p style="margin:32px 0"><a href="${escapeHtml(input.appUrl)}" style="display:inline-block;padding:15px 24px;border-radius:12px;background:#B65F72;color:#FFFFFF;text-decoration:none;font-weight:700">Calcular meu preço →</a></p><p style="font-size:14px;line-height:1.5;color:#6B6660">Se o botão não abrir, entre no Lucro Caseiro e toque em Precificação.</p><hr style="border:0;border-top:1px solid #ECE7E4;margin:28px 0"><p style="font-size:12px;line-height:1.5;color:#6B6660">Você recebe esta dica porque escolheu receber orientações por e-mail no app. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6B6660">Não quero mais receber</a>.</p><p style="font-size:12px;line-height:1.5;color:#6B6660">ORIONSEVEN SOFTWARE · ${escapeHtml(input.businessAddress)}</p></td></tr></table></body></html>`;
  return { subject, text, html };
}
