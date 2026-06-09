import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../shared/hooks/use-auth";
import { deleteAccount } from "./api";

/**
 * Exclui a conta no backend e, em caso de sucesso, encerra a sessão local e
 * limpa o cache inteiro do React Query (a conta não existe mais).
 */
export function useDeleteAccount() {
  const { token, signOut } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAccount(token!),
    onSuccess: async () => {
      await signOut();
      queryClient.clear();
    },
  });
}
