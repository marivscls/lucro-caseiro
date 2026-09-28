import {
  AssistantNotebookRequestDto,
  AssistantSaleRequestDto,
  ImportNotebookDto,
} from "@lucro-caseiro/contracts";
import express, { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { AssistantUseCases } from "./assistant.usecases";

export function createAssistantRouter(useCases: AssistantUseCases): Router {
  const router = Router();
  // Áudio e foto chegam em base64: limite maior só aqui (o resto da API fica em 256 KB).
  router.use(express.json({ limit: "9mb" }));
  router.use(authMiddleware);

  router.get("/usage", async (req, res, next) => {
    try {
      res.json(await useCases.getUsage(getUserId(req)));
    } catch (err) {
      next(err);
    }
  });

  router.post("/sale-draft", async (req, res, next) => {
    try {
      const data = AssistantSaleRequestDto.parse(req.body);
      res.json(await useCases.draftSale(getUserId(req), data));
    } catch (err) {
      next(err);
    }
  });

  router.post("/notebook", async (req, res, next) => {
    try {
      const { image } = AssistantNotebookRequestDto.parse(req.body);
      res.json(await useCases.readNotebook(getUserId(req), image));
    } catch (err) {
      next(err);
    }
  });

  router.post("/notebook/import", async (req, res, next) => {
    try {
      const data = ImportNotebookDto.parse(req.body);
      res.json(await useCases.importNotebook(getUserId(req), data));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
