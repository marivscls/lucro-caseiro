import {
  CharacterProfileInputSchema,
  CharacterProfilePatchSchema,
  SceneMovementGenerationInputSchema,
  VideoPromptGenerationInputSchema,
  VideoPromptOutputSchema,
  VideoPromptProjectInputSchema,
  VideoPromptProjectPatchSchema,
  VideoPromptProjectQuerySchema,
} from "@lucro-caseiro/contracts";
import { Router } from "express";
import { z } from "zod";

import { getUserId } from "../../shared/middleware/auth";
import type { VideoPromptUseCases } from "./video-prompt.usecases";

export function createVideoPromptRouter(useCases: VideoPromptUseCases): Router {
  const router = Router();

  router.get("/tools", (_req, res) => res.json(useCases.tools()));
  router.get("/projects", async (req, res, next) => {
    try {
      const query = VideoPromptProjectQuerySchema.parse(req.query);
      const { from, to, ...filters } = query;
      res.json(
        await useCases.listProjects(getUserId(req), {
          ...filters,
          ...(from ? { from: new Date(from) } : {}),
          ...(to ? { to: new Date(to) } : {}),
        }),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/projects", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createProject(
            getUserId(req),
            VideoPromptProjectInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });
  router.get("/projects/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getProject(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });
  router.patch("/projects/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateProject(
          getUserId(req),
          req.params.id,
          VideoPromptProjectPatchSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/projects/:id/generate", async (req, res, next) => {
    try {
      res.json(
        await useCases.generateVersion(
          getUserId(req),
          req.params.id,
          VideoPromptGenerationInputSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/projects/:id/scenes/:order/choreography", async (req, res, next) => {
    try {
      const order = z.coerce.number().int().min(0).max(50).parse(req.params.order);
      res.json(
        await useCases.generateSceneChoreography(
          getUserId(req),
          req.params.id,
          order,
          SceneMovementGenerationInputSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/projects/:id/versions", async (req, res, next) => {
    try {
      const input = z
        .object({
          canonicalPrompt: VideoPromptOutputSchema,
          adaptedPrompt: z.string().trim().nullable().optional(),
          targetTool: z.string().trim().nullable().optional(),
        })
        .parse(req.body);
      res
        .status(201)
        .json(await useCases.saveVersion(getUserId(req), req.params.id, input));
    } catch (error) {
      next(error);
    }
  });
  router.post("/projects/:id/publish", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await useCases.publishToContent(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.get("/characters", async (req, res, next) => {
    try {
      const query = z
        .object({
          brandId: z.string().trim().min(1),
          includeArchived: z.coerce.boolean().default(false),
        })
        .parse(req.query);
      res.json(
        await useCases.listCharacters(
          getUserId(req),
          query.brandId,
          query.includeArchived,
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/characters", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          await useCases.createCharacter(
            getUserId(req),
            CharacterProfileInputSchema.parse(req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  });
  router.get("/characters/:id", async (req, res, next) => {
    try {
      res.json(await useCases.getCharacter(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });
  router.patch("/characters/:id", async (req, res, next) => {
    try {
      res.json(
        await useCases.updateCharacter(
          getUserId(req),
          req.params.id,
          CharacterProfilePatchSchema.parse(req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post("/characters/:id/duplicate", async (req, res, next) => {
    try {
      res
        .status(201)
        .json(await useCases.duplicateCharacter(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });
  router.post("/characters/:id/archive", async (req, res, next) => {
    try {
      res.json(await useCases.archiveCharacter(getUserId(req), req.params.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
