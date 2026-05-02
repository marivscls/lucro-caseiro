export type PaymentPlan = "monthly" | "annual";

export type PreapprovalStatus = "authorized" | "paused" | "cancelled" | "pending";

export interface MercadoPagoPreapproval {
  id: string;
  status: PreapprovalStatus;
  external_reference: string;
  next_payment_date: string | null;
  end_date: string | null;
}

export interface MercadoPagoNotification {
  type: string;
  action?: string;
  data: { id: string };
}

export interface IMercadoPagoClient {
  getPreapproval(id: string): Promise<MercadoPagoPreapproval>;
}

export interface CheckoutUrlInput {
  userId: string;
  plan: PaymentPlan;
}
