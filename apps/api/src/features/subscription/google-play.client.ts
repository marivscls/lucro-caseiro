import type { PaidPlan } from "@lucro-caseiro/contracts";
import { planFromProductId } from "@lucro-caseiro/contracts";
import { GoogleAuth } from "google-auth-library";

import { ServiceUnavailableError } from "../../shared/errors";
import type {
  AndroidPurchaseData,
  ISubscriptionStatusProvider,
  ProviderPlanState,
} from "./subscription.types";

const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

type SubscriptionState =
  | "SUBSCRIPTION_STATE_UNSPECIFIED"
  | "SUBSCRIPTION_STATE_PENDING"
  | "SUBSCRIPTION_STATE_ACTIVE"
  | "SUBSCRIPTION_STATE_PAUSED"
  | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_STATE_ON_HOLD"
  | "SUBSCRIPTION_STATE_CANCELED"
  | "SUBSCRIPTION_STATE_EXPIRED"
  | "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED";

interface GooglePlaySubscriptionPurchase {
  subscriptionState?: SubscriptionState;
  lineItems?: Array<{
    productId?: string;
    expiryTime?: string;
    offerDetails?: {
      basePlanId?: string;
      offerId?: string;
    };
  }>;
}

function parseServiceAccount(raw: string): Record<string, unknown> {
  try {
    const credentials = JSON.parse(raw) as Record<string, unknown>;
    if (typeof credentials.private_key === "string") {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }
    return credentials;
  } catch {
    throw new ServiceUnavailableError(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON invalido no servidor",
    );
  }
}

function getLatestExpiry(purchase: GooglePlaySubscriptionPurchase): Date | null {
  const dates =
    purchase.lineItems
      ?.map((item) => (item.expiryTime ? new Date(item.expiryTime) : null))
      .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime())) ??
    [];

  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function isActiveState(state: SubscriptionState | undefined, expiresAt: Date | null) {
  if (!state || !expiresAt || expiresAt <= new Date()) return false;
  return [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    "SUBSCRIPTION_STATE_CANCELED",
  ].includes(state);
}

/** Plano pago associado a um line item (productId, basePlanId ou o id do request). */
function resolveLineItemPlan(
  item: NonNullable<GooglePlaySubscriptionPurchase["lineItems"]>[number],
  purchase: AndroidPurchaseData,
): PaidPlan | null {
  const candidates = [
    item.productId,
    item.offerDetails?.basePlanId,
    item.productId === purchase.productId ? purchase.productId : undefined,
  ];
  for (const candidate of candidates) {
    const plan = candidate ? planFromProductId(candidate) : null;
    if (plan) return plan;
  }
  return null;
}

export class GooglePlayClient implements ISubscriptionStatusProvider {
  constructor(
    private packageName: string,
    private serviceAccountJson: string,
  ) {}

  async getPlanState(
    _userId: string,
    purchase: AndroidPurchaseData,
  ): Promise<ProviderPlanState> {
    if (!this.serviceAccountJson) {
      throw new ServiceUnavailableError(
        "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON não configurado no servidor",
      );
    }

    const auth = new GoogleAuth({
      credentials: parseServiceAccount(this.serviceAccountJson),
      scopes: [ANDROID_PUBLISHER_SCOPE],
    });

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
      this.packageName,
    )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchase.purchaseToken)}`;

    let response;
    try {
      response = await auth.request<GooglePlaySubscriptionPurchase>({ url });
    } catch {
      throw new ServiceUnavailableError(
        "Não foi possível verificar assinatura no Google Play",
      );
    }

    const subscription = response.data;
    const plan = subscription.lineItems
      ?.map((item) => resolveLineItemPlan(item, purchase))
      .find((resolved): resolved is PaidPlan => resolved !== null);

    if (!plan) {
      return { plan: "free", expiresAt: null };
    }

    const expiresAt = getLatestExpiry(subscription);
    if (!isActiveState(subscription.subscriptionState, expiresAt)) {
      return { plan: "free", expiresAt: null };
    }

    return { plan, expiresAt };
  }
}
