import {
  CreateSaleDto,
  PaginationDto,
  UpdateSaleDto,
  UpdateSaleStatusDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import type { AuthenticatedRequest } from "../../shared/middleware/auth";
import { authMiddleware } from "../../shared/middleware/auth";
import type { SalesUseCases } from "./sales.usecases";

export function createSalesRouter(useCases: SalesUseCases) {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = CreateSaleDto.parse(req.body);
      const sale = await useCases.createSale(userId, data);
      res.status(201).json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
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
      const { userId } = req as AuthenticatedRequest;
      const today = new Date().toISOString().split("T")[0]!;
      const summary = await useCases.getDaySummary(userId, today);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const sale = await useCases.getById(userId, req.params.id);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = UpdateSaleDto.parse(req.body);
      const sale = await useCases.updateSale(userId, req.params.id, data);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id/status", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const { status } = UpdateSaleStatusDto.parse(req.body);
      const sale = await useCases.updateStatus(userId, req.params.id, status);
      res.json(sale);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
