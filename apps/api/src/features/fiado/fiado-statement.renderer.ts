import { pixForCharge } from "@lucro-caseiro/contracts";
import qrcode from "qrcode-generator";

import { madeWithLabel, madeWithUrl } from "../../shared/helpers/made-with";
import { statementTotals } from "./fiado.domain";
import type { FiadoStatement } from "./fiado.types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateBR = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** QR do Pix em SVG (módulos escuros sobre branco, leitura garantida). */
function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const margin = 2;
  const size = count + margin * 2;
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col + margin} ${row + margin}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code do Pix"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${path}" fill="#24181E"/></svg>`;
}

function whatsappDigits(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

const STYLES = `:root{--wine:#4A2332;--rose:#B65F72;--lime:#DCE86A;--cream:#FAF8F6;--ink:#24181E;--blush:#F5E5E8;--warm:#6D6266;--line:#EADFE2;--white:#FFFFFF;--font:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);font-family:var(--font);line-height:1.5;font-size:16px}
main{max-width:520px;margin:0 auto;padding:24px 16px 40px;display:flex;flex-direction:column;gap:16px}
.hello{margin:0;color:var(--warm);font-size:15px}
h1{margin:0;font-size:24px;line-height:1.25;color:var(--wine)}
.card{background:var(--white);border:1px solid var(--line);border-radius:22px;padding:20px;display:flex;flex-direction:column;gap:12px}
.total{background:var(--wine);color:var(--white);border:0}
.total small{font-size:14px;opacity:.85}
.total strong{font-size:36px;line-height:1.1;font-variant-numeric:tabular-nums}
.total .tag{align-self:flex-start;background:var(--lime);color:var(--ink);font-weight:700;font-size:13px;padding:4px 10px;border-radius:999px}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
li:last-child{border-bottom:0}
li span{min-width:0}
li small{display:block;color:var(--warm);font-size:14px}
li b{font-variant-numeric:tabular-nums;white-space:nowrap}
h2{margin:0;font-size:18px}
.qr{width:200px;max-width:100%;align-self:center;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
.qr svg{display:block;width:100%;height:auto}
.code{width:100%;min-height:88px;resize:none;border:1px solid var(--line);border-radius:12px;padding:12px;font:13px/1.4 ui-monospace,Menlo,monospace;color:var(--ink);background:var(--cream);word-break:break-all}
.btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;border:0;font:inherit;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;padding:0 16px;text-align:center}
.btn-primary{background:var(--rose);color:var(--white)}
.btn-secondary{background:var(--blush);color:var(--wine)}
.btn:focus-visible{outline:3px solid var(--ink);outline-offset:2px}
.hint{margin:0;color:var(--warm);font-size:14px}
.done{text-align:center}
footer{text-align:center;font-size:14px;color:var(--warm);padding-top:8px}
footer a{color:var(--wine);font-weight:700}
@media (prefers-reduced-motion:no-preference){.btn{transition:transform .12s}.btn:active{transform:scale(.98)}}`;

/** Página pública do extrato do fiado (/f/:token). */
export function renderFiadoStatementHtml(
  statement: FiadoStatement,
  nonce: string,
): string {
  const seller = statement.owner.businessName?.trim() || statement.owner.name;
  const { open, total } = statementTotals(statement.sales);
  const rows = statement.sales
    .map((sale, index) => ({ sale, value: open[index] ?? 0 }))
    .filter((row) => row.value > 0);

  const pix =
    total > 0 ? pixForCharge(statement.owner.pix, seller, total, "FIADO") : null;
  const whatsapp = whatsappDigits(statement.owner.phone);
  const paidMessage = encodeURIComponent(
    `Oi! Aqui é ${firstName(statement.clientName)}. Acabei de pagar ${money(total)} pelo Pix.`,
  );

  const list = rows.length
    ? `<section class="card" aria-labelledby="itens"><h2 id="itens">O que está em aberto</h2><ul>${rows
        .map(
          ({ sale, value }) =>
            `<li><span>${escapeHtml(sale.description)}<small>${dateBR(sale.soldAt)}</small></span><b>${money(value)}</b></li>`,
        )
        .join("")}</ul></section>`
    : "";

  let pixBlock = "";
  if (pix) {
    pixBlock = `<section class="card" aria-labelledby="pix"><h2 id="pix">Pagar com Pix</h2><p class="hint">Abra o app do seu banco, escolha Pix copia e cola e cole o código. O valor de ${money(total)} já vem preenchido.</p><div class="qr">${qrSvg(pix)}</div><label for="pix-code" class="hint">Código Pix copia e cola</label><textarea id="pix-code" class="code" readonly>${escapeHtml(pix)}</textarea><button type="button" class="btn btn-primary" id="copy-pix">Copiar código Pix</button><p class="hint" id="copy-status" role="status" aria-live="polite"></p></section>`;
  } else if (total > 0) {
    pixBlock = `<section class="card"><p class="hint">Combine com ${escapeHtml(seller)} a melhor forma de pagar.</p></section>`;
  }

  const paidButton =
    total > 0 && whatsapp
      ? `<a class="btn btn-secondary" href="https://wa.me/${whatsapp}?text=${paidMessage}" rel="noopener">Avisar ${escapeHtml(firstName(seller))} que paguei</a>`
      : "";

  const purchases = rows.length === 1 ? "1 compra" : `${rows.length} compras`;
  const summary =
    total > 0
      ? `<section class="card total" aria-label="Total em aberto"><small>Total em aberto</small><strong>${money(total)}</strong><span class="tag">${purchases}</span></section>`
      : `<section class="card done"><h2>Tudo certo por aqui 💛</h2><p class="hint">Você não tem nada em aberto com ${escapeHtml(seller)}.</p></section>`;

  const script = pix
    ? `<script nonce="${nonce}">(function(){var b=document.getElementById("copy-pix"),t=document.getElementById("pix-code"),s=document.getElementById("copy-status");if(!b||!t)return;b.addEventListener("click",function(){function ok(){s.textContent="Código copiado. Agora cole no app do banco.";b.textContent="Código copiado";}function manual(){t.focus();t.select();s.textContent="Selecionei o código: toque e escolha Copiar.";}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(ok,manual);}else{manual();}});})();</script>`
    : "";

  const title = `Extrato de ${firstName(statement.clientName)} com ${seller}`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(title)}</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#4A2332"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet"><style>${STYLES}</style></head><body><main><p class="hello">Oi, ${escapeHtml(firstName(statement.clientName))}!</p><h1>Seu extrato com ${escapeHtml(seller)}</h1>${summary}${list}${pixBlock}${paidButton}<footer><a href="${escapeHtml(madeWithUrl(statement.brandId, "extrato_fiado"))}" rel="noopener">${escapeHtml(madeWithLabel(statement.brandId))}</a> · controle de vendas e fiado grátis</footer></main>${script}</body></html>`;
}

export function renderFiadoNotFoundHtml(): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Extrato não encontrado</title><meta name="robots" content="noindex,nofollow"><style>${STYLES}</style></head><body><main><h1>Extrato não encontrado</h1><p class="hint">Esse link não existe mais. Peça um link novo para quem te mandou.</p></main></body></html>`;
}
