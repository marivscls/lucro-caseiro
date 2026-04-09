import type { NextFunction, Request, Response } from "express";

import { LimitExceededError } from "../errors";
import {
  getLimitMessage,
  isLimitExceeded,
  isPremiumActive,
  type ResourceType,
} from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

export function freemiumGuard(repo: ISubscriptionRepo, resourceType: ResourceType) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);

      const profile = await repo.getProfile(userId);
      if (profile && isPremiumActive(profile.plan, profile.planExpiresAt)) {
        next();
        return;
      }

      const counts = await repo.getResourceCounts(userId);
      if (isLimitExceeded(resourceType, counts)) {
        throw new LimitExceededError(getLimitMessage(resourceType));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
