import {
  CreateProductDto,
  PaginationDto,
  ReplaceProductVariationsDto,
  UpdateProductDto,
} from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { requireBrandFeature } from "../../shared/middleware/brand-feature";
import type { ProductsUseCases } from "./products.usecases";

export function createProductsRouter(
  useCases: ProductsUseCases,
  createGuard?: RequestHandler,
  photoGuard?: RequestHandler,
  compositeGuard?: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware);

  const passthrough: RequestHandler = (_req, _res, next) => next();
  const variationGuard = requireBrandFeature("catalogoCores");
  const variationMutationGuard: RequestHandler = (req, res, next) => {
    if (req.body && Object.hasOwn(req.body as object, "variations")) {
      variationGuard(req, res, next);
      return;
    }
    next();
  };
  const guards = [createGuard, photoGuard, compositeGuard, variationMutationGuard].filter(
    Boolean,
  ) as RequestHandler[];

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
      const isCompositeParam = req.query.isComposite;
      let isComposite: boolean | undefined;
      if (isCompositeParam === "true") isComposite = true;
      if (isCompositeParam === "false") isComposite = false;

      const result = await useCases.list(userId, {
        page,
        limit,
        category,
        search,
        isComposite,
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

  router.get("/:id/variations", variationGuard, async (req, res, next) => {
    try {
      const variations = await useCases.getVariations(
        getUserId(req),
        req.params.id as string,
      );
      res.json(variations);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id/variations", variationGuard, async (req, res, next) => {
    try {
      const { variations } = ReplaceProductVariationsDto.parse(req.body);
      const result = await useCases.replaceVariations(
        getUserId(req),
        req.params.id as string,
        variations,
      );
      res.json(result);
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

  const patchGuards = [photoGuard, compositeGuard, variationMutationGuard].filter(
    Boolean,
  ) as RequestHandler[];

  router.patch<{ id: string }>(
    "/:id",
    ...(patchGuards.length ? patchGuards : [passthrough]),
    async (req, res, next) => {
      try {
        const userId = getUserId(req);
        const data = UpdateProductDto.parse(req.body);
        const product = await useCases.update(userId, req.params.id, data);
        res.json(product);
      } catch (err) {
        next(err);
      }
    },
  );

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
