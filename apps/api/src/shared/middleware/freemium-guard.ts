import type { NextFunction, Request, Response } from "express";

import { planLimit } from "@lucro-caseiro/contracts";

import { LimitExceededError } from "../errors";
import {
  getLimitMessage,
  isLimitExceeded,
  resolvePlan,
  type ResourceType,
} from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

export function freemiumGuard(repo: ISubscriptionRepo, resourceType: ResourceType) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);

      const profile = await repo.getProfile(userId);
      const plan = profile ? resolvePlan(profile.plan, profile.planExpiresAt) : "free";

      // Ilimitado nesse plano: nem consulta as contagens.
      if (planLimit(plan, resourceType) === null) {
        next();
        return;
      }

      const counts = await repo.getResourceCounts(userId);
      if (isLimitExceeded(resourceType, counts, plan)) {
        throw new LimitExceededError(getLimitMessage(resourceType));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
