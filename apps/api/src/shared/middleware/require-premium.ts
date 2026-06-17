import type { NextFunction, Request, Response } from "express";

import { LimitExceededError } from "../errors";
import { isPremiumActive } from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

/**
 * Bloqueia uma rota inteira para o plano free (recurso só-Premium, ex.: exportação).
 * Lança `LimitExceededError` (403 / código LIMIT_EXCEEDED), o mesmo que o app já
 * trata abrindo o paywall.
 */
export function requirePremium(repo: ISubscriptionRepo) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const profile = await repo.getProfile(userId);
      if (profile && isPremiumActive(profile.plan, profile.planExpiresAt)) {
        next();
        return;
      }
      throw new LimitExceededError("Esse recurso é Premium. Faça upgrade para liberar.");
    } catch (err) {
      next(err);
    }
  };
}
