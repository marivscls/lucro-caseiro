import { randomBytes } from "node:crypto";

import { DEFAULT_BRAND_ID } from "@lucro-caseiro/brands";
import { CreateFiadoLinkDto, UpdatePixSettingsDto } from "@lucro-caseiro/contracts";
import { Router, type Response } from "express";

import { NotFoundError } from "../../shared/errors";
import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import {
  renderFiadoNotFoundHtml,
  renderFiadoStatementHtml,
} from "./fiado-statement.renderer";
import type { FiadoUseCases } from "./fiado.usecases";

export function createFiadoRouter(useCases: FiadoUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/pix", async (req, res, next) => {
    try {
      res.json(await useCases.getPixSettings(getUserId(req)));
    } catch (err) {
      next(err);
    }
  });

  router.put("/pix", async (req, res, next) => {
    try {
      const data = UpdatePixSettingsDto.parse(req.body);
      res.json(await useCases.updatePixSettings(getUserId(req), data));
    } catch (err) {
      next(err);
    }
  });

  router.post("/links", async (req, res, next) => {
    try {
      const { clientId } = CreateFiadoLinkDto.parse(req.body);
      const link = await useCases.getOrCreateLink(
        getUserId(req),
        clientId,
        req.header("x-brand")?.trim() || DEFAULT_BRAND_ID,
      );
      res.json(link);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

function statementHeaders(res: Response, nonce?: string): void {
  res.set({
    "Content-Security-Policy": [
      "default-src 'none'",
      nonce ? `script-src 'nonce-${nonce}'` : "script-src 'none'",
      "style-src 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "img-src data:",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
    "Cache-Control": "no-store, max-age=0",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
}

/** Extrato público do fiado (sem login): /f/:token. */
export function createPublicFiadoRouter(useCases: FiadoUseCases): Router {
  const router = Router();

  router.get("/:token", async (req, res) => {
    try {
      const statement = await useCases.getPublicStatement(req.params.token);
      const nonce = randomBytes(18).toString("base64");
      statementHeaders(res, nonce);
      res.type("html").send(renderFiadoStatementHtml(statement, nonce));
    } catch (error) {
      statementHeaders(res);
      res
        .status(error instanceof NotFoundError ? 404 : 500)
        .type("html")
        .send(renderFiadoNotFoundHtml());
    }
  });

  return router;
}
