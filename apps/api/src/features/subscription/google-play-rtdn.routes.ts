import { json, Router, type Response } from "express";

import { ServiceUnavailableError } from "../../shared/errors";
import {
  isAuthenticPubSubPush,
  isPubSubPushAuthConfigured,
  type IPushIdTokenVerifier,
  type PubSubPushAuthConfig,
} from "../../shared/middleware/pubsub-push-auth";
import { parsePlayPushBody } from "./google-play-rtdn.domain";
import type { GooglePlayNotificationsUseCases } from "./google-play-rtdn.usecases";

export interface GooglePlayRtdnRouterOptions {
  packageName: string;
  auth: PubSubPushAuthConfig;
  verifier: IPushIdTokenVerifier;
}

function logRtdn(fields: Record<string, unknown>): void {
  // Nunca inclui o purchase token.
  // eslint-disable-next-line no-console
  console.info(JSON.stringify({ event: "google_play_rtdn", ...fields }));
}

function unavailable(res: Response, error: string): void {
  res.status(503).json({ error });
}

/**
 * Google Play Real-time Developer Notifications via Pub/Sub push.
 * 2xx = mensagem processada ou ignorada de proposito (Pub/Sub nao reenvia);
 * 5xx = falha transitoria (Pub/Sub reenvia com backoff).
 */
export function createGooglePlayRtdnRouter(
  useCases: Pick<GooglePlayNotificationsUseCases, "handleSubscriptionNotification">,
  { packageName, auth, verifier }: GooglePlayRtdnRouterOptions,
): Router {
  const router = Router();

  router.post(
    "/google-play",
    async (req, res, next) => {
      if (!isPubSubPushAuthConfigured(auth)) {
        unavailable(res, "GOOGLE_PLAY_RTDN_NOT_CONFIGURED");
        return;
      }
      try {
        const ok = await isAuthenticPubSubPush(
          req.header("authorization"),
          auth,
          verifier,
        );
        if (!ok) {
          res.status(401).json({ error: "INVALID_PUBSUB_TOKEN" });
          return;
        }
      } catch (error) {
        if (error instanceof ServiceUnavailableError) {
          unavailable(res, "PUBSUB_TOKEN_VERIFICATION_UNAVAILABLE");
          return;
        }
        next(error);
        return;
      }
      next();
    },
    json({ limit: "64kb" }),
    async (req, res, next) => {
      const parsed = parsePlayPushBody(req.body, packageName);
      if (parsed.kind === "ignore") {
        logRtdn({
          messageId: parsed.messageId,
          result: "ignored",
          reason: parsed.reason,
        });
        res.status(200).json({ ok: true, result: "ignored" });
        return;
      }

      try {
        const outcome = await useCases.handleSubscriptionNotification(
          parsed.purchaseToken,
          parsed.subscriptionId ?? undefined,
        );
        const { decision } = outcome;
        logRtdn({
          messageId: parsed.messageId,
          notificationType: parsed.notificationType,
          userId: outcome.userId,
          result: decision.action === "ignore" ? "ignored" : decision.action,
          reason: decision.action === "ignore" ? decision.reason : undefined,
        });
        res.status(200).json({
          ok: true,
          result: decision.action === "ignore" ? "ignored" : "processed",
        });
      } catch (error) {
        if (error instanceof ServiceUnavailableError) {
          logRtdn({ messageId: parsed.messageId, result: "retry" });
          unavailable(res, "GOOGLE_PLAY_UNAVAILABLE");
          return;
        }
        next(error);
      }
    },
  );

  return router;
}
