import type { ProductAnalyticsEvent } from "@lucro-caseiro/contracts";

/** Janela entre a criação da conta e a primeira identificação para contar como cadastro. */
export const SIGNUP_IDENTIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface UserLinkOutcome {
  /** A conta nunca tinha sido vista em nenhuma instalação antes desta abertura. */
  firstUserLink: boolean;
  userCreatedAt: Date | null;
}

export const NO_USER_LINK: UserLinkOutcome = {
  firstUserLink: false,
  userCreatedAt: null,
};

/**
 * O cadastro é registrado pelo servidor, qualquer que seja o método (e-mail ou Google):
 * primeira identificação de uma conta criada há pouco. Contas antigas que só agora
 * aparecem na coleta não viram cadastro.
 */
export function isFreshSignup(link: UserLinkOutcome, identifiedAt: Date): boolean {
  if (!link.firstUserLink || !link.userCreatedAt) return false;
  const age = identifiedAt.getTime() - link.userCreatedAt.getTime();
  return age <= SIGNUP_IDENTIFICATION_WINDOW_MS;
}

/** `signup_completed` é do servidor; versões antigas do app ainda o enviam e seriam contadas duas vezes. */
export function withoutServerOwnedEvents(
  events: ProductAnalyticsEvent[],
): ProductAnalyticsEvent[] {
  return events.filter(
    (event) => event.type !== "action" || event.name !== "signup_completed",
  );
}
