import type {
  AnalyticsActionName,
  FreemiumLimits,
  PaidPlan,
  PlanType,
  UserProfile,
} from "@lucro-caseiro/contracts";
import { createHash } from "node:crypto";

import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../shared/errors";
import { buildFreemiumLimits, resolvePlan } from "./subscription.domain";
import type {
  AndroidPurchaseData,
  ISubscriptionRepo,
  ISubscriptionStatusProvider,
  SubscriptionLifecycleEvent,
  SubscriptionLifecycleNotifier,
  UpsertProfileData,
} from "./subscription.types";

function isPaidPlan(plan: PlanType): plan is PaidPlan {
  return plan === "essential" || plan === "professional";
}

function isLaterExpiration(previous: string | null, updated: string | null): boolean {
  if (!updated) return false;
  if (!previous) return true;
  return new Date(updated).getTime() > new Date(previous).getTime();
}

export class SubscriptionUseCases {
  constructor(
    private repo: ISubscriptionRepo,
    private statusProvider?: ISubscriptionStatusProvider,
    private recordLifecycleEvent?: (
      userId: string,
      action: AnalyticsActionName,
    ) => Promise<void>,
    private notifyLifecycle?: SubscriptionLifecycleNotifier,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil não encontrado");
    }
    return profile;
  }

  async ensureProfile(userId: string, data: UpsertProfileData): Promise<UserProfile> {
    return this.repo.upsertProfile(userId, data);
  }

  async updateProfile(
    userId: string,
    data: Partial<
      Pick<
        UpsertProfileData,
        "name" | "phone" | "businessName" | "businessType" | "avatarUrl"
      >
    >,
  ): Promise<UserProfile> {
    const existing = await this.repo.getProfile(userId);
    if (!existing) {
      throw new NotFoundError("Perfil não encontrado");
    }

    return this.repo.upsertProfile(userId, {
      email: existing.email,
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone ?? undefined,
      businessName: data.businessName ?? existing.businessName ?? undefined,
      businessType: data.businessType ?? existing.businessType ?? undefined,
      avatarUrl: data.avatarUrl ?? existing.avatarUrl ?? undefined,
    });
  }

  async getLimits(userId: string): Promise<FreemiumLimits> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil não encontrado");
    }

    const plan = resolvePlan(profile.plan, profile.planExpiresAt);
    const counts = await this.repo.getResourceCounts(userId);
    return buildFreemiumLimits(counts, plan);
  }

  /** Plano efetivo (já normalizado e considerando expiração). */
  async getActivePlan(userId: string): Promise<PlanType> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) return "free";
    return resolvePlan(profile.plan, profile.planExpiresAt);
  }

  async activatePlan(
    userId: string,
    plan: PlanType,
    expiresAt: Date | null,
  ): Promise<UserProfile> {
    const previous = await this.repo.getProfile(userId);
    const updated = await this.repo.updatePlan(userId, plan, expiresAt);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    const previousPlan = previous
      ? resolvePlan(previous.plan, previous.planExpiresAt)
      : "free";
    const activePlan = resolvePlan(updated.plan, updated.planExpiresAt);

    if (previous && previousPlan === "free" && isPaidPlan(activePlan)) {
      await this.recordLifecycleEvent?.(userId, "subscription_completed");
      await this.sendLifecycleNotification({
        kind: "activated",
        userId,
        email: updated.email,
        plan: activePlan,
        expiresAt: updated.planExpiresAt,
        deduplicationKey: `${activePlan}:${updated.planExpiresAt ?? "none"}`,
      });
    } else if (previous && isPaidPlan(previousPlan) && isPaidPlan(activePlan)) {
      if (previousPlan !== activePlan) {
        await this.sendLifecycleNotification({
          kind: "activated",
          userId,
          email: updated.email,
          plan: activePlan,
          expiresAt: updated.planExpiresAt,
          deduplicationKey: `${activePlan}:${updated.planExpiresAt ?? "none"}`,
        });
      } else if (isLaterExpiration(previous.planExpiresAt, updated.planExpiresAt)) {
        await this.sendLifecycleNotification({
          kind: "renewed",
          userId,
          email: updated.email,
          plan: activePlan,
          expiresAt: updated.planExpiresAt,
          deduplicationKey: `${activePlan}:${updated.planExpiresAt}`,
        });
      }
    }
    return updated;
  }

  async deactivatePlan(userId: string): Promise<UserProfile> {
    const previous = await this.repo.getProfile(userId);
    const updated = await this.repo.updatePlan(userId, "free", null);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    if (previous && resolvePlan(previous.plan, previous.planExpiresAt) !== "free") {
      await this.recordLifecycleEvent?.(userId, "subscription_cancelled");
      const previousPlan = resolvePlan(previous.plan, previous.planExpiresAt);
      if (isPaidPlan(previousPlan)) {
        await this.sendLifecycleNotification({
          kind: "cancelled",
          userId,
          email: previous.email,
          plan: previousPlan,
          expiresAt: null,
          deduplicationKey: `${previousPlan}:${previous.planExpiresAt ?? "none"}`,
        });
      }
    }
    return updated;
  }

  async notifyPaymentFailed(userId: string, deduplicationKey: string): Promise<void> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) return;
    const activePlan = resolvePlan(profile.plan, profile.planExpiresAt);
    if (!isPaidPlan(activePlan)) return;

    await this.sendLifecycleNotification({
      kind: "payment_failed",
      userId,
      email: profile.email,
      plan: activePlan,
      expiresAt: profile.planExpiresAt,
      deduplicationKey,
    });
  }

  async syncPlanFromProvider(
    userId: string,
    purchase: AndroidPurchaseData,
  ): Promise<UserProfile> {
    if (!this.statusProvider) {
      throw new ServiceUnavailableError(
        "Verificacao de assinatura Android não configurada no servidor",
      );
    }

    const state = await this.statusProvider.getPlanState(userId, purchase);

    if (state.plan !== "free") {
      if (state.purchaseOwnerId !== userId) {
        throw new ForbiddenError("Esta compra do Google Play nao pertence a esta conta.");
      }

      const tokenHash = createHash("sha256").update(purchase.purchaseToken).digest("hex");
      const claimed = await this.repo.claimPurchaseToken(
        userId,
        "google-play",
        tokenHash,
      );
      if (!claimed) {
        throw new ForbiddenError(
          "Esta compra do Google Play ja esta vinculada a outra conta.",
        );
      }

      return this.activatePlan(userId, state.plan, state.expiresAt);
    }

    return this.getProfile(userId);
  }

  private async sendLifecycleNotification(
    event: SubscriptionLifecycleEvent,
  ): Promise<void> {
    if (!this.notifyLifecycle) return;
    try {
      await this.notifyLifecycle(event);
    } catch (error) {
      console.error("Subscription lifecycle email failed", {
        kind: event.kind,
        userId: event.userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
