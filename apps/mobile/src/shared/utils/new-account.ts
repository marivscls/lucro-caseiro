// Janela após o cadastro em que a conta ainda conta como "nova" para exibir o
// onboarding. O onboarding abre segundos depois do cadastro; passado isso, é um
// usuário retornando (login ou recuperação de senha), que nunca deve rever o
// fluxo — mesmo num aparelho novo ou sem nome de negócio salvo.
export const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

// Decide se a conta é recém-criada a partir do `created_at` do usuário (Auth).
// Puro e testável: recebe o "agora" em ms. Na dúvida (sem data ou data inválida)
// retorna false — melhor NÃO reexibir o onboarding do que mostrá-lo para quem já
// tem conta.
export function isNewAccount(createdAt: string | null | undefined, now: number): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return now - created < NEW_ACCOUNT_WINDOW_MS;
}
