import type { MeiActivity } from "@lucro-caseiro/contracts";
import { users } from "@lucro-caseiro/database/schema";
import { eq } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { IMeiRepo } from "./mei.types";

export class MeiRepoPg implements IMeiRepo {
  constructor(private db: AppDatabase) {}

  async getActivity(userId: string): Promise<MeiActivity | null> {
    const [row] = await this.db
      .select({ activity: users.meiActivity })
      .from(users)
      .where(eq(users.id, userId));
    return (row?.activity as MeiActivity | null) ?? null;
  }

  async setActivity(
    userId: string,
    activity: MeiActivity | null,
  ): Promise<MeiActivity | null> {
    const [row] = await this.db
      .update(users)
      .set({ meiActivity: activity })
      .where(eq(users.id, userId))
      .returning({ activity: users.meiActivity });
    return (row?.activity as MeiActivity | null) ?? null;
  }
}
