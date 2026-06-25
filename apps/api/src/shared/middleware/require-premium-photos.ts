import type { NextFunction, Request, Response } from "express";

import { LimitExceededError } from "../errors";
import { isPremiumActive } from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

/**
 * Fotos adicionais do produto (galeria) são exclusivas do Premium. Diferente do
 * `requirePremium` (bloqueia a rota inteira), este só barra quando o request traz
 * `extraPhotos` não-vazio — o free segue criando/editando produtos normalmente,
 * só não pode anexar fotos extras.
 */
export function requirePremiumForExtraPhotos(repo: ISubscriptionRepo) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const extra = (req.body as { extraPhotos?: unknown } | undefined)?.extraPhotos;
      if (!Array.isArray(extra) || extra.length === 0) {
        next();
        return;
      }

      const userId = getUserId(req);
      const profile = await repo.getProfile(userId);
      if (profile && isPremiumActive(profile.plan, profile.planExpiresAt)) {
        next();
        return;
      }

      throw new LimitExceededError(
        "Fotos adicionais do produto são exclusivas do Premium.",
      );
    } catch (err) {
      next(err);
    }
  };
}
