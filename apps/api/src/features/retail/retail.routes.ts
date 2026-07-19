import {
  BatchLabelsDto,
  BulkPriceUpdateDto,
  CloseCashSessionDto,
  CreateBusinessAccountDto,
  CreateCashMovementDto,
  CreateFiscalDocumentDto,
  CreateRetailDocumentDto,
  CreateRetailPromotionDto,
  OpenCashSessionDto,
  PublicCatalogOrderDto,
  RetailCheckoutDto,
  RetailCheckoutQuoteDto,
  RetailDocumentKind,
  UpdateBusinessAccountDto,
  UpdateRetailDocumentDto,
  UpdateRetailPromotionDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { requireBrandFeature } from "../../shared/middleware/brand-feature";
import type { CatalogUseCases } from "../catalog/catalog.usecases";
import type { RetailUseCases } from "./retail.usecases";

export function createRetailRouter(useCases: RetailUseCases): Router {
  const router = Router();
  router.use(authMiddleware, requireBrandFeature("varejoPapelaria"));

  router.get("/documents", async (req, res, next) => {
    try {
      const kind = RetailDocumentKind.parse(req.query.kind);
      res.json(await useCases.listDocuments(getUserId(req), kind));
    } catch (error) {
      next(error);
    }
  });

  router.post("/documents", async (req, res, next) => {
    try {
      const document = await useCases.createDocument(
        getUserId(req),
        CreateRetailDocumentDto.parse(req.body),
      );
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getDocument(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/documents/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateDocument(
          getUserId(req),
          req.params.id,
          UpdateRetailDocumentDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete("/documents/:id", async (req, res, next) => {
    try {
      await useCases.removeDocument(getUserId(req), req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post("/cash/open", async (req, res, next) => {
    try {
      const data = OpenCashSessionDto.parse(req.body);
      res
        .status(201)
        .json(
          await useCases.openCashSession(getUserId(req), data.openingFloat, data.note),
        );
    } catch (error) {
      next(error);
    }
  });

  router.get("/cash/current", async (req, res, next) => {
    try {
      res.json(await useCases.currentCashSession(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/cash/movements", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addCashMovement(
            getUserId(req),
            CreateCashMovementDto.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.post("/cash/close", async (req, res, next) => {
    try {
      const data = CloseCashSessionDto.parse(req.body);
      res.json(
        await useCases.closeCashSession(getUserId(req), data.countedCash, data.note),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/checkout", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await useCases.checkout(getUserId(req), RetailCheckoutDto.parse(req.body)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/checkout/quote", async (req, res, next) => {
    try {
      res.json(
        await useCases.quoteCheckout(
          getUserId(req),
          RetailCheckoutQuoteDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/replenishment", async (req, res, next) => {
    try {
      res.json(await useCases.replenishment(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/purchase-orders/from-replenishment", async (req, res, next) => {
    try {
      const supplierId = (req.body as { supplierId?: string }).supplierId;
      res
        .status(201)
        .json(
          await useCases.createPurchaseOrderFromSuggestions(getUserId(req), supplierId),
        );
    } catch (error) {
      next(error);
    }
  });

  router.post("/inventory/:id/finalize", async (req, res, next) => {
    try {
      res.json(await useCases.finalizeInventory(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.get("/promotions", async (req, res, next) => {
    try {
      res.json(await useCases.listPromotions(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/promotions", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createPromotion(
            getUserId(req),
            CreateRetailPromotionDto.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.patch("/promotions/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updatePromotion(
          getUserId(req),
          req.params.id,
          UpdateRetailPromotionDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete("/promotions/:id", async (req, res, next) => {
    try {
      await useCases.removePromotion(getUserId(req), req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post("/prices/bulk", async (req, res, next) => {
    try {
      res.json(
        await useCases.bulkUpdatePrices(
          getUserId(req),
          BulkPriceUpdateDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/labels/batch", async (req, res, next) => {
    try {
      const data = BatchLabelsDto.parse(req.body);
      res.json({
        html: await useCases.batchLabels(getUserId(req), data.productIds, data.template),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/business-accounts", async (req, res, next) => {
    try {
      res.json(await useCases.listBusinessAccounts(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/business-accounts", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createBusinessAccount(
            getUserId(req),
            CreateBusinessAccountDto.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.patch("/business-accounts/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateBusinessAccount(
          getUserId(req),
          req.params.id,
          UpdateBusinessAccountDto.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/fiscal-documents", async (req, res, next) => {
    try {
      const data = CreateFiscalDocumentDto.parse(req.body);
      res
        .status(201)
        .json(
          await useCases.createFiscalDocument(
            getUserId(req),
            data.saleId,
            data.type,
            data.provider,
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createPublicRetailRouter(
  useCases: RetailUseCases,
  catalogUseCases: CatalogUseCases,
): Router {
  const router = Router();
  router.post("/catalog-orders", async (req, res, next) => {
    try {
      const data = PublicCatalogOrderDto.parse(req.body);
      const owner = await catalogUseCases.resolvePublicRetailOwner(data.slug);
      const order = await useCases.createCatalogOrder(owner.userId, data);
      res
        .status(201)
        .json({ id: order.id, status: order.status, reservedUntil: order.reservedUntil });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
