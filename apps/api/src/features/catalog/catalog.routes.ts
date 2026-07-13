import { UpdateCatalogSettingsDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { renderCatalogHtml } from "./catalog.domain";
import type { CatalogUseCases } from "./catalog.usecases";

/** Rotas autenticadas: configuracoes do catalogo do usuario. */
export function createCatalogRouter(useCases: CatalogUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/settings", async (req, res, next) => {
    try {
      const settings = await useCases.getSettings(getUserId(req));
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const data = UpdateCatalogSettingsDto.parse(req.body);
      const settings = await useCases.updateSettings(getUserId(req), data);
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/** Rotas publicas (sem auth): pagina HTML e JSON do catalogo. */
export function createPublicCatalogRouter(useCases: CatalogUseCases): Router {
  const router = Router();

  router.get("/:slug", async (req, res, next) => {
    try {
      const focusedProductId =
        typeof req.query.produto === "string" ? req.query.produto : undefined;
      const catalog = await useCases.getPublicCatalog(req.params.slug, focusedProductId);
      res.type("html").send(renderCatalogHtml(catalog));
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug/json", async (req, res, next) => {
    try {
      const focusedProductId =
        typeof req.query.produto === "string" ? req.query.produto : undefined;
      const catalog = await useCases.getPublicCatalog(req.params.slug, focusedProductId);
      res.json(catalog);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
