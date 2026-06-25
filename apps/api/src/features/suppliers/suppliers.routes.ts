import {
  CreateSupplierDto,
  PaginationDto,
  UpdateSupplierDto,
} from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { SuppliersUseCases } from "./suppliers.usecases";

export function createSuppliersRouter(
  useCases: SuppliersUseCases,
  createGuard?: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", ...(createGuard ? [createGuard] : []), async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateSupplierDto.parse(req.body);
      const supplier = await useCases.create(userId, data);
      res.status(201).json(supplier);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const search = req.query.search as string | undefined;

      const result = await useCases.list(userId, {
        page,
        limit,
        search,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const supplier = await useCases.getById(userId, req.params.id);
      res.json(supplier);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateSupplierDto.parse(req.body);
      const supplier = await useCases.update(userId, req.params.id, data);
      res.json(supplier);
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
