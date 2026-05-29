import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { InsightsUseCases } from "./insights.usecases";

export function createInsightsRouter(useCases: InsightsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const monthsParam = req.query.months as string | undefined;
      const months = monthsParam ? Number(monthsParam) : undefined;
      const insights = await useCases.getInsights(userId, months);
      res.json(insights);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
