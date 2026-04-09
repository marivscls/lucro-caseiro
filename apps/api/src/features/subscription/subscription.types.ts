import type { UserProfile } from "@lucro-caseiro/contracts";

export interface ISubscriptionRepo {
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(userId: string, data: UpsertProfileData): Promise<UserProfile>;
  updatePlan(
    userId: string,
    plan: "free" | "premium",
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
}

export interface ResourceCounts {
  salesThisMonth: number;
  clients: number;
  recipes: number;
  packaging: number;
}

export interface FreemiumConfig {
  maxSalesPerMonth: number;
  maxClients: number;
  maxRecipes: number;
  maxPackaging: number;
}
