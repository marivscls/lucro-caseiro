import {
  AdjustMaterialDto,
  CreateMaterialDto,
  PaginationDto,
  UpdateMaterialDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { requireBrandFeature } from "../../shared/middleware/brand-feature";
import type { MaterialsUseCases } from "./materials.usecases";

export function createMaterialsRouter(useCases: MaterialsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);
  router.use(requireBrandFeature("materiais"));

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

  router.get("/low-stock", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      res.json(await useCases.lowStock(userId));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateMaterialDto.parse(req.body);
      const material = await useCases.create(userId, data);
      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      res.json(await useCases.getById(userId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateMaterialDto.parse(req.body);
      res.json(await useCases.update(userId, req.params.id, data));
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/adjust", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { delta } = AdjustMaterialDto.parse(req.body);
      res.json(await useCases.adjust(userId, req.params.id, delta));
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
