import {
  CreateRecipeDto,
  PaginationDto,
  UpdateRecipeDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";
import { z } from "zod";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { RecipesUseCases } from "./recipes.usecases";

export function createRecipesRouter(useCases: RecipesUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateRecipeDto.parse(req.body);
      const recipe = await useCases.create(userId, data);
      res.status(201).json(recipe);
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

  router.get("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const recipe = await useCases.getById(userId, req.params.id);
      res.json(recipe);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id/scale", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { multiplier } = z
        .object({ multiplier: z.coerce.number().positive() })
        .parse(req.query);

      const result = await useCases.scale(userId, req.params.id, multiplier);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateRecipeDto.parse(req.body);
      const recipe = await useCases.update(userId, req.params.id, data);
      res.json(recipe);
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
