import type { PlanType, UserProfile } from "@lucro-caseiro/contracts";

export interface ISubscriptionRepo {
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(userId: string, data: UpsertProfileData): Promise<UserProfile>;
  updatePlan(
    userId: string,
    plan: PlanType,
    expiresAt: Date | null,
  ): Promise<UserProfile | null>;
  getResourceCounts(userId: string): Promise<ResourceCounts>;
}

export interface UpsertProfileData {
  email: string;
  name: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  avatarUrl?: string | null;
}

export interface ResourceCounts {
  salesThisMonth: number;
  clients: number;
  recipes: number;
  packaging: number;
  products: number;
  suppliers: number;
}

export interface AndroidPurchaseData {
  productId: string;
  purchaseToken: string;
}

export interface ProviderPlanState {
  plan: PlanType;
  expiresAt: Date | null;
}

export interface ISubscriptionStatusProvider {
  getPlanState(userId: string, purchase: AndroidPurchaseData): Promise<ProviderPlanState>;
}
