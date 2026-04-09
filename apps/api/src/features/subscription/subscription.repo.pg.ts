import type { UserProfile } from "@lucro-caseiro/contracts";
import {
  clients,
  packaging,
  recipes,
  sales,
  users,
} from "@lucro-caseiro/database/schema";
import { and, count, eq, gte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type {
  ISubscriptionRepo,
  ResourceCounts,
  UpsertProfileData,
} from "./subscription.types";

export class SubscriptionRepoPg implements ISubscriptionRepo {
  constructor(private db: PostgresJsDatabase) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId));

    return row ? this.toProfile(row) : null;
  }

  async upsertProfile(userId: string, data: UpsertProfileData): Promise<UserProfile> {
    const [row] = await this.db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        name: data.name,
        phone: data.phone ?? null,
        businessName: data.businessName ?? null,
        businessType: data.businessType as
          | "food"
          | "beauty"
          | "crafts"
          | "services"
          | "other"
          | undefined,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: data.name,
          phone: data.phone ?? null,
          businessName: data.businessName ?? null,
          businessType: data.businessType as
            | "food"
            | "beauty"
            | "crafts"
            | "services"
            | "other"
            | undefined,
        },
      })
      .returning();

    return this.toProfile(row!);
  }

  async updatePlan(
    userId: string,
    plan: "free" | "premium",
    expiresAt: Date | null,
  ): Promise<UserProfile | null> {
    const [row] = await this.db
      .update(users)
      .set({ plan, planExpiresAt: expiresAt })
      .where(eq(users.id, userId))
      .returning();

    return row ? this.toProfile(row) : null;
  }

  async getResourceCounts(userId: string): Promise<ResourceCounts> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [salesCount, clientsCount, recipesCount, packagingCount] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(sales)
        .where(and(eq(sales.userId, userId), gte(sales.soldAt, startOfMonth))),
      this.db.select({ value: count() }).from(clients).where(eq(clients.userId, userId)),
      this.db.select({ value: count() }).from(recipes).where(eq(recipes.userId, userId)),
      this.db
        .select({ value: count() })
        .from(packaging)
        .where(eq(packaging.userId, userId)),
    ]);

    return {
      salesThisMonth: salesCount[0]?.value ?? 0,
      clients: clientsCount[0]?.value ?? 0,
      recipes: recipesCount[0]?.value ?? 0,
      packaging: packagingCount[0]?.value ?? 0,
    };
  }

  private toProfile(row: typeof users.$inferSelect): UserProfile {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      businessName: row.businessName,
      businessType: row.businessType,
      plan: row.plan,
      planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
