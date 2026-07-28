import { CreateProductionRunDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { ProductionUseCases } from "./production.usecases";

export function createProductionRouter(useCases: ProductionUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 30)));
      res.json({ items: await useCases.list(getUserId(req), limit) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/close", async (req, res, next) => {
    try {
      const result = await useCases.close(
        getUserId(req),
        CreateProductionRunDto.parse(req.body),
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
