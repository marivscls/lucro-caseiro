import type { NextFunction, Request, Response } from "express";

import type { PlanFeature } from "@lucro-caseiro/contracts";

import { LimitExceededError } from "../errors";
import { hasActiveFeature } from "../../features/subscription/subscription.domain";
import type { ISubscriptionRepo } from "../../features/subscription/subscription.types";
import { getUserId } from "./auth";

const FEATURE_MESSAGE: Partial<Record<PlanFeature, string>> = {
  // 2026-11-15: o resumo do mês em PDF saiu do Gratuito.
  exportBasic: "O resumo do mês em PDF faz parte do plano Premium.",
  quotesPdf: "Orçamento em PDF faz parte do plano Premium.",
  fiado:
    "Cobrar o fiado por link ou Pix faz parte do plano Premium. Você ainda pode dar baixa no que já está pendente.",
  financeHistory: "Ver meses anteriores do financeiro faz parte do plano Premium.",
  export: "A exportação em Excel e os relatórios avançados fazem parte do plano Premium.",
  advancedReports: "Os relatórios completos fazem parte do plano Premium.",
  extraPhotos: "Fotos adicionais do produto fazem parte do plano Premium.",
  catalogCustomization: "A personalização do catálogo faz parte do plano Premium.",
  purchases: "Registrar compras de fornecedores faz parte do plano Premium.",
  compositeProducts: "Produtos compostos (kits) fazem parte do plano Premium.",
};

function featureMessage(feature: PlanFeature): string {
  return (
    FEATURE_MESSAGE[feature] ??
    "Esse recurso faz parte do plano Premium. Faça upgrade para liberar."
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
 * Fotos extras do produto (galeria) só no Premium. Diferente do
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

/**
 * Produto composto (kit) só no Premium. Só barra quando o request cria ou
 * transforma o produto em composto (`isComposite: true`) — editar/excluir um
 * produto simples segue liberado em qualquer plano.
 */
export function requireFeatureForComposite(repo: ISubscriptionRepo) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const isComposite = (req.body as { isComposite?: unknown } | undefined)
        ?.isComposite;
      if (isComposite !== true) {
        next();
        return;
      }

      const userId = getUserId(req);
      const profile = await repo.getProfile(userId);
      if (
        profile &&
        hasActiveFeature(profile.plan, profile.planExpiresAt, "compositeProducts")
      ) {
        next();
        return;
      }

      throw new LimitExceededError(featureMessage("compositeProducts"));
    } catch (err) {
      next(err);
    }
  };
}
