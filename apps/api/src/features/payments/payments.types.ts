export type PaymentPlan = "monthly" | "annual";

export interface CheckoutUrlInput {
  userId: string;
  plan: PaymentPlan;
}
