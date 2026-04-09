import {
  CreatePackagingDto,
  PaginationDto,
  UpdatePackagingDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { PackagingUseCases } from "./packaging.usecases";

export function createPackagingRouter(useCases: PackagingUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreatePackagingDto.parse(req.body);
      const item = await useCases.create(userId, data);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const search = req.query.search as string | undefined;

      const result = await useCases.list(userId, { page, limit, search });
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

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdatePackagingDto.parse(req.body);
      const item = await useCases.update(userId, req.params.id, data);
      res.json(item);
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

  router.post("/:id/products/:productId", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.linkToProduct(userId, req.params.id, req.params.productId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id/products/:productId", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.unlinkFromProduct(userId, req.params.id, req.params.productId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
