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
