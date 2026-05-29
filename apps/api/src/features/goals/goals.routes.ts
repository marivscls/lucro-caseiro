import { UpsertProlaboreGoalDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { GoalsUseCases } from "./goals.usecases";

export function createGoalsRouter(useCases: GoalsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/prolabore", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const status = await useCases.getProlaboreStatus(userId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  router.put("/prolabore", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpsertProlaboreGoalDto.parse(req.body);
      const goal = await useCases.upsert(userId, data);
      res.json(goal);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/prolabore", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.remove(userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
