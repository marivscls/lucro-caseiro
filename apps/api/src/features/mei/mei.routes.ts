import { UpdateMeiSettingsDto } from "@lucro-caseiro/contracts";
import { Router } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { MeiUseCases } from "./mei.usecases";

const SummaryQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export function createMeiRouter(useCases: MeiUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/summary", async (req, res, next) => {
    try {
      const { year, month } = SummaryQuery.parse(req.query);
      res.json(await useCases.getSummary(getUserId(req), year, month));
    } catch (err) {
      next(err);
    }
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const { activity } = UpdateMeiSettingsDto.parse(req.body);
      res.json(await useCases.updateActivity(getUserId(req), activity));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
