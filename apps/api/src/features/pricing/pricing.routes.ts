import { CreatePricingDto, PaginationDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { PricingUseCases } from "./pricing.usecases";

export function createPricingRouter(useCases: PricingUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/calculate", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreatePricingDto.parse(req.body);
      const result = await useCases.calculate(userId, data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const productId = req.query.productId as string | undefined;

      const result = await useCases.list(userId, { page, limit, productId });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const item = await useCases.getById(userId, req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.get("/product/:productId/history", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const items = await useCases.getHistory(userId, req.params.productId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
