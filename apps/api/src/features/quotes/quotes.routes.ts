import {
  ConvertQuoteDto,
  CreateQuoteDto,
  QuoteStatus,
  UpdateQuoteDto,
  UpdateQuoteStatusDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { QuotesUseCases } from "./quotes.usecases";

export function createQuotesRouter(useCases: QuotesUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const statusParsed = QuoteStatus.safeParse(req.query.status);
      const result = await useCases.list(getUserId(req), {
        page,
        limit,
        status: statusParsed.success ? statusParsed.data : undefined,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const data = CreateQuoteDto.parse(req.body);
      const quote = await useCases.create(getUserId(req), data);
      res.status(201).json(quote);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getById(getUserId(req), req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const data = UpdateQuoteDto.parse(req.body);
      res.json(await useCases.update(getUserId(req), req.params.id, data));
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id/status", async (req, res, next) => {
    try {
      const data = UpdateQuoteStatusDto.parse(req.body);
      res.json(await useCases.setStatus(getUserId(req), req.params.id, data));
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/convert", async (req, res, next) => {
    try {
      const data = ConvertQuoteDto.parse(req.body);
      res.json(await useCases.convertToOrder(getUserId(req), req.params.id, data));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      await useCases.remove(getUserId(req), req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
