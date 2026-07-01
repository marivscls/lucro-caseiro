import { raw, Router } from "express";
import type Stripe from "stripe";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { StripeUseCases } from "./stripe.usecases";
import type { BillingPeriod, PaidPlan } from "./payments.types";

export interface StripeRouterOptions {
  stripe: Pick<Stripe, "webhooks"> | null;
  webhookSecret: string;
}

export function createStripeCheckoutRouter(useCases: StripeUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/checkout", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { tier, period } = req.body as { tier?: string; period?: string };

      if (tier !== "essential" && tier !== "professional") {
        res.status(400).json({ error: "INVALID_PLAN" });
        return;
      }
      if (period !== "monthly" && period !== "annual") {
        res.status(400).json({ error: "INVALID_PERIOD" });
        return;
      }

      const url = await useCases.createCheckoutUrl({
        userId,
        tier: tier as PaidPlan,
        period: period as BillingPeriod,
      });
      res.json({ url });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createStripeWebhookRouter(
  useCases: StripeUseCases,
  { stripe, webhookSecret }: StripeRouterOptions,
): Router {
  const router = Router();

  router.post("/stripe", raw({ type: "application/json" }), async (req, res, next) => {
    let event: Stripe.Event;
    try {
      event = buildStripeEvent(req.body as Buffer, req.headers, {
        stripe,
        webhookSecret,
      });
    } catch {
      res.status(400).json({ error: "INVALID_STRIPE_SIGNATURE" });
      return;
    }

    try {
      await useCases.handleEvent(event);
      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

function buildStripeEvent(
  body: Buffer,
  headers: Record<string, unknown>,
  { stripe, webhookSecret }: StripeRouterOptions,
): Stripe.Event {
  if (!webhookSecret) {
    return JSON.parse(body.toString("utf8")) as Stripe.Event;
  }

  const signature = headers["stripe-signature"];
  if (!stripe || typeof signature !== "string") {
    throw new Error("Assinatura Stripe invalida");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
