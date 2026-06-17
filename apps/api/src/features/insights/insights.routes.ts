import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { InsightsUseCases } from "./insights.usecases";

export function createInsightsRouter(
  useCases: InsightsUseCases,
  isPremium?: (userId: string) => Promise<boolean>,
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const monthsParam = req.query.months as string | undefined;
      const months = monthsParam ? Number(monthsParam) : undefined;
      // Free vê só o mês atual ("básico mensal"); só Premium escolhe a janela.
      const premium = isPremium ? await isPremium(userId) : true;
      const insights = await useCases.getInsights(userId, premium ? months : 1);
      res.json(insights);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
