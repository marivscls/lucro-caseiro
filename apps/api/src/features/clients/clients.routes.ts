import {
  CreateClientDto,
  PaginationDto,
  UpdateClientDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import type { AuthenticatedRequest } from "../../shared/middleware/auth";
import { authMiddleware } from "../../shared/middleware/auth";
import type { ClientsUseCases } from "./clients.usecases";

export function createClientsRouter(useCases: ClientsUseCases) {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = CreateClientDto.parse(req.body);
      const client = await useCases.create(userId, data);
      res.status(201).json(client);
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

  router.get("/birthdays", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const clients = await useCases.getBirthdaysThisMonth(userId);
      res.json(clients);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const client = await useCases.getById(userId, req.params.id);
      res.json(client);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = UpdateClientDto.parse(req.body);
      const client = await useCases.update(userId, req.params.id, data);
      res.json(client);
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
