import { ClaimReferralDto } from "@lucro-caseiro/contracts";
import { Router } from "express";

import { authMiddleware, getUserId } from "../../shared/middleware/auth";
import type { ReferralsUseCases } from "./referrals.usecases";

export function createReferralsRouter(useCases: ReferralsUseCases): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res, next) => {
    try {
      res.json(await useCases.getSummary(getUserId(req)));
    } catch (err) {
      next(err);
    }
  });

  router.post("/claim", async (req, res, next) => {
    try {
      const { code } = ClaimReferralDto.parse(req.body);
      res.json(await useCases.claim(getUserId(req), code));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
