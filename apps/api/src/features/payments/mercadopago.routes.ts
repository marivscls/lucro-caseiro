import { createHmac, timingSafeEqual } from "node:crypto";

import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { MercadoPagoUseCases } from "./mercadopago.usecases";
import type { MercadoPagoNotification, PaymentPlan } from "./payments.types";

export interface MercadoPagoRouterOptions {
  webhookSecret: string;
}

function isValidSignature(
  rawSignature: string | undefined,
  rawRequestId: string | undefined,
  dataId: string,
  secret: string,
): boolean {
  if (!secret) return true;
  if (!rawSignature || !rawRequestId) return false;

  const ts = /ts=([^,]+)/.exec(rawSignature)?.[1];
  const v1 = /v1=([^,]+)/.exec(rawSignature)?.[1];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${rawRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createMercadoPagoCheckoutRouter(useCases: MercadoPagoUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/checkout", (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { plan } = req.body as { plan: PaymentPlan };

      if (plan !== "monthly" && plan !== "annual") {
        res.status(400).json({ error: "INVALID_PLAN" });
        return;
      }

      const url = useCases.createCheckoutUrl({ userId, plan });
      res.json({ url });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createMercadoPagoWebhookRouter(
  useCases: MercadoPagoUseCases,
  { webhookSecret }: MercadoPagoRouterOptions,
): Router {
  const router = Router();

  router.post("/mercadopago", async (req, res, next) => {
    try {
      const body = req.body as MercadoPagoNotification | undefined;
      const dataId = body?.data?.id;

      if (!body?.type || !dataId) {
        res.status(400).json({ error: "INVALID_PAYLOAD" });
        return;
      }

      const signatureHeader = req.headers["x-signature"];
      const requestIdHeader = req.headers["x-request-id"];
      const signature = Array.isArray(signatureHeader)
        ? signatureHeader[0]
        : signatureHeader;
      const requestId = Array.isArray(requestIdHeader)
        ? requestIdHeader[0]
        : requestIdHeader;

      if (!isValidSignature(signature, requestId, dataId, webhookSecret)) {
        res.status(401).json({ error: "INVALID_SIGNATURE" });
        return;
      }

      await useCases.handleNotification(body);
      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
