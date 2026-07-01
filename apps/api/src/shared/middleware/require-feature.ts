import type { NextFunction, Request, Response } from "express";

import type { PlanFeature } from "@lucro-caseiro/contracts";

import { LimitExceededError } from "../errors";
import { hasActiveFeature } from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

const FEATURE_MESSAGE: Partial<Record<PlanFeature, string>> = {
  export: "A exportação em PDF/Excel faz parte do plano Profissional.",
  advancedReports: "Os relatórios completos fazem parte do plano Profissional.",
  extraPhotos: "Fotos adicionais do produto fazem parte do plano Profissional.",
  catalogCustomization: "A personalização do catálogo faz parte do plano Profissional.",
};

function featureMessage(feature: PlanFeature): string {
  return (
    FEATURE_MESSAGE[feature] ??
    "Esse recurso faz parte do plano Profissional. Faça upgrade para liberar."
  );
}

/**
 * Bloqueia uma rota inteira quando o plano ativo não tem a feature. Lança
 * `LimitExceededError` (403 / LIMIT_EXCEEDED), o mesmo que o app trata abrindo o
 * paywall.
 */
export function requireFeature(repo: ISubscriptionRepo, feature: PlanFeature) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const profile = await repo.getProfile(userId);
      if (profile && hasActiveFeature(profile.plan, profile.planExpiresAt, feature)) {
        next();
        return;
      }
      throw new LimitExceededError(featureMessage(feature));
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Fotos extras do produto (galeria) só no Profissional. Diferente do
 * `requireFeature`, só barra quando o request traz `extraPhotos` não-vazio — os
 * demais planos seguem criando/editando produtos normalmente.
 */
export function requireFeatureForExtraPhotos(repo: ISubscriptionRepo) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const extra = (req.body as { extraPhotos?: unknown } | undefined)?.extraPhotos;
      if (!Array.isArray(extra) || extra.length === 0) {
        next();
        return;
      }

      const userId = getUserId(req);
      const profile = await repo.getProfile(userId);
      if (
        profile &&
        hasActiveFeature(profile.plan, profile.planExpiresAt, "extraPhotos")
      ) {
        next();
        return;
      }

      throw new LimitExceededError(featureMessage("extraPhotos"));
    } catch (err) {
      next(err);
    }
  };
}
