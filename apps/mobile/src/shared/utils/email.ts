// Validação leve de email, linear (sem regex com backtracking): exige um "@" no
// meio e um "." depois dele, sem espaços. Usada como guarda de UX nos formulários;
// o backend revalida com Zod (`z.string().email()`).
export function isValidEmail(email: string): boolean {
  if (/\s/.test(email)) return false;
  const at = email.indexOf("@");
  if (at <= 0) return false;
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
}

// Provedores mais usados no Brasil. Serve de "gabarito" para pegar erros de
// digitação no domínio (gmail.comm, gmial.com, hotmial.com...), que passam pela
// validação de formato porque continuam sendo endereços sintaticamente válidos.
const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
];

// Distância de Levenshtein (edições de 1 caractere entre duas strings). Linear
// em memória (duas linhas), suficiente para comparar domínios curtos.
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Sugere a correção de um e-mail cujo domínio está quase-igual a um provedor
 * comum (ex.: "maria@gmail.comm" → "maria@gmail.com"). Retorna o e-mail
 * corrigido, ou `null` quando o domínio já é conhecido ou está longe demais de
 * qualquer provedor comum. É só uma dica de UX contra erro de digitação — não
 * bloqueia nada; quem tem domínio próprio simplesmente ignora.
 */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  if (!domain.includes(".") || COMMON_EMAIL_DOMAINS.includes(domain)) return null;

  let best: { domain: string; dist: number } | null = null;
  for (const candidate of COMMON_EMAIL_DOMAINS) {
    const dist = editDistance(domain, candidate);
    if (!best || dist < best.dist) best = { domain: candidate, dist };
  }

  // Só sugere quando é um erro pequeno (1–2 edições). Acima disso é outro
  // domínio de verdade, não typo.
  if (!best || best.dist === 0 || best.dist > 2) return null;
  return `${local}@${best.domain}`;
}
