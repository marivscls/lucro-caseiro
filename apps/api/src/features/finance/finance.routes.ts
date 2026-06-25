import {
  CreateFinanceEntryDto,
  CreateRecurringExpenseDto,
  PaginationDto,
  UpdateFinanceEntryDto,
  UpdateRecurringExpenseDto,
} from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import { generateFinanceExcel, generateFinancePdf } from "./finance.export";
import type { FinanceUseCases } from "./finance.usecases";

export function createFinanceRouter(
  useCases: FinanceUseCases,
  exportGuard?: RequestHandler,
  recurringGuard?: RequestHandler,
): Router {
  const router = Router();
  router.use(authMiddleware);
  // Exportação PDF/Excel é Premium (tabela freemium). Guard opcional (testes sem ele).
  const guards = exportGuard ? [exportGuard] : [];

  // --- Gastos recorrentes (criar é Premium) ---
  router.post(
    "/recurring",
    ...(recurringGuard ? [recurringGuard] : []),
    async (req, res, next) => {
      try {
        const userId = getUserId(req);
        const data = CreateRecurringExpenseDto.parse(req.body);
        const created = await useCases.createRecurring(userId, data);
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get("/recurring", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      res.json(await useCases.listRecurring(userId));
    } catch (err) {
      next(err);
    }
  });

  router.patch("/recurring/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateRecurringExpenseDto.parse(req.body);
      res.json(await useCases.updateRecurring(userId, req.params.id, data));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/recurring/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.removeRecurring(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = CreateFinanceEntryDto.parse(req.body);
      const entry = await useCases.create(userId, data);
      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const { page, limit } = PaginationDto.parse(req.query);
      const type = req.query.type as "income" | "expense" | undefined;
      const category = req.query.category as
        | "sale"
        | "material"
        | "packaging"
        | "transport"
        | "fee"
        | "utility"
        | "other"
        | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const fixedParam = req.query.fixed as string | undefined;
      const isFixed = fixedParam === undefined ? undefined : fixedParam === "true";

      const result = await useCases.list(userId, {
        page,
        limit,
        type,
        category,
        isFixed,
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
      const userId = getUserId(req);
      const now = new Date();
      const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
      const year = req.query.year ? Number(req.query.year) : now.getFullYear();

      const summary = await useCases.getMonthlySummary(userId, month, year);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.get("/export/pdf", ...guards, async (req, res, next) => {
    try {
      const userId = getUserId(req);
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

      const filename = `relatório-financeiro-${year}-${String(month).padStart(2, "0")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  });

  router.get("/export/xlsx", ...guards, async (req, res, next) => {
    try {
      const userId = getUserId(req);
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

      const filename = `relatório-financeiro-${year}-${String(month).padStart(2, "0")}.xlsx`;
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
      const userId = getUserId(req);
      const entry = await useCases.getById(userId, req.params.id);
      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const data = UpdateFinanceEntryDto.parse(req.body);
      const entry = await useCases.update(userId, req.params.id, data);
      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await useCases.remove(userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
