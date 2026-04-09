import {
  CreateIngredientDto,
  PaginationDto,
  UpdateIngredientDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import type { AuthenticatedRequest } from "../../shared/middleware/auth";
import { authMiddleware } from "../../shared/middleware/auth";
import type { IngredientsUseCases } from "./ingredients.usecases";

export function createIngredientsRouter(useCases: IngredientsUseCases) {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = CreateIngredientDto.parse(req.body);
      const ingredient = await useCases.create(userId, data);
      res.status(201).json(ingredient);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
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
      const { userId } = req as AuthenticatedRequest;
      const ingredient = await useCases.getById(userId, req.params.id);
      res.json(ingredient);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = UpdateIngredientDto.parse(req.body);
      const ingredient = await useCases.update(userId, req.params.id, data);
      res.json(ingredient);
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
