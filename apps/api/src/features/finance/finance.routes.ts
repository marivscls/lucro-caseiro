import {
  CreateFinanceEntryDto,
  PaginationDto,
  UpdateFinanceEntryDto,
} from "@lucro-caseiro/contracts";
import { Router } from "express";

import type { AuthenticatedRequest } from "../../shared/middleware/auth";
import { authMiddleware } from "../../shared/middleware/auth";
import { generateFinanceExcel, generateFinancePdf } from "./finance.export";
import type { FinanceUseCases } from "./finance.usecases";

export function createFinanceRouter(useCases: FinanceUseCases) {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = CreateFinanceEntryDto.parse(req.body);
      const entry = await useCases.create(userId, data);
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const { page, limit } = PaginationDto.parse(req.query);
      const type = req.query.type as "income" | "expense" | undefined;
      const category = req.query.category as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await useCases.list(userId, {
        page,
        limit,
        type,
        category,
        startDate,
        endDate,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get("/summary", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const now = new Date();
      const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
      const year = req.query.year ? Number(req.query.year) : now.getFullYear();

      const summary = await useCases.getMonthlySummary(userId, month, year);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/export/pdf", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const monthParam = req.query.month as string | undefined;

      const now = new Date();
      let year: number;
      let month: number;

      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        year = y!;
        month = m!;
      } else {
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { items: entries } = await useCases.list(userId, {
        page: 1,
        limit: 10000,
        startDate,
        endDate,
      });

      const summary = await useCases.getMonthlySummary(userId, month, year);
      const period = `${String(month).padStart(2, "0")}/${year}`;
      const businessName = "Lucro Caseiro";

      const pdfBuffer = await generateFinancePdf(entries, summary, businessName, period);

      const filename = `relatorio-financeiro-${year}-${String(month).padStart(2, "0")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  });

  router.get("/export/xlsx", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const monthParam = req.query.month as string | undefined;

      const now = new Date();
      let year: number;
      let month: number;

      if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split("-").map(Number);
        year = y!;
        month = m!;
      } else {
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }

      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const { items: entries } = await useCases.list(userId, {
        page: 1,
        limit: 10000,
        startDate,
        endDate,
      });

      const summary = await useCases.getMonthlySummary(userId, month, year);
      const period = `${String(month).padStart(2, "0")}/${year}`;

      const xlsxBuffer = await generateFinanceExcel(entries, summary, period);

      const filename = `relatorio-financeiro-${year}-${String(month).padStart(2, "0")}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(xlsxBuffer);
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const entry = await useCases.getById(userId, req.params.id);
      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const data = UpdateFinanceEntryDto.parse(req.body);
      const entry = await useCases.update(userId, req.params.id, data);
      res.json(entry);
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
