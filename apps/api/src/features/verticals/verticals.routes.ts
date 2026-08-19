import {
  CreateResaleSerialDto,
  CreateVerticalAssetDto,
  CreateVerticalDocumentDto,
  TransitionVerticalDocumentDto,
  UpdateResaleSerialStatusDto,
  UpdateVerticalDocumentDto,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";
import { resolveBrand } from "@lucro-caseiro/brands";
import { Router, type Request } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { requireBrandFeature } from "../../shared/middleware/brand-feature";
import { ValidationError } from "../../shared/errors";
import type { VerticalsUseCases } from "./verticals.usecases";

function requestContext(req: Request) {
  const brandId = req.header("x-brand")?.trim();
  if (!brandId) throw new ValidationError(["Marca não informada"]);
  const brand = resolveBrand(brandId);
  const domain = brand.vertical.domain;
  if (domain !== "revenda" && domain !== "oficina" && domain !== "obra") {
    throw new ValidationError(["Marca sem domínio operacional publicado"]);
  }
  return { brandId, domain } as const;
}

export function createVerticalsRouter(useCases: VerticalsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  // A Conta Lucro enxerga as extensões já ativadas mesmo dentro do app-base.
  router.get("/memberships", async (req, res, next) => {
    try {
      res.json(await useCases.listMemberships(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.use(requireBrandFeature("operacaoVertical"));

  router.post("/membership", async (req, res, next) => {
    try {
      const { brandId, domain } = requestContext(req);
      res
        .status(201)
        .json(await useCases.touchMembership(getUserId(req), brandId, domain));
    } catch (error) {
      next(error);
    }
  });

  router.get("/dashboard", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      res.json(await useCases.dashboard(getUserId(req), domain));
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const kind = req.query.kind
        ? VerticalDocumentKind.parse(req.query.kind)
        : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      res.json(await useCases.listDocuments(getUserId(req), domain, kind, status));
    } catch (error) {
      next(error);
    }
  });

  router.post("/documents", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const data = CreateVerticalDocumentDto.parse({ ...req.body, domain });
      res.status(201).json(await useCases.createDocument(getUserId(req), data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents/:id", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      res.json(await useCases.getDocument(getUserId(req), domain, req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/documents/:id", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      res.json(
        await useCases.updateDocument(
          getUserId(req),
          domain,
          req.params.id,
          UpdateVerticalDocumentDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/documents/:id/transition", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const data = TransitionVerticalDocumentDto.parse(req.body);
      res.json(
        await useCases.transitionDocument(
          getUserId(req),
          domain,
          req.params.id,
          data.status,
          data.idempotencyKey,
          data.payload,
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/assets", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      res.json(await useCases.listAssets(getUserId(req), domain));
    } catch (error) {
      next(error);
    }
  });

  router.post("/assets", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const data = CreateVerticalAssetDto.parse({ ...req.body, domain });
      res.status(201).json(await useCases.createAsset(getUserId(req), domain, data));
    } catch (error) {
      next(error);
    }
  });

  router.get("/serials", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      res.json(await useCases.listSerials(getUserId(req), domain, status));
    } catch (error) {
      next(error);
    }
  });

  router.post("/serials", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      res
        .status(201)
        .json(
          await useCases.createSerial(
            getUserId(req),
            domain,
            CreateResaleSerialDto.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.patch("/serials/:id/status", async (req, res, next) => {
    try {
      const { domain } = requestContext(req);
      const data = UpdateResaleSerialStatusDto.parse(req.body);
      res.json(
        await useCases.updateSerialStatus(
          getUserId(req),
          domain,
          req.params.id,
          data.expectedStatus,
          data.status,
          data.saleId,
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}
