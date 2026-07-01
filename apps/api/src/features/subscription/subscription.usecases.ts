import type { FreemiumLimits, PlanType, UserProfile } from "@lucro-caseiro/contracts";

import { NotFoundError, ServiceUnavailableError } from "../../shared/errors";
import { buildFreemiumLimits, resolvePlan } from "./subscription.domain";
import type {
  AndroidPurchaseData,
  ISubscriptionRepo,
  ISubscriptionStatusProvider,
  UpsertProfileData,
} from "./subscription.types";

export class SubscriptionUseCases {
  constructor(
    private repo: ISubscriptionRepo,
    private statusProvider?: ISubscriptionStatusProvider,
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
    const updated = await this.repo.updatePlan(userId, plan, expiresAt);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    return updated;
  }

  async deactivatePlan(userId: string): Promise<UserProfile> {
    const updated = await this.repo.updatePlan(userId, "free", null);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    return updated;
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
      return this.activatePlan(userId, state.plan, state.expiresAt);
    }

    return this.getProfile(userId);
  }
}
