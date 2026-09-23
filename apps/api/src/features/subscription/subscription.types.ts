import type { PaidPlan, PlanType, UserProfile } from "@lucro-caseiro/contracts";

export type SubscriptionLifecycleKind =
  | "activated"
  | "renewed"
  | "payment_failed"
  | "cancelled";

export interface SubscriptionLifecycleEvent {
  kind: SubscriptionLifecycleKind;
  userId: string;
  email: string;
  plan: PaidPlan;
  expiresAt: string | null;
  deduplicationKey: string;
}

export type SubscriptionLifecycleNotifier = (
  event: SubscriptionLifecycleEvent,
) => Promise<void>;

export interface ProfessionalTrialCampaignEmail {
  userId: string;
  email: string;
  expiresAt: string;
  idempotencyKey: string;
}

export type ProfessionalTrialCampaignNotifier = (
  event: ProfessionalTrialCampaignEmail,
) => Promise<{ id: string }>;

export interface ProfessionalTrialCampaignEmailClaim {
  userId: string;
  email: string;
  expiresAt: string;
}

export interface ISubscriptionRepo {
  getProfile(userId: string): Promise<UserProfile | null>;
  upsertProfile(userId: string, data: UpsertProfileData): Promise<UserProfile>;
  updatePlan(
    userId: string,
    plan: PlanType,
    expiresAt: Date | null,
  ): Promise<UserProfile | null>;
  getResourceCounts(userId: string): Promise<ResourceCounts>;
  claimPurchaseToken(
    userId: string,
    provider: "google-play",
    tokenHash: string,
  ): Promise<boolean>;
  /** true se este token (hash) ja foi vinculado a este usuario via `claimPurchaseToken`. */
  hasPurchaseClaim(
    userId: string,
    provider: "google-play",
    tokenHash: string,
  ): Promise<boolean>;
  claimProfessionalTrialCampaignEmail(
    userId: string,
  ): Promise<ProfessionalTrialCampaignEmailClaim | null>;
  completeProfessionalTrialCampaignEmail(
    userId: string,
    messageId: string,
  ): Promise<void>;
  releaseProfessionalTrialCampaignEmail(userId: string, error: string): Promise<void>;
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
  purchaseOwnerId: string | null;
}

export interface ISubscriptionStatusProvider {
  getPlanState(userId: string, purchase: AndroidPurchaseData): Promise<ProviderPlanState>;
}

/** Estado de um purchase token do Google Play (subscriptionsv2), sem o token. */
export interface GooglePlaySubscriptionSnapshot {
  /** Tier resolvido pelo product id / base plan; `null` se nao for um SKU pago nosso. */
  plan: PaidPlan | null;
  /** Ativo, em carencia ou cancelado com expiracao futura. */
  active: boolean;
  expiresAt: Date | null;
  purchaseOwnerId: string | null;
}

export interface IGooglePlaySubscriptionLookup {
  getSubscription(
    purchaseToken: string,
    productIdHint?: string,
  ): Promise<GooglePlaySubscriptionSnapshot | null>;
}
