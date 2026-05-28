import { UpdateProfileDto } from "@lucro-caseiro/contracts";
import { Router } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { SubscriptionUseCases } from "./subscription.usecases";

const AndroidPurchaseDto = z.object({
  platform: z.literal("android"),
  productId: z.enum(["lucrocaseiro_premium_monthly", "lucrocaseiro_premium_annual"]),
  purchaseToken: z.string().min(1),
});

export function createSubscriptionRouter(useCases: SubscriptionUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/profile", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const profile = await useCases.getProfile(userId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/profile", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateProfileDto.parse(req.body);
      const profile = await useCases.updateProfile(userId, data);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });

  router.get("/limits", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const limits = await useCases.getLimits(userId);
      res.json(limits);
    } catch (err) {
      next(err);
    }
  });

  router.post("/sync-plan", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const purchase = AndroidPurchaseDto.parse(req.body);
      const profile = await useCases.syncPremiumFromProvider(userId, purchase);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
