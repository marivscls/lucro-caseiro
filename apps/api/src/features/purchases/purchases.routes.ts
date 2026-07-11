import { CreatePurchaseDto, PaginationDto } from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { PurchasesUseCases } from "./purchases.usecases";

export function createPurchasesRouter(
  useCases: PurchasesUseCases,
  createGuard?: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", ...(createGuard ? [createGuard] : []), async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreatePurchaseDto.parse(req.body);
      const purchase = await useCases.create(userId, data);
      res.status(201).json(purchase);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const status = req.query.status as "pending" | "paid" | undefined;

      const result = await useCases.list(userId, { page, limit, status });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const purchase = await useCases.getById(userId, req.params.id);
      res.json(purchase);
    } catch (err) {
      next(err);
    }
  });

  // Marca a compra como paga (gera a saída no caixa).
  router.post("/:id/pay", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const purchase = await useCases.pay(userId, req.params.id);
      res.json(purchase);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.remove(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
