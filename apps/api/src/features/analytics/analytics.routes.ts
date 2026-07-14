import { Router, type RequestHandler } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { ForbiddenError } from "../../shared/errors";
import { isAdminUser } from "./analytics.admin";
import type { AnalyticsUseCases } from "./analytics.usecases";

const RecordOpenDto = z
  .object({
    installationId: z.string().uuid(),
    platform: z.enum(["android", "ios", "web"]),
    appVersion: z.string().trim().min(1).max(32),
    appBuild: z.string().trim().min(1).max(32).optional(),
  })
  .strict();

function requireAdmin(adminUserIds: ReadonlySet<string>): RequestHandler {
  return (req, _res, next) => {
    if (!isAdminUser(getUserId(req), adminUserIds)) {
      next(new ForbiddenError("Acesso restrito à administração"));
      return;
    }
    next();
  };
}

export function createAnalyticsRouter(
  useCases: AnalyticsUseCases,
  configuredAdminUserIds: readonly string[] = [],
): Router {
  const router = Router();
  const adminUserIds = new Set(configuredAdminUserIds);

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

  router.get("/admin/access", authMiddleware, (req, res) => {
    res.json({ allowed: isAdminUser(getUserId(req), adminUserIds) });
  });

  router.get(
    "/admin/dashboard",
    authMiddleware,
    requireAdmin(adminUserIds),
    async (_req, res, next) => {
      try {
        res.json(await useCases.getDashboard());
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
