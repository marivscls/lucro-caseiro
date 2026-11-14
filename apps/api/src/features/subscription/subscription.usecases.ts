import type {
  AnalyticsActionName,
  FreemiumLimits,
  PaidPlan,
  PlanType,
  UserProfile,
} from "@lucro-caseiro/contracts";

import { isActiveTrial } from "@lucro-caseiro/contracts";

import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../../shared/errors";
import type { OpsAlert } from "../../shared/ops-alert";
import {
  buildFreemiumLimits,
  hashPurchaseToken,
  resolvePlan,
} from "./subscription.domain";
import type {
  AndroidPurchaseData,
  ISubscriptionRepo,
  ISubscriptionStatusProvider,
  ProfessionalTrialCampaignNotifier,
  SubscriptionLifecycleEvent,
  SubscriptionLifecycleNotifier,
  UpsertProfileData,
} from "./subscription.types";

function isPaidPlan(plan: PlanType): plan is PaidPlan {
  return plan === "essential" || plan === "professional";
}

function planLabel(plan: PlanType): string {
  if (plan === "essential") return "Essencial";
  if (plan === "professional") return "Profissional";
  return plan;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isLaterExpiration(previous: string | null, updated: string | null): boolean {
  if (!updated) return false;
  if (!previous) return true;
  return new Date(updated).getTime() > new Date(previous).getTime();
}

export class SubscriptionUseCases {
  constructor(
    private repo: ISubscriptionRepo,
    private statusProvider?: ISubscriptionStatusProvider,
    private recordLifecycleEvent?: (
      userId: string,
      action: AnalyticsActionName,
    ) => Promise<void>,
    private notifyLifecycle?: SubscriptionLifecycleNotifier,
    private notifyProfessionalTrialCampaign?: ProfessionalTrialCampaignNotifier,
    private alertOps?: OpsAlert,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil não encontrado");
    }
    // Em segundo plano: falha no e-mail da campanha nunca derruba o perfil.
    void this.sendProfessionalTrialCampaignEmail(userId);
    return profile;
  }

  async ensureProfile(userId: string, data: UpsertProfileData): Promise<UserProfile> {
    return this.repo.upsertProfile(userId, data);
  }

  async updateProfile(
    userId: string,
    data: Partial<
      Pick<
        UpsertProfileData,
        "name" | "phone" | "businessName" | "businessType" | "avatarUrl"
      >
    >,
  ): Promise<UserProfile> {
    const existing = await this.repo.getProfile(userId);
    if (!existing) {
      throw new NotFoundError("Perfil não encontrado");
    }

    return this.repo.upsertProfile(userId, {
      email: existing.email,
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone ?? undefined,
      businessName: data.businessName ?? existing.businessName ?? undefined,
      businessType: data.businessType ?? existing.businessType ?? undefined,
      avatarUrl: data.avatarUrl ?? existing.avatarUrl ?? undefined,
    });
  }

  async getLimits(userId: string): Promise<FreemiumLimits> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) {
      throw new NotFoundError("Perfil não encontrado");
    }

    const plan = resolvePlan(profile.plan, profile.planExpiresAt);
    const counts = await this.repo.getResourceCounts(userId);
    return buildFreemiumLimits(counts, plan);
  }

  /** Plano efetivo (já normalizado e considerando expiração). */
  async getActivePlan(userId: string): Promise<PlanType> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) return "free";
    return resolvePlan(profile.plan, profile.planExpiresAt);
  }

  async activatePlan(
    userId: string,
    plan: PlanType,
    expiresAt: Date | null,
  ): Promise<UserProfile> {
    const previous = await this.repo.getProfile(userId);
    const updated = await this.repo.updatePlan(userId, plan, expiresAt);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    // Teste grátis não é assinatura: sair do teste para um plano pago conta
    // como Free→pago (subscription_completed + e-mail de ativação).
    const previousPlan =
      previous && !this.isTrial(previous)
        ? resolvePlan(previous.plan, previous.planExpiresAt)
        : "free";
    const activePlan = resolvePlan(updated.plan, updated.planExpiresAt);

    if (previous && previousPlan === "free" && isPaidPlan(activePlan)) {
      await this.recordLifecycleAnalytics(userId, "subscription_completed");
      await this.sendOpsAlert(
        `Nova assinatura: ${planLabel(activePlan)}. Conta ${userId}. Vale ate ${updated.planExpiresAt ?? "sem data"}.`,
      );
      await this.sendLifecycleNotification({
        kind: "activated",
        userId,
        email: updated.email,
        plan: activePlan,
        expiresAt: updated.planExpiresAt,
        deduplicationKey: `${activePlan}:${updated.planExpiresAt ?? "none"}`,
      });
    } else if (previous && isPaidPlan(previousPlan) && isPaidPlan(activePlan)) {
      if (previousPlan !== activePlan) {
        await this.sendLifecycleNotification({
          kind: "activated",
          userId,
          email: updated.email,
          plan: activePlan,
          expiresAt: updated.planExpiresAt,
          deduplicationKey: `${activePlan}:${updated.planExpiresAt ?? "none"}`,
        });
      } else if (isLaterExpiration(previous.planExpiresAt, updated.planExpiresAt)) {
        await this.sendLifecycleNotification({
          kind: "renewed",
          userId,
          email: updated.email,
          plan: activePlan,
          expiresAt: updated.planExpiresAt,
          deduplicationKey: `${activePlan}:${updated.planExpiresAt}`,
        });
      }
    }
    return updated;
  }

  async deactivatePlan(userId: string): Promise<UserProfile> {
    const previous = await this.repo.getProfile(userId);
    // Cancelamento/expiração de uma compra (Stripe/Play) nunca derruba o teste
    // grátis em andamento: ele termina sozinho pela data.
    if (previous && this.isTrial(previous)) return previous;
    const updated = await this.repo.updatePlan(userId, "free", null);
    if (!updated) {
      throw new NotFoundError("Perfil não encontrado");
    }
    if (previous && resolvePlan(previous.plan, previous.planExpiresAt) !== "free") {
      await this.recordLifecycleAnalytics(userId, "subscription_cancelled");
      const previousPlan = resolvePlan(previous.plan, previous.planExpiresAt);
      await this.sendOpsAlert(
        `Assinatura encerrada: ${planLabel(previousPlan)}. Conta ${userId}.`,
      );
      if (isPaidPlan(previousPlan)) {
        await this.sendLifecycleNotification({
          kind: "cancelled",
          userId,
          email: previous.email,
          plan: previousPlan,
          expiresAt: null,
          deduplicationKey: `${previousPlan}:${previous.planExpiresAt ?? "none"}`,
        });
      }
    }
    return updated;
  }

  async notifyPaymentFailed(userId: string, deduplicationKey: string): Promise<void> {
    const profile = await this.repo.getProfile(userId);
    if (!profile) return;
    const activePlan = resolvePlan(profile.plan, profile.planExpiresAt);
    if (!isPaidPlan(activePlan)) return;

    await this.sendLifecycleNotification({
      kind: "payment_failed",
      userId,
      email: profile.email,
      plan: activePlan,
      expiresAt: profile.planExpiresAt,
      deduplicationKey,
    });
  }

  async syncPlanFromProvider(
    userId: string,
    purchase: AndroidPurchaseData,
  ): Promise<UserProfile> {
    if (!this.statusProvider) {
      throw new ServiceUnavailableError(
        "Verificacao de assinatura Android não configurada no servidor",
      );
    }

    let state: Awaited<ReturnType<ISubscriptionStatusProvider["getPlanState"]>>;
    try {
      state = await this.statusProvider.getPlanState(userId, purchase);
    } catch (error) {
      await this.sendOpsAlert(
        `Compra Google Play nao liberou: erro ao consultar o Google (${errorMessage(error)}). Conta ${userId}, produto ${purchase.productId}. O app tenta de novo; se repetir, conferir credencial do Play.`,
        `sync-error:${userId}`,
      );
      throw error;
    }

    if (state.plan === "free") {
      const current = await this.getProfile(userId);
      const alreadyPaid =
        !this.isTrial(current) &&
        isPaidPlan(resolvePlan(current.plan, current.planExpiresAt));
      // Quem já tem plano pago (ex.: Stripe) não perdeu nada: sem alerta.
      if (alreadyPaid) return current;
      await this.sendOpsAlert(
        `Compra Google Play ainda nao liberou: o Google nao confirma a assinatura como ativa (pagamento pendente ou cancelado). Conta ${userId}, produto ${purchase.productId}. O app tenta de novo sozinho; se em 10 min nao virar "Nova assinatura", conferir no Play Console > Gestao de pedidos.`,
        `sync-inactive:${userId}`,
      );
    }

    if (state.plan !== "free") {
      if (state.purchaseOwnerId !== userId) {
        await this.sendOpsAlert(
          `Compra Google Play bloqueada: a compra pertence a outra conta. Conta ${userId}, produto ${purchase.productId}.`,
          `sync-owner:${userId}`,
        );
        throw new ForbiddenError("Esta compra do Google Play nao pertence a esta conta.");
      }

      const tokenHash = hashPurchaseToken(purchase.purchaseToken);
      const claimed = await this.repo.claimPurchaseToken(
        userId,
        "google-play",
        tokenHash,
      );
      if (!claimed) {
        await this.sendOpsAlert(
          `Compra Google Play bloqueada: o token ja esta ligado a outra conta. Conta ${userId}, produto ${purchase.productId}.`,
          `sync-claimed:${userId}`,
        );
        throw new ForbiddenError(
          "Esta compra do Google Play ja esta vinculada a outra conta.",
        );
      }

      return this.activatePlan(userId, state.plan, state.expiresAt);
    }

    return this.getProfile(userId);
  }

  /** Analytics é best-effort: falhar ao gravar o evento nunca desfaz nem interrompe a mudança de plano. */
  private async recordLifecycleAnalytics(
    userId: string,
    action: AnalyticsActionName,
  ): Promise<void> {
    if (!this.recordLifecycleEvent) return;
    try {
      await this.recordLifecycleEvent(userId, action);
    } catch (error) {
      console.error("subscription_lifecycle_analytics_failed", {
        userId,
        action,
        error: errorMessage(error),
      });
    }
  }

  private async sendOpsAlert(message: string, dedupeKey?: string): Promise<void> {
    if (!this.alertOps) return;
    await this.alertOps(message, dedupeKey ? { dedupeKey } : undefined);
  }

  private isTrial(profile: UserProfile): boolean {
    return isActiveTrial(profile.plan, profile.planExpiresAt, profile.planIsTrial);
  }

  private async sendLifecycleNotification(
    event: SubscriptionLifecycleEvent,
  ): Promise<void> {
    if (!this.notifyLifecycle) return;
    try {
      await this.notifyLifecycle(event);
    } catch (error) {
      console.error("Subscription lifecycle email failed", {
        kind: event.kind,
        userId: event.userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async sendProfessionalTrialCampaignEmail(userId: string): Promise<void> {
    if (!this.notifyProfessionalTrialCampaign) return;

    let claimed = false;
    try {
      const claim = await this.repo.claimProfessionalTrialCampaignEmail(userId);
      if (!claim) return;
      claimed = true;

      const result = await this.notifyProfessionalTrialCampaign({
        ...claim,
        idempotencyKey: `professional-trial-campaign-2026-${claim.userId}`,
      });
      await this.repo.completeProfessionalTrialCampaignEmail(userId, result.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Professional trial campaign email failed", {
        userId,
        error: message,
      });
      if (!claimed) return;
      await this.repo
        .releaseProfessionalTrialCampaignEmail(userId, message)
        .catch((releaseError: unknown) => {
          console.error("Professional trial campaign release failed", {
            userId,
            error:
              releaseError instanceof Error ? releaseError.message : String(releaseError),
          });
        });
    }
  }
}
