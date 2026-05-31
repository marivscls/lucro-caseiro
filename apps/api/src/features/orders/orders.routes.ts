import {
  CreateOrderDto,
  DeliverOrderDto,
  OrderStatus,
  UpdateOrderDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { OrdersUseCases } from "./orders.usecases";

export function createOrdersRouter(useCases: OrdersUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const statusRaw = req.query.status as string | undefined;
      const status = statusRaw ? OrderStatus.parse(statusRaw) : undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const items = await useCases.list(userId, { status, from, to });
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateOrderDto.parse(req.body);
      const order = await useCases.create(userId, data);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const statusRaw = req.query.status as string | undefined;
      const status = statusRaw ? OrderStatus.parse(statusRaw) : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const summary = await useCases.getSummary(userId, { status, startDate, endDate });
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const order = await useCases.getById(userId, req.params.id);
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateOrderDto.parse(req.body);
      const order = await useCases.update(userId, req.params.id, data);
      res.json(order);
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/deliver", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = DeliverOrderDto.parse(req.body ?? {});
      const order = await useCases.deliver(userId, req.params.id, data);
      res.json(order);
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
