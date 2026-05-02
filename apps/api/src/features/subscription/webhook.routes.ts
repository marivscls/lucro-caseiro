import { Router } from "express";

import { config } from "../../config";
import type { SubscriptionUseCases } from "./subscription.usecases";

/**
 * RevenueCat webhook event types we handle.
 * @see https://www.revenuecat.com/docs/integrations/webhooks
 */
type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE_DETECTED"
  | "PRODUCT_CHANGE"
  | "TEST";

interface RevenueCatEvent {
  type: RevenueCatEventType;
  app_user_id: string;
  expiration_at_ms: number | null;
  event_timestamp_ms: number;
}

interface RevenueCatWebhookBody {
  api_version: string;
  event: RevenueCatEvent;
}

export function createWebhookRouter(useCases: SubscriptionUseCases): Router {
  const router = Router();

  router.post("/revenuecat", async (req, res, next) => {
    try {
      // Validate webhook secret
      const authHeader = req.headers.authorization;
      if (
        config.revenuecatWebhookSecret &&
        authHeader !== `Bearer ${config.revenuecatWebhookSecret}`
      ) {
        res.status(401).json({ error: "UNAUTHORIZED" });
        return;
      }

      const body = req.body as RevenueCatWebhookBody;
      const { event } = body;

      if (!event?.type || !event.app_user_id) {
        res.status(400).json({ error: "INVALID_PAYLOAD" });
        return;
      }

      const userId = event.app_user_id;
      const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;

      switch (event.type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "PRODUCT_CHANGE":
          await useCases.activatePremium(userId, expiresAt);
          console.warn(
            `[webhook] ${event.type} for user ${userId}, expires: ${expiresAt?.toISOString() ?? "never"}`,
          );
          break;

        case "CANCELLATION":
        case "EXPIRATION":
          await useCases.deactivatePremium(userId);
          console.warn(`[webhook] ${event.type} for user ${userId}`);
          break;

        case "BILLING_ISSUE_DETECTED":
          // Log but don't deactivate yet — RevenueCat retries billing
          console.warn(`[webhook] BILLING_ISSUE for user ${userId}`);
          break;

        case "TEST":
          console.warn("[webhook] Test event received");
          break;

        default:
          console.warn(`[webhook] Unhandled event type: ${String(event.type)}`);
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
