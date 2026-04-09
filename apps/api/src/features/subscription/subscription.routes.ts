import { UpdateProfileDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { SubscriptionUseCases } from "./subscription.usecases";

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

  return router;
}
