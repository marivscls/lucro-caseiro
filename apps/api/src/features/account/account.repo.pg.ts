import { users } from "@lucro-caseiro/database/schema";
import { eq } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IAccountRepo } from "./account.types";

export class AccountRepoPg implements IAccountRepo {
  constructor(private db: AppDatabase) {}

  async deleteUser(userId: string): Promise<void> {
    // ON DELETE CASCADE em todas as tabelas user-scoped remove os dados filhos.
    await this.db.delete(users).where(eq(users.id, userId));
  }
}
