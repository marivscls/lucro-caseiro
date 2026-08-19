import {
  PublicServiceBookingRequestInputDto,
  StorefrontCustomizationDto,
  UpdateCatalogSettingsDto,
} from "@lucro-caseiro/contracts";
import { randomBytes } from "node:crypto";
import { Router, type Response } from "express";

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

function catalogSecurityHeaders(res: Response, nonce?: string): void {
  const scriptSource = nonce ? `'nonce-${nonce}'` : "'none'";
  res.set({
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'self' ${scriptSource}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store, max-age=0",
    "Surrogate-Control": "no-store",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
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

  router.get("/slug-availability", async (req, res, next) => {
    try {
      const slug = typeof req.query.slug === "string" ? req.query.slug : "";
      res.json(await useCases.getSlugAvailability(getUserId(req), slug));
    } catch (err) {
      next(err);
    }
  });

  router.post("/preview", async (req, res, next) => {
    try {
      const nonce = randomBytes(18).toString("base64");
      const customization = StorefrontCustomizationDto.parse(req.body.customization);
      const catalog = await useCases.getStorefrontPreview(
        getUserId(req),
        customization,
        req.header("x-brand")?.trim() || DEFAULT_BRAND_ID,
      );
      catalogSecurityHeaders(res, nonce);
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.type("html").send(renderCatalogHtml(catalog, "all", nonce, { preview: true }));
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
      const nonce = randomBytes(18).toString("base64");
      const focusedProductId =
        typeof req.query.produto === "string" ? req.query.produto : undefined;
      const catalog = await useCases.getPublicCatalog(req.params.slug, focusedProductId);
      const section = focusedProductId
        ? "products"
        : publicCatalogSection(req.query.tipo);
      catalogSecurityHeaders(res, nonce);
      res.type("html").send(renderCatalogHtml(catalog, section, nonce));
    } catch (error) {
      const status = error instanceof NotFoundError ? 404 : 500;
      catalogSecurityHeaders(res);
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
