import { resolveBrand } from "@lucro-caseiro/brands";

const EMAIL_ASSET_BASE_URL = "https://lucrocaseiro.com.br/email";

export const PROFESSIONAL_TRIAL_GIFT_URL = `${EMAIL_ASSET_BASE_URL}/professional-trial-gift.png`;
export const PROFESSIONAL_TRIAL_DASHBOARD_URL = `${EMAIL_ASSET_BASE_URL}/professional-trial-dashboard.png`;
export const PROFESSIONAL_TRIAL_BADGE_GIFT_URL = `${EMAIL_ASSET_BASE_URL}/professional-trial-badge-gift.png`;
export const PROFESSIONAL_TRIAL_STAR_URL = `${EMAIL_ASSET_BASE_URL}/professional-trial-star.png`;
export const PROFESSIONAL_TRIAL_HEART_URL = `${EMAIL_ASSET_BASE_URL}/professional-trial-heart.png`;

export function buildProfessionalTrialEmail(): {
  subject: string;
  text: string;
  html: string;
} {
  const { theme } = resolveBrand("lucro-caseiro");
  const primary = theme.primary;
  const primaryStrong = theme.primaryStrong ?? theme.primaryDark ?? primary;
  const primarySoft = theme.primarySoft ?? "#F9E7EA";
  const background = theme.background ?? "#FAFAF8";

  return {
    subject: "Voc\u00ea ganhou 1 m\u00eas de Profissional gr\u00e1tis \ud83c\udf81",
    text: [
      "Oi!",
      "",
      "Temos uma \u00f3tima not\u00edcia: sua conta ganhou 1 m\u00eas gr\u00e1tis do plano Profissional do Lucro Caseiro.",
      "",
      "Durante esse per\u00edodo, voc\u00ea ter\u00e1 acesso a todos os recursos avan\u00e7ados para organizar seu neg\u00f3cio, acompanhar seus resultados e ganhar tempo na rotina, incluindo:",
      "- relat\u00f3rios avan\u00e7ados e exporta\u00e7\u00f5es;",
      "- controle financeiro completo;",
      "- gest\u00e3o de produtos, clientes e pedidos;",
      "- suporte priorit\u00e1rio.",
      "",
      "Esse presente n\u00e3o gera cobran\u00e7a autom\u00e1tica. Quando o per\u00edodo terminar, voc\u00ea poder\u00e1 escolher se quer continuar no Profissional.",
      "",
      "Explore seu plano: https://app.lucrocaseiro.com.br",
      "",
      "Aproveite ao m\u00e1ximo!",
      "Esse \u00e9 o nosso jeito de agradecer por confiar no Lucro Caseiro.",
      "",
      "Equipe Lucro Caseiro",
    ].join("\n"),
    html: `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light only">
          <meta name="supported-color-schemes" content="light only">
          <title>Voc&ecirc; ganhou 1 m&ecirc;s de Profissional gr&aacute;tis</title>
          <style>
            @media screen and (max-width: 680px) {
              .email-wrap { padding: 0 !important; }
              .email-shell { width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
              .stack-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
              .hero-pill { margin: 0 auto !important; }
              .hero-copy { padding: 30px 24px 6px !important; text-align: center !important; }
              .hero-art { padding: 0 24px 24px !important; text-align: center !important; }
              .hero-title { font-size: 35px !important; }
              .content-copy { padding: 32px 24px 8px !important; }
              .content-art { padding: 4px 24px 26px !important; text-align: center !important; }
              .feature-cell { display: block !important; width: auto !important; border-left: 0 !important; border-top: 1px solid #efdadd !important; padding: 12px 14px !important; }
              .feature-first { border-top: 0 !important; }
              .cta-copy, .cta-button { display: block !important; width: auto !important; text-align: center !important; }
              .cta-button { padding-top: 18px !important; }
              .footer-item { display: block !important; width: 100% !important; text-align: center !important; padding: 5px 0 !important; }
            }
          </style>
        </head>
        <body style="margin:0;padding:0;background-color:${background};color:#292d38;font-family:Arial,Helvetica,sans-serif">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${background}" style="width:100%;background-color:${background};background-image:linear-gradient(${background},${background})">
            <tr>
              <td class="email-wrap" align="center" style="padding:30px 14px">
                <table class="email-shell" role="presentation" width="760" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:760px;background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);border:1px solid #eee7e4;border-radius:22px;overflow:hidden;box-shadow:0 14px 40px rgba(74,36,43,.08)">
                  <tr>
                    <td bgcolor="${primaryStrong}" style="background-color:${primaryStrong};background-image:linear-gradient(135deg,${primaryStrong},#8f4050);padding:0">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td class="stack-cell hero-copy" width="55%" valign="middle" style="width:55%;padding:42px 16px 42px 44px">
                            <table class="hero-pill" role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td bgcolor="#fff4f1" style="background-color:#fff4f1;background-image:linear-gradient(#fff4f1,#fff4f1);border-radius:999px;padding:9px 16px;color:${primary};font-size:13px;font-weight:700;letter-spacing:.02em">&#127873;&nbsp;&nbsp;PRESENTE ESPECIAL</td>
                              </tr>
                            </table>
                            <h1 class="hero-title" style="margin:28px 0 0;color:#ffffff;font-size:40px;line-height:1.08;font-weight:700">Lucro Caseiro<br><span style="color:#ffd6a3">&eacute; parceria que<br>gera resultados</span></h1>
                            <p style="margin:22px 0 0;color:#ffffff;font-size:18px;line-height:1.4">Uma surpresa para o seu neg&oacute;cio</p>
                          </td>
                          <td class="stack-cell hero-art" width="45%" align="center" valign="middle" style="width:45%;padding:22px 28px 18px 8px">
                            <img src="${PROFESSIONAL_TRIAL_GIFT_URL}" width="300" alt="Presente especial do Lucro Caseiro" style="display:block;width:100%;max-width:300px;height:auto;margin:0 auto;border:0">
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#ffffff" style="background-color:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);padding:0">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td class="stack-cell content-copy" width="53%" valign="top" style="width:53%;padding:38px 16px 24px 44px">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td bgcolor="${primarySoft}" style="background-color:${primarySoft};background-image:linear-gradient(${primarySoft},${primarySoft});border-radius:999px;padding:7px 14px;color:${primary};font-size:13px;font-weight:700;letter-spacing:.04em"><img src="${PROFESSIONAL_TRIAL_BADGE_GIFT_URL}" width="24" height="24" alt="" style="display:inline-block;width:24px;height:24px;margin:0 7px 0 0;border:0;vertical-align:middle">1 M&Ecirc;S GR&Aacute;TIS</td>
                              </tr>
                            </table>
                            <h2 style="margin:26px 0 0;color:#292d38;font-size:36px;line-height:1.12;font-weight:700">Voc&ecirc; ganhou<br>o plano <span style="color:${primary}">Profissional!</span></h2>
                            <p style="margin:24px 0 0;color:#292d38;font-size:17px;line-height:1.55">Oi!</p>
                            <p style="margin:17px 0 0;color:#292d38;font-size:17px;line-height:1.55">Temos uma &oacute;tima not&iacute;cia: sua conta ganhou <strong style="color:${primary}">1 m&ecirc;s gr&aacute;tis</strong> do plano <strong style="color:${primary}">Profissional</strong> do Lucro Caseiro.</p>
                            <p style="margin:17px 0 0;color:#292d38;font-size:17px;line-height:1.55">Durante esse per&iacute;odo, voc&ecirc; ter&aacute; acesso a todos os recursos avan&ccedil;ados para organizar seu neg&oacute;cio, acompanhar seus resultados e ganhar tempo na rotina.</p>
                            <p style="margin:21px 0 0;width:56px;height:3px;background-color:${primary};border-radius:3px;font-size:1px;line-height:1px">&nbsp;</p>
                          </td>
                          <td class="stack-cell content-art" width="47%" align="center" valign="middle" style="width:47%;padding:74px 34px 28px 10px">
                            <img src="${PROFESSIONAL_TRIAL_DASHBOARD_URL}" width="310" alt="Painel de resultados do Lucro Caseiro" style="display:block;width:100%;max-width:310px;height:auto;margin:0 auto;border:0">
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 42px 20px">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fff7f5" style="width:100%;background-color:#fff7f5;background-image:linear-gradient(90deg,#fff7f5,#fcebec);border-radius:15px">
                        <tr>
                          <td valign="middle" style="padding:18px 16px">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td width="58" valign="middle" style="width:58px;text-align:center"><img src="${PROFESSIONAL_TRIAL_STAR_URL}" width="46" height="46" alt="" style="display:block;width:46px;height:46px;margin:0 auto;border:0"></td>
                                <td valign="middle" style="padding:0 8px;color:${primary};font-size:15px;font-weight:700">Tudo do Profissional:</td>
                              </tr>
                            </table>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px">
                              <tr>
                                <td class="feature-cell feature-first" width="25%" valign="top" style="width:25%;padding:4px 10px;color:#292d38;font-size:12px;line-height:1.35"><strong style="color:${primary};font-size:17px">&#10003;</strong>&nbsp; Relat&oacute;rios avan&ccedil;ados e exporta&ccedil;&otilde;es</td>
                                <td class="feature-cell" width="25%" valign="top" style="width:25%;padding:4px 10px;border-left:1px solid #efdadd;color:#292d38;font-size:12px;line-height:1.35"><strong style="color:${primary};font-size:17px">&#10003;</strong>&nbsp; Controle financeiro completo</td>
                                <td class="feature-cell" width="25%" valign="top" style="width:25%;padding:4px 10px;border-left:1px solid #efdadd;color:#292d38;font-size:12px;line-height:1.35"><strong style="color:${primary};font-size:17px">&#10003;</strong>&nbsp; Gest&atilde;o de produtos, clientes e pedidos</td>
                                <td class="feature-cell" width="25%" valign="top" style="width:25%;padding:4px 10px;border-left:1px solid #efdadd;color:#292d38;font-size:12px;line-height:1.35"><strong style="color:${primary};font-size:17px">&#10003;</strong>&nbsp; Suporte priorit&aacute;rio</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 42px 20px">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#fff8f6" style="width:100%;background-color:#fff8f6;background-image:linear-gradient(90deg,#fff8f6,#fdf0ed);border-radius:15px">
                        <tr>
                          <td style="padding:18px 18px">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td class="cta-copy" width="60%" valign="middle" style="width:60%">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                      <td width="52" valign="middle" style="width:52px;text-align:center"><img src="${PROFESSIONAL_TRIAL_HEART_URL}" width="46" height="46" alt="" style="display:block;width:46px;height:46px;margin:0 auto;border:0"></td>
                                      <td valign="middle" style="padding-left:12px;color:#292d38;font-size:13px;line-height:1.45"><strong style="font-size:15px">Aproveite ao m&aacute;ximo!</strong><br>Esse &eacute; o nosso jeito de agradecer<br>por confiar no Lucro Caseiro.</td>
                                    </tr>
                                  </table>
                                </td>
                                <td class="cta-button" width="40%" align="right" valign="middle" style="width:40%">
                                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="right">
                                    <tr>
                                      <td bgcolor="${primary}" style="background-color:${primary};background-image:linear-gradient(135deg,${primaryStrong},${primary});border-radius:11px">
                                        <a href="https://app.lucrocaseiro.com.br" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Explorar meu plano</a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 42px 24px">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #e8e0dc">
                        <tr>
                          <td class="footer-item" width="45%" style="width:45%;padding-top:18px;color:#292d38;font-size:13px;font-weight:700;text-align:center"><span style="color:${primary};font-size:18px">&#9829;</span>&nbsp; Lucro Caseiro</td>
                          <td class="footer-item" width="55%" style="width:55%;padding-top:18px;color:#6f6b68;font-size:13px;text-align:center">Feito para quem empreende com amor</td>
                        </tr>
                      </table>
                      <p style="margin:15px 0 0;color:#77716e;font-size:11px;line-height:1.45;text-align:center">Esse presente n&atilde;o gera cobran&ccedil;a autom&aacute;tica. Ao final do per&iacute;odo, voc&ecirc; escolhe se deseja continuar.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`,
  };
}
