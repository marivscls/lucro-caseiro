import {
  CreateSaleDto,
  PaginationDto,
  UpdateSaleDto,
  UpdateSaleStatusDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { SalesUseCases } from "./sales.usecases";

export function createSalesRouter(useCases: SalesUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateSaleDto.parse(req.body);
      const sale = await useCases.createSale(userId, data);
      res.status(201).json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const status = req.query.status as string | undefined;
      const clientId = req.query.clientId as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;

      const result = await useCases.list(userId, {
        page,
        limit,
        status: status as "pending" | "paid" | "cancelled" | undefined,
        clientId,
        paymentMethod,
        dateFrom,
        dateTo,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary/today", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const today = new Date().toISOString().split("T")[0]!;
      const summary = await useCases.getDaySummary(userId, today);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const sale = await useCases.getById(userId, req.params.id);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateSaleDto.parse(req.body);
      const sale = await useCases.updateSale(userId, req.params.id, data);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id/status", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { status } = UpdateSaleStatusDto.parse(req.body);
      const sale = await useCases.updateStatus(userId, req.params.id, status);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
