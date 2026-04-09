import type { FreemiumLimits, UserProfile } from "@lucro-caseiro/contracts";

import { NotFoundError } from "../../shared/errors";
import { buildFreemiumLimits, isPremiumActive } from "./subscription.domain";
import type { ISubscriptionRepo, UpsertProfileData } from "./subscription.types";

export class SubscriptionUseCases {
  constructor(private repo: ISubscriptionRepo) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil nao encontrado");
    }
    return profile;
  }

  async ensureProfile(userId: string, data: UpsertProfileData): Promise<UserProfile> {
    return this.repo.upsertProfile(userId, data);
  }

  async updateProfile(
    userId: string,
    data: Partial<
      Pick<UpsertProfileData, "name" | "phone" | "businessName" | "businessType">
    >,
  ): Promise<UserProfile> {
    const existing = await this.repo.getProfile(userId);
    if (!existing) {
      throw new NotFoundError("Perfil nao encontrado");
    }

    return this.repo.upsertProfile(userId, {
      email: existing.email,
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone ?? undefined,
      businessName: data.businessName ?? existing.businessName ?? undefined,
      businessType: data.businessType ?? existing.businessType ?? undefined,
    });
  }

  async getLimits(userId: string): Promise<FreemiumLimits> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil nao encontrado");
    }

    const premium = isPremiumActive(profile.plan, profile.planExpiresAt);
    const counts = await this.repo.getResourceCounts(userId);
    return buildFreemiumLimits(counts, premium);
  }

  async isPremium(userId: string): Promise<boolean> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) return false;
    return isPremiumActive(profile.plan, profile.planExpiresAt);
  }

  async activatePremium(userId: string, expiresAt: Date | null): Promise<UserProfile> {
    const updated = await this.repo.updatePlan(userId, "premium", expiresAt);
    if (!updated) {
      throw new NotFoundError("Perfil nao encontrado");
    }
    return updated;
  }

  async deactivatePremium(userId: string): Promise<UserProfile> {
    const updated = await this.repo.updatePlan(userId, "free", null);
    if (!updated) {
      throw new NotFoundError("Perfil nao encontrado");
    }
    return updated;
  }
}
