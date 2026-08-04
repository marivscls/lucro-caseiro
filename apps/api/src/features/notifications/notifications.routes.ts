import { DEFAULT_BRAND_ID } from "@lucro-caseiro/brands";
import { Router } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { NotificationsUseCases } from "./notifications.usecases";

const ExpoPushTokenDto = z
  .string()
  .trim()
  .max(200)
  .regex(/^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/);

const RegisterPushTokenDto = z
  .object({
    token: ExpoPushTokenDto,
    platform: z.enum(["android", "ios"]),
  })
  .strict();

const UnregisterPushTokenDto = z.object({ token: ExpoPushTokenDto }).strict();

export function createNotificationsRouter(useCases: NotificationsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/push-token", async (req, res, next) => {
    try {
      await useCases.registerDevice(
        getUserId(req),
        req.header("x-brand")?.trim() || DEFAULT_BRAND_ID,
        RegisterPushTokenDto.parse(req.body),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.delete("/push-token", async (req, res, next) => {
    try {
      const { token } = UnregisterPushTokenDto.parse(req.body);
      await useCases.unregisterDevice(getUserId(req), token);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
