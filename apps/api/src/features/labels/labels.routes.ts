import { CreateLabelDto, PaginationDto, UpdateLabelDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { LabelsUseCases } from "./labels.usecases";

export function createLabelsRouter(useCases: LabelsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateLabelDto.parse(req.body);
      const label = await useCases.create(userId, data);
      res.status(201).json(label);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const productId = req.query.productId as string | undefined;

      const result = await useCases.list(userId, {
        page,
        limit,
        productId,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/templates", (_req, res, next) => {
    try {
      const templates = useCases.getTemplates();
      res.json(templates);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const label = await useCases.getById(userId, req.params.id);
      res.json(label);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateLabelDto.parse(req.body);
      const label = await useCases.update(userId, req.params.id, data);
      res.json(label);
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
