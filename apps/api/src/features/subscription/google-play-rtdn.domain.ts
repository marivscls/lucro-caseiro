import type { PaidPlan } from "@lucro-caseiro/contracts";
import { isActiveTrial, normalizePlan } from "@lucro-caseiro/contracts";

import { resolvePlan } from "./subscription.domain";
import type { GooglePlaySubscriptionSnapshot } from "./subscription.types";

/**
 * Google Play Real-time Developer Notifications (RTDN) chegam via Pub/Sub push:
 * `{ message: { data: base64(DeveloperNotification), messageId }, subscription }`.
 * Regras puras: parse do corpo e decisao de plano. Sem IO.
 */

export type PlayNotificationIgnoreReason =
  | "invalid_payload"
  | "package_mismatch"
  | "test_notification"
  | "unsupported_notification";

export type ParsedPlayNotification =
  | {
      kind: "subscription";
      messageId: string | null;
      purchaseToken: string;
      notificationType: number | null;
      subscriptionId: string | null;
    }
  | {
      kind: "ignore";
      messageId: string | null;
      reason: PlayNotificationIgnoreReason;
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function decodeData(data: unknown): Record<string, unknown> | null {
  if (typeof data !== "string" || data.length === 0) return null;
  try {
    return asRecord(JSON.parse(Buffer.from(data, "base64").toString("utf8")));
  } catch {
    return null;
  }
}

export function parsePlayPushBody(
  body: unknown,
  expectedPackageName: string,
): ParsedPlayNotification {
  const message = asRecord(asRecord(body)?.message);
  const messageId = typeof message?.messageId === "string" ? message.messageId : null;
  const notification = decodeData(message?.data);
  if (!notification) return { kind: "ignore", messageId, reason: "invalid_payload" };

  if (notification.packageName !== expectedPackageName) {
    return { kind: "ignore", messageId, reason: "package_mismatch" };
  }

  if (asRecord(notification.testNotification)) {
    return { kind: "ignore", messageId, reason: "test_notification" };
  }

  const subscription = asRecord(notification.subscriptionNotification);
  if (!subscription) {
    return { kind: "ignore", messageId, reason: "unsupported_notification" };
  }

  const purchaseToken = subscription.purchaseToken;
  if (typeof purchaseToken !== "string" || purchaseToken.length === 0) {
    return { kind: "ignore", messageId, reason: "invalid_payload" };
  }

  return {
    kind: "subscription",
    messageId,
    purchaseToken,
    notificationType:
      typeof subscription.notificationType === "number"
        ? subscription.notificationType
        : null,
    subscriptionId:
      typeof subscription.subscriptionId === "string"
        ? subscription.subscriptionId
        : null,
  };
}

export type PlayPlanIgnoreReason =
  | "token_not_found"
  | "unknown_product"
  | "no_owner"
  | "not_claimed"
  | "unknown_user"
  | "current_plan_outlasts_play"
  | "already_free"
  | "trial_in_progress"
  | "unknown_plan_source";

export type PlayPlanDecision =
  | { action: "activate"; plan: PaidPlan; expiresAt: Date | null }
  | { action: "deactivate" }
  | { action: "ignore"; reason: PlayPlanIgnoreReason };

export interface PlayPlanDecisionInput {
  snapshot: GooglePlaySubscriptionSnapshot | null;
  /** O dono (obfuscatedExternalAccountId) ja fez `claimPurchaseToken` deste token. */
  claimedByOwner: boolean;
  currentProfile: {
    plan: string;
    planExpiresAt: string | null;
    planIsTrial?: boolean;
  } | null;
}

/**
 * O banco nao guarda a origem do plano (Stripe x Google Play). Por isso:
 * - ativa/renova so se o plano atual nao dura mais que a Play (nao encurta um Stripe maior);
 * - desativa so se o plano atual termina ate a expiracao da Play (nao derruba um Stripe
 *   mais novo). Plano pago sem expiracao conhecida nunca e tocado por aqui.
 */
export function decidePlayPlanChange({
  snapshot,
  claimedByOwner,
  currentProfile,
}: PlayPlanDecisionInput): PlayPlanDecision {
  if (!snapshot) return { action: "ignore", reason: "token_not_found" };
  if (!snapshot.plan) return { action: "ignore", reason: "unknown_product" };
  if (!snapshot.purchaseOwnerId) return { action: "ignore", reason: "no_owner" };
  if (!claimedByOwner) return { action: "ignore", reason: "not_claimed" };
  if (!currentProfile) return { action: "ignore", reason: "unknown_user" };

  const currentExpiry = currentProfile.planExpiresAt
    ? new Date(currentProfile.planExpiresAt)
    : null;
  const playExpiry = snapshot.expiresAt;
  // Teste grátis não é plano de outro canal: compra ativa sempre substitui, e
  // uma compra inativa nunca encerra o teste (ele termina sozinho pela data).
  const onTrial = isActiveTrial(
    currentProfile.plan,
    currentProfile.planExpiresAt,
    currentProfile.planIsTrial,
  );

  if (snapshot.active) {
    const currentPlan = onTrial
      ? "free"
      : resolvePlan(currentProfile.plan, currentProfile.planExpiresAt);
    if (currentPlan !== "free") {
      if (!currentExpiry) return { action: "ignore", reason: "unknown_plan_source" };
      if (playExpiry && currentExpiry > playExpiry) {
        return { action: "ignore", reason: "current_plan_outlasts_play" };
      }
    }
    return { action: "activate", plan: snapshot.plan, expiresAt: playExpiry };
  }

  if (normalizePlan(currentProfile.plan) === "free") {
    return { action: "ignore", reason: "already_free" };
  }
  if (onTrial) return { action: "ignore", reason: "trial_in_progress" };
  if (!currentExpiry || !playExpiry) {
    return { action: "ignore", reason: "unknown_plan_source" };
  }
  if (currentExpiry > playExpiry) {
    return { action: "ignore", reason: "current_plan_outlasts_play" };
  }
  return { action: "deactivate" };
}
