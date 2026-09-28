import { DEFAULT_BRAND_ID, type BrandConfig } from "@lucro-caseiro/brands";
import type { ReferralSummary } from "@lucro-caseiro/contracts";

/** Link do convite: site com UTM e o código; outras marcas vão para a loja. */
export function inviteUrl(
  brand: Pick<BrandConfig, "id" | "androidPackage">,
  code: string,
) {
  if (brand.id === DEFAULT_BRAND_ID) {
    return `https://lucrocaseiro.com.br/?utm_source=indicacao&utm_medium=whatsapp&utm_campaign=indique_ganhe&ref=${encodeURIComponent(code)}`;
  }
  return `https://play.google.com/store/apps/details?id=${brand.androidPackage}&referrer=utm_source%3Dindicacao%26utm_content%3D${encodeURIComponent(code)}`;
}

/** Mensagem pronta para o WhatsApp, com o código e onde digitar. */
export function inviteMessage(appName: string, code: string, url: string): string {
  return [
    `Oi! Uso o ${appName} para anotar vendas, fiado e ver quanto sobra no fim do mês. É grátis.`,
    "",
    `Baixe por aqui: ${url}`,
    "",
    `Depois de criar a conta, abra Mais > Indique e ganhe e digite meu código *${code}*.`,
    "Quando você registrar 3 vendas, nós ganhamos 1 mês do plano Essencial. 💛",
  ].join("\n");
}

export type ReferralStep = Readonly<{ done: number; total: number; label: string }>;

/** Progresso de quem foi convidado até liberar o prêmio. */
export function claimProgress(summary: ReferralSummary): ReferralStep | null {
  if (!summary.referredByName || summary.rewarded) return null;
  const done = Math.min(summary.salesCount, summary.requiredSales);
  const left = summary.requiredSales - done;
  let label = "Prêmio liberado!";
  if (left > 0) label = left === 1 ? "Falta 1 venda" : `Faltam ${left} vendas`;
  return { done, total: summary.requiredSales, label };
}

/** Frase do resumo de quem convida. */
export function invitedSummary(summary: ReferralSummary): string {
  if (summary.invitedCount === 0) return "Você ainda não convidou ninguém.";
  const people =
    summary.invitedCount === 1
      ? "1 pessoa entrou"
      : `${summary.invitedCount} pessoas entraram`;
  const months =
    summary.rewardedCount === 1 ? "1 mês ganho" : `${summary.rewardedCount} meses ganhos`;
  return `${people} com o seu código · ${months}`;
}

/** Normaliza o que a pessoa digitou (espaços, minúsculas). */
export function cleanCode(raw: string): string {
  return raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
}
