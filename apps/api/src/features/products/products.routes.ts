import {
  CreateProductDto,
  PaginationDto,
  UpdateProductDto,
} from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { ProductsUseCases } from "./products.usecases";

export function createProductsRouter(
  useCases: ProductsUseCases,
  createGuard?: RequestHandler,
  photoGuard?: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware);

  const passthrough: RequestHandler = (_req, _res, next) => next();
  const guards = [createGuard, photoGuard].filter(Boolean) as RequestHandler[];

  router.post("/", ...guards, async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateProductDto.parse(req.body);
      const product = await useCases.create(userId, data);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
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

  router.get("/low-stock", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const result = await useCases.list(userId, {
        page: 1,
        limit: 100,
        activeOnly: true,
      });
      const lowStock = result.items.filter(
        (p) =>
          p.stockQuantity !== null &&
          p.stockAlertThreshold !== null &&
          p.stockQuantity <= p.stockAlertThreshold,
      );
      lowStock.sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0));
      res.json(lowStock);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const product = await useCases.getById(userId, req.params.id);
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", photoGuard ?? passthrough, async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateProductDto.parse(req.body);
      // Rota `/:id`: o param é sempre string; o guard antes do handler alarga o
      // tipo de req.params (quirk do Express), então afirmamos string aqui.
      const product = await useCases.update(userId, req.params.id as string, data);
      res.json(product);
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
