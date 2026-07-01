import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";

export type { BillingPeriod, PaidPlan };

export interface CheckoutUrlInput {
  userId: string;
  tier: PaidPlan;
  period: BillingPeriod;
}
