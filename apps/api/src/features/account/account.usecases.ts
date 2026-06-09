import type { IAccountRepo, IAuthAdmin } from "./account.types";

export class AccountUseCases {
  constructor(
    private repo: IAccountRepo,
    private authAdmin: IAuthAdmin,
  ) {}

  /**
   * Exclusao definitiva e irreversivel da conta.
   *
   * Ordem proposital: remove o usuario do Auth PRIMEIRO (operacao privilegiada,
   * a mais sujeita a falhar). Se ela falhar (ex.: service-role key ausente),
   * lanca antes de tocar os dados — nada e apagado e o usuario pode tentar de
   * novo com seguranca. So depois apaga a linha em `users`, que remove em
   * cascata todos os dados do usuario (backstop idempotente, caso o Auth nao
   * tenha cascateado para `public.users`).
   */
  async deleteAccount(userId: string): Promise<void> {
    await this.authAdmin.deleteAuthUser(userId);
    await this.repo.deleteUser(userId);
  }
}
