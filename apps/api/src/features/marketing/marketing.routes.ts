import {
  MarketingAiMessageInputSchema,
  MarketingAiResourceDraftInputSchema,
  MarketingAttachmentInputSchema,
  MarketingDocumentInputSchema,
  MarketingDocumentPatchSchema,
  MarketingEvaluationInputSchema,
  MarketingFeedbackInputSchema,
  MarketingInstructionInputSchema,
  MarketingKnowledgeInputSchema,
  MarketingLearningPolicySchema,
  MarketingResourceInputSchema,
  MarketingResourcePatchSchema,
  MarketingResourceQuerySchema,
} from "@lucro-caseiro/contracts";
import { Router, type RequestHandler } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";

import { config } from "../../config";
import { ForbiddenError } from "../../shared/errors";
import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { MarketingUseCases } from "./marketing.usecases";

const ExampleInputSchema = z.object({
  input: z.string().trim().min(2),
  output: z.string().trim().min(2),
  tags: z.array(z.string()).default([]),
});

export function createMarketingRouter(useCases: MarketingUseCases): Router {
  const router = Router();
  router.use(authMiddleware, privateMarketingAccess);

  router.get("/dashboard", async (req, res, next) => {
    try {
      res.json(await useCases.dashboard(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/seed", async (req, res, next) => {
    try {
      res.json(await useCases.seed(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.get("/resources", async (req, res, next) => {
    try {
      const query = MarketingResourceQuerySchema.parse(req.query);
      res.json(
        await useCases.listResources(getUserId(req), {
          ...(query.kind ? { kind: query.kind } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.from ? { from: new Date(query.from) } : {}),
          ...(query.to ? { to: new Date(query.to) } : {}),
        }),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/resources", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createResource(
            getUserId(req),
            MarketingResourceInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.patch("/resources/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateResource(
          getUserId(req),
          req.params.id,
          MarketingResourcePatchSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete("/resources/:id", async (req, res, next) => {
    try {
      await useCases.deleteResource(getUserId(req), req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents", async (req, res, next) => {
    try {
      res.json(await useCases.listDocuments(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/documents", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createDocument(
            getUserId(req),
            MarketingDocumentInputSchema.parse(req.body),
          ),
        );
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
          MarketingDocumentPatchSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete("/documents/:id", async (req, res, next) => {
    try {
      await useCases.deleteDocument(getUserId(req), req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post("/documents/:id/attachments", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addAttachment(
            getUserId(req),
            req.params.id,
            MarketingAttachmentInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents/:id/export.md", async (req, res, next) => {
    try {
      const document = await useCases.getDocument(getUserId(req), req.params.id);
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename(document.slug)}.md"`,
      );
      res.send(`# ${document.title}\n\n${document.body}`);
    } catch (error) {
      next(error);
    }
  });

  router.get("/documents/:id/export.pdf", async (req, res, next) => {
    try {
      const document = await useCases.getDocument(getUserId(req), req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename(document.slug)}.pdf"`,
      );
      const pdf = new PDFDocument({ margin: 56, size: "A4" });
      pdf.pipe(res);
      pdf.fontSize(22).fillColor("#19382f").text(document.title);
      pdf
        .moveDown()
        .fontSize(11)
        .fillColor("#27332f")
        .text(document.body, { lineGap: 4 });
      pdf.end();
    } catch (error) {
      next(error);
    }
  });

  router.get("/ai/sessions", async (req, res, next) => {
    try {
      res.json(await useCases.listSessions(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.get("/ai/sessions/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getSession(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/chat", async (req, res, next) => {
    try {
      res.json(
        await useCases.chat(
          getUserId(req),
          MarketingAiMessageInputSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/resources/draft", async (req, res, next) => {
    try {
      res.json(
        await useCases.draftResource(
          getUserId(req),
          MarketingAiResourceDraftInputSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/feedback", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addFeedback(
            getUserId(req),
            MarketingFeedbackInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.get("/ai/training", async (req, res, next) => {
    try {
      res.json(await useCases.training(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/instructions", async (req, res, next) => {
    try {
      const input = MarketingInstructionInputSchema.parse(req.body);
      res
        .status(201)
        .json(await useCases.createInstruction(getUserId(req), input.body, input.note));
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/instructions/:id/publish", async (req, res, next) => {
    try {
      res.json(await useCases.publishInstruction(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/knowledge", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addKnowledge(
            getUserId(req),
            MarketingKnowledgeInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/examples", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addExample(getUserId(req), ExampleInputSchema.parse(req.body)),
        );
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/evaluations", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addEvaluation(
            getUserId(req),
            MarketingEvaluationInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });

  router.post("/ai/training/evaluations/:id/run", async (req, res, next) => {
    try {
      res.json(await useCases.runEvaluation(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.put("/ai/training/settings", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateSettings(
          getUserId(req),
          MarketingLearningPolicySchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}

const privateMarketingAccess: RequestHandler = (req, _res, next) => {
  const userId = getUserId(req);
  if (config.marketingUserIds.length > 0 && !config.marketingUserIds.includes(userId)) {
    next(new ForbiddenError("Esta central de marketing é privada"));
    return;
  }
  if (config.env === "production" && config.marketingUserIds.length === 0) {
    next(
      new ForbiddenError(
        "Configure MARKETING_USER_IDS para liberar esta central privada",
      ),
    );
    return;
  }
  next();
};

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-");
}
