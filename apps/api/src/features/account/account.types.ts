/** Persistencia de conta: remove o usuario e (via cascade) todos os seus dados. */
export interface IAccountRepo {
  /**
   * Apaga a linha em `users`. Todas as tabelas referenciam `users.id` com
   * ON DELETE CASCADE, entao isso remove vendas, clientes, financeiro,
   * produtos, receitas, etc. do usuario. Idempotente.
   */
  deleteUser(userId: string): Promise<void>;
}

/**
 * Porta para o provedor de identidade (Supabase Auth). Mantida como interface
 * para o usecase ser puro/testavel e nao depender do SDK.
 */
export interface IAuthAdmin {
  /**
   * Remove o usuario do provedor de autenticacao. Deve lancar
   * ServiceUnavailableError se a credencial administrativa nao estiver
   * configurada (service-role key ausente).
   */
  deleteAuthUser(userId: string): Promise<void>;
}
