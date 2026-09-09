import { DEFAULT_BRAND_ID, brands } from "@lucro-caseiro/brands";
import { Router } from "express";
import { z } from "zod";
import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { NotFoundError, ServiceUnavailableError } from "../../shared/errors";
import { PushEndpointDto, WebSubscriptionDto } from "./web-push.domain";
import type { WebPushRepoPg, WebPushSender } from "./web-push.repo.pg";

export function createWebPushRouter(
  repo: WebPushRepoPg,
  publicKey: string,
  send: WebPushSender | null,
): Router {
  const router = Router();
  // VAPID's public key contains no account data; keep readiness independent of session expiry.
  router.get("/config", (_req, res) => {
    res.json({ publicKey: send ? publicKey : null });
  });
  router.use(authMiddleware);
  router.use((_req, _res, next) => {
    next(
      send
        ? undefined
        : new ServiceUnavailableError(
            "Notificações ainda não estão configuradas no servidor.",
          ),
    );
  });
  const brand = (value?: string) =>
    z
      .string()
      .refine((id) => Object.hasOwn(brands, id))
      .parse(value?.trim() || DEFAULT_BRAND_ID);
  router.put("/subscription", async (req, res, next) => {
    try {
      await repo.register(
        getUserId(req),
        brand(req.header("x-brand")),
        WebSubscriptionDto.parse(req.body),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  router.delete("/subscription", async (req, res, next) => {
    try {
      const { endpoint } = z
        .object({ endpoint: PushEndpointDto })
        .strict()
        .parse(req.body);
      await repo.remove(getUserId(req), brand(req.header("x-brand")), endpoint);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  router.post("/test", async (req, res, next) => {
    try {
      const { endpoint } = z
        .object({ endpoint: PushEndpointDto })
        .strict()
        .parse(req.body);
      const brandId = brand(req.header("x-brand"));
      const subscription = await repo.get(getUserId(req), brandId, endpoint);
      if (!subscription)
        throw new NotFoundError("Ative as notificações neste navegador primeiro.");
      const result = await send!(subscription, {
        title: "Notificações ativadas",
        body: "Tudo certo! Os lembretes podem chegar mesmo com a página fechada.",
        url: "/settings",
        tag: "web-push-test",
      });
      if (result === "expired") {
        await repo.remove(getUserId(req), brandId, endpoint);
        throw new NotFoundError(
          "A inscrição expirou. Desative e ative as notificações novamente.",
        );
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  return router;
}
