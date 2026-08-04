import type Stripe from "stripe";

export interface StripeWebhookOptions {
  stripe: Pick<Stripe, "webhooks"> | null;
  webhookSecret: string;
}

export function buildStripeEvent(
  body: Buffer,
  headers: Record<string, unknown>,
  { stripe, webhookSecret }: StripeWebhookOptions,
): Stripe.Event {
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET nao configurado");
  }

  const signature = headers["stripe-signature"];
  if (!stripe || typeof signature !== "string") {
    throw new Error("Assinatura Stripe invalida");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
