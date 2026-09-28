import { NotFoundError } from "../../shared/errors";
import { decidePlayPlanChange, type PlayPlanDecision } from "./google-play-rtdn.domain";
import { hashPurchaseToken } from "./subscription.domain";
import type {
  IGooglePlaySubscriptionLookup,
  IPlanStateWriter,
  ISubscriptionRepo,
} from "./subscription.types";

export interface PlayNotificationOutcome {
  decision: PlayPlanDecision;
  /** Dono da compra, quando conhecido (para log). Nunca inclui o token. */
  userId: string | null;
}

/**
 * Processa uma Real-time Developer Notification de assinatura do Google Play.
 * Nunca confia no conteudo da notificacao: o estado vem do subscriptionsv2 e o dono
 * precisa ter vinculado o token antes (via `/sync-plan`). Idempotente: reprocessar a
 * mesma notificacao reescreve o mesmo estado.
 * Falhas transitorias (Google/DB) propagam para o Pub/Sub tentar de novo.
 */
export class GooglePlayNotificationsUseCases {
  constructor(
    private repo: Pick<ISubscriptionRepo, "getProfile" | "hasPurchaseClaim">,
    private lookup: IGooglePlaySubscriptionLookup,
    private plans: IPlanStateWriter,
  ) {}

  async handleSubscriptionNotification(
    purchaseToken: string,
    productIdHint?: string,
  ): Promise<PlayNotificationOutcome> {
    const snapshot = await this.lookup.getSubscription(purchaseToken, productIdHint);
    const userId = snapshot?.purchaseOwnerId ?? null;

    const claimedByOwner = userId
      ? await this.repo.hasPurchaseClaim(
          userId,
          "google-play",
          hashPurchaseToken(purchaseToken),
        )
      : false;
    const currentProfile =
      userId && claimedByOwner ? await this.repo.getProfile(userId) : null;

    const decision = decidePlayPlanChange({ snapshot, claimedByOwner, currentProfile });

    try {
      if (userId && decision.action === "activate") {
        await this.plans.activatePlan(userId, decision.plan, decision.expiresAt);
      } else if (userId && decision.action === "deactivate") {
        await this.plans.deactivatePlan(userId);
      }
    } catch (error) {
      // Conta apagada entre a leitura e a escrita: nada a fazer, nao adianta repetir.
      if (error instanceof NotFoundError) {
        return { decision: { action: "ignore", reason: "unknown_user" }, userId };
      }
      throw error;
    }

    return { decision, userId };
  }
}
