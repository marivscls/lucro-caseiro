interface PaidAccountDeletionCopy {
  readonly title: string;
  readonly message: string;
}

export function paidAccountDeletionCopy(
  planLabel: string,
  providerLabel: string,
): PaidAccountDeletionCopy {
  return {
    title: "Cancele a assinatura primeiro",
    message:
      `Excluir sua conta não cancela a cobrança do plano ${planLabel}. ` +
      `A assinatura continuará renovando pelo ${providerLabel} até você cancelá-la. ` +
      "Cancele agora ou confirme que já cancelou antes de apagar seus dados.",
  };
}
