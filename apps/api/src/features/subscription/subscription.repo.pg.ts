import type { PlanProvider, PlanType, UserProfile } from "@lucro-caseiro/contracts";
import { newAccountPlan, normalizePlan } from "@lucro-caseiro/contracts";
import {
  clients,
  orders,
  packaging,
  premiumTrialClaims,
  professionalTrialCampaignGrants,
  products,
  recipes,
  sales,
  subscriptionPurchaseClaims,
  suppliers,
  users,
} from "@lucro-caseiro/database/schema";
import { and, count, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import { trialEmailHash } from "./subscription.domain";
import type {
  ISubscriptionRepo,
  PlanWriteOptions,
  ProfessionalTrialCampaignEmailClaim,
  ResourceCounts,
  UpsertProfileData,
} from "./subscription.types";

function toPlanProvider(value: string | null): PlanProvider | null {
  return value === "stripe" || value === "google_play" ? value : null;
}

export class SubscriptionRepoPg implements ISubscriptionRepo {
  constructor(private db: AppDatabase) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId));

    return row ? await this.toProfile(row) : null;
  }

  async claimPremiumTrial(
    userId: string,
    email: string,
    provider: PlanProvider,
  ): Promise<boolean> {
    const emailHash = trialEmailHash(email);
    const [claimed] = await this.db
      .insert(premiumTrialClaims)
      .values({ emailHash, userId, provider })
      .onConflictDoNothing({ target: premiumTrialClaims.emailHash })
      .returning({ userId: premiumTrialClaims.userId });
    if (claimed) return true;

    const [existing] = await this.db
      .select({ userId: premiumTrialClaims.userId })
      .from(premiumTrialClaims)
      .where(eq(premiumTrialClaims.emailHash, emailHash));
    return existing?.userId === userId;
  }

  private async hasUsedTrial(email: string): Promise<boolean> {
    if (!email.trim()) return true;
    const [row] = await this.db
      .select({ userId: premiumTrialClaims.userId })
      .from(premiumTrialClaims)
      .where(eq(premiumTrialClaims.emailHash, trialEmailHash(email)));
    return Boolean(row);
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
        avatarUrl: data.avatarUrl ?? null,
        // Conta nova nasce no Gratuito. Só no INSERT: o onConflict abaixo
        // nunca mexe no plano de quem já existe.
        ...newAccountPlan(),
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
          avatarUrl: data.avatarUrl ?? null,
        },
      })
      .returning();

    return await this.toProfile(row!);
  }

  async updatePlan(
    userId: string,
    plan: PlanType,
    expiresAt: Date | null,
    options: PlanWriteOptions = {},
  ): Promise<UserProfile | null> {
    const [row] = await this.db
      .update(users)
      // Toda escrita de plano vinda de compra/loja substitui o estado anterior
      // (inclusive um período grátis sem cartão).
      .set({
        plan,
        planExpiresAt: expiresAt,
        planIsTrial: options.isTrial ?? false,
        planProvider: options.provider ?? null,
      })
      .where(eq(users.id, userId))
      .returning();

    return row ? await this.toProfile(row) : null;
  }

  async claimPurchaseToken(
    userId: string,
    provider: "google-play",
    tokenHash: string,
  ): Promise<boolean> {
    const [claimed] = await this.db
      .insert(subscriptionPurchaseClaims)
      .values({ userId, provider, tokenHash })
      .onConflictDoNothing({
        target: [
          subscriptionPurchaseClaims.provider,
          subscriptionPurchaseClaims.tokenHash,
        ],
      })
      .returning({ userId: subscriptionPurchaseClaims.userId });

    if (claimed) return true;

    const [existing] = await this.db
      .select({ userId: subscriptionPurchaseClaims.userId })
      .from(subscriptionPurchaseClaims)
      .where(
        and(
          eq(subscriptionPurchaseClaims.provider, provider),
          eq(subscriptionPurchaseClaims.tokenHash, tokenHash),
        ),
      );

    if (existing?.userId !== userId) return false;

    await this.db
      .update(subscriptionPurchaseClaims)
      .set({ lastVerifiedAt: new Date() })
      .where(
        and(
          eq(subscriptionPurchaseClaims.provider, provider),
          eq(subscriptionPurchaseClaims.tokenHash, tokenHash),
          eq(subscriptionPurchaseClaims.userId, userId),
        ),
      );
    return true;
  }

  async hasPurchaseClaim(
    userId: string,
    provider: "google-play",
    tokenHash: string,
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: subscriptionPurchaseClaims.id })
      .from(subscriptionPurchaseClaims)
      .where(
        and(
          eq(subscriptionPurchaseClaims.userId, userId),
          eq(subscriptionPurchaseClaims.provider, provider),
          eq(subscriptionPurchaseClaims.tokenHash, tokenHash),
        ),
      )
      .limit(1);
    return !!row;
  }

  async claimProfessionalTrialCampaignEmail(
    userId: string,
  ): Promise<ProfessionalTrialCampaignEmailClaim | null> {
    const claimExpiredBefore = new Date(Date.now() - 15 * 60 * 1000);
    const [claim] = await this.db
      .update(professionalTrialCampaignGrants)
      .set({
        emailClaimedAt: new Date(),
        emailAttempts: sql`${professionalTrialCampaignGrants.emailAttempts} + 1`,
        emailLastError: null,
      })
      .where(
        and(
          eq(professionalTrialCampaignGrants.userId, userId),
          isNull(professionalTrialCampaignGrants.emailSentAt),
          gt(professionalTrialCampaignGrants.expiresAt, new Date()),
          or(
            isNull(professionalTrialCampaignGrants.emailClaimedAt),
            lt(professionalTrialCampaignGrants.emailClaimedAt, claimExpiredBefore),
          ),
        ),
      )
      .returning({
        userId: professionalTrialCampaignGrants.userId,
        email: professionalTrialCampaignGrants.email,
        expiresAt: professionalTrialCampaignGrants.expiresAt,
      });

    return claim ? { ...claim, expiresAt: claim.expiresAt.toISOString() } : null;
  }

  async completeProfessionalTrialCampaignEmail(
    userId: string,
    messageId: string,
  ): Promise<void> {
    await this.db
      .update(professionalTrialCampaignGrants)
      .set({
        emailClaimedAt: null,
        emailSentAt: new Date(),
        emailMessageId: messageId,
        emailLastError: null,
      })
      .where(
        and(
          eq(professionalTrialCampaignGrants.userId, userId),
          isNull(professionalTrialCampaignGrants.emailSentAt),
        ),
      );
  }

  async releaseProfessionalTrialCampaignEmail(
    userId: string,
    error: string,
  ): Promise<void> {
    await this.db
      .update(professionalTrialCampaignGrants)
      .set({
        emailClaimedAt: null,
        emailLastError: error.slice(0, 2000),
      })
      .where(
        and(
          eq(professionalTrialCampaignGrants.userId, userId),
          isNull(professionalTrialCampaignGrants.emailSentAt),
        ),
      );
  }

  async getResourceCounts(userId: string): Promise<ResourceCounts> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      salesCount,
      clientsCount,
      recipesCount,
      packagingCount,
      productsCount,
      suppliersCount,
      ordersCount,
    ] = await Promise.all([
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
      this.db
        .select({ value: count() })
        .from(products)
        .where(and(eq(products.userId, userId), eq(products.isActive, true))),
      this.db
        .select({ value: count() })
        .from(suppliers)
        .where(eq(suppliers.userId, userId)),
      // Mesma janela do salesThisMonth. Pedidos da vitrine (source "catalog")
      // ficam de fora: nunca travam nem contam no limite do Gratuito.
      this.db
        .select({ value: count() })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            gte(orders.createdAt, startOfMonth),
            or(isNull(orders.source), sql`${orders.source} <> 'catalog'`),
          ),
        ),
    ]);

    return {
      salesThisMonth: salesCount[0]?.value ?? 0,
      clients: clientsCount[0]?.value ?? 0,
      recipes: recipesCount[0]?.value ?? 0,
      packaging: packagingCount[0]?.value ?? 0,
      products: productsCount[0]?.value ?? 0,
      suppliers: suppliersCount[0]?.value ?? 0,
      ordersThisMonth: ordersCount[0]?.value ?? 0,
    };
  }

  private async toProfile(row: typeof users.$inferSelect): Promise<UserProfile> {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      businessName: row.businessName,
      businessType: row.businessType,
      avatarUrl: row.avatarUrl,
      plan: normalizePlan(row.plan),
      planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
      planIsTrial: row.planIsTrial,
      planProvider: toPlanProvider(row.planProvider),
      trialAvailable: !(await this.hasUsedTrial(row.email)),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
