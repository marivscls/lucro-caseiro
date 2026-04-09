import {
  CreateProductDto,
  PaginationDto,
  UpdateProductDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import type { AuthenticatedRequest } from "../../shared/middleware/auth";
import { authMiddleware } from "../../shared/middleware/auth";
import type { ProductsUseCases } from "./products.usecases";

export function createProductsRouter(useCases: ProductsUseCases) {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = CreateProductDto.parse(req.body);
      const product = await useCases.create(userId, data);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const { page, limit } = PaginationDto.parse(req.query);
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await useCases.list(userId, {
        page,
        limit,
        category,
        search,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const product = await useCases.getById(userId, req.params.id);
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = UpdateProductDto.parse(req.body);
      const product = await useCases.update(userId, req.params.id, data);
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await useCases.remove(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
