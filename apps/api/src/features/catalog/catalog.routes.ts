import {
  PublicServiceBookingRequestInputDto,
  UpdateCatalogSettingsDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { NotFoundError } from "../../shared/errors";
import { renderCatalogErrorHtml, renderCatalogHtml } from "./catalog.domain";
import type { CatalogUseCases } from "./catalog.usecases";
import { DEFAULT_BRAND_ID } from "@lucro-caseiro/brands";

function publicCatalogSection(value: unknown): "products" | "services" | "all" {
  if (value === "produtos") return "products";
  if (value === "servicos") return "services";
  return "all";
}

/** Rotas autenticadas: configuracoes do catalogo do usuario. */
export function createCatalogRouter(useCases: CatalogUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/settings", async (req, res, next) => {
    try {
      const settings = await useCases.getSettings(
        getUserId(req),
        req.header("x-brand")?.trim() || DEFAULT_BRAND_ID,
      );
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const data = UpdateCatalogSettingsDto.parse(req.body);
      const settings = await useCases.updateSettings(
        getUserId(req),
        data,
        req.header("x-brand")?.trim() || DEFAULT_BRAND_ID,
      );
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

  router.post("/:slug/service-bookings", async (req, res, next) => {
    try {
      const booking = await useCases.createPublicServiceBooking(
        req.params.slug,
        PublicServiceBookingRequestInputDto.parse(req.body),
      );
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:slug", async (req, res) => {
    try {
      const focusedProductId =
        typeof req.query.produto === "string" ? req.query.produto : undefined;
      const catalog = await useCases.getPublicCatalog(req.params.slug, focusedProductId);
      const section = focusedProductId
        ? "products"
        : publicCatalogSection(req.query.tipo);
      res.type("html").send(renderCatalogHtml(catalog, section));
    } catch (error) {
      const status = error instanceof NotFoundError ? 404 : 500;
      res.status(status).type("html").send(renderCatalogErrorHtml());
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
