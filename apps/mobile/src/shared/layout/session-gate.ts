/**
 * Rotas que podem ser vistas sem sessão. Qualquer outra tela autenticada
 * precisa redirecionar para o login quando a sessão acaba — senão o cache
 * zerado aparece como uma "conta vazia" no lugar do login.
 */
export const PUBLIC_ROOT_SEGMENTS = [
  "",
  "(auth)",
  "auth",
  "reset-password",
  "c",
] as const;

export function shouldRedirectToLogin(args: {
  isLoading: boolean;
  isAuthenticated: boolean;
  rootSegment: string;
}): boolean {
  if (args.isLoading || args.isAuthenticated) return false;
  return !(PUBLIC_ROOT_SEGMENTS as readonly string[]).includes(args.rootSegment);
}
