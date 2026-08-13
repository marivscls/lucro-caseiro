import {
  VideoEditAssetInputSchema,
  VideoEditJobInputSchema,
  VideoEditRefinementSchema,
} from "@lucro-caseiro/contracts";
import { Router, type Router as ExpressRouter } from "express";

import { getUserId } from "../../shared/middleware/auth";
import type { VideoEditorUseCases } from "./video-editor.usecases";

export function createVideoEditorRouter(useCases: VideoEditorUseCases): ExpressRouter {
  const router = Router();

  router.get("/jobs", async (req, res, next) => {
    try {
      res.json(await useCases.listJobs(getUserId(req)));
    } catch (error) {
      next(error);
    }
  });
  router.post("/jobs", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createJob(
            getUserId(req),
            VideoEditJobInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });
  router.get("/jobs/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getJob(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });
  router.post("/jobs/:id/assets", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.addAsset(
            getUserId(req),
            req.params.id,
            VideoEditAssetInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });
  router.post("/jobs/:id/start", async (req, res, next) => {
    try {
      res.json(await useCases.start(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });
  router.post("/jobs/:id/refine", async (req, res, next) => {
    try {
      res.json(
        await useCases.refine(
          getUserId(req),
          req.params.id,
          VideoEditRefinementSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/jobs/:id/approve", async (req, res, next) => {
    try {
      res.json(await useCases.approve(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
