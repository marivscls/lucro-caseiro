import { Router } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { AnalyticsUseCases } from "./analytics.usecases";

const RecordOpenDto = z
  .object({
    installationId: z.string().uuid(),
    platform: z.enum(["android", "ios", "web"]),
    appVersion: z.string().trim().min(1).max(32),
    appBuild: z.string().trim().min(1).max(32).optional(),
  })
  .strict();

export function createAnalyticsRouter(useCases: AnalyticsUseCases): Router {
  const router = Router();

  router.post("/open", async (req, res, next) => {
    try {
      await useCases.recordOpen(null, RecordOpenDto.parse(req.body));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.post("/identify", authMiddleware, async (req, res, next) => {
    try {
      await useCases.recordOpen(getUserId(req), RecordOpenDto.parse(req.body));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
