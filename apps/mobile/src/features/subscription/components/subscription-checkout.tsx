import type { PaidPlan } from "@lucro-caseiro/contracts";
import React from "react";
import { Platform } from "react-native";

import { useStripeCheckout } from "../use-stripe";
import { useSubscription } from "../use-subscription";
import { Paywall } from "./paywall";

interface SubscriptionCheckoutProps {
  readonly recommendedTier: PaidPlan;
  readonly onClose?: () => void;
}

export function SubscriptionCheckout({
  recommendedTier,
  onClose,
}: SubscriptionCheckoutProps) {
  const { subscribe, restore, loading: subscriptionLoading } = useSubscription();
  const { checkout: payWithStripe, loading: stripeLoading } = useStripeCheckout();

  return (
    <Paywall
      recommendedTier={recommendedTier}
      onClose={onClose}
      onSubscribe={(tier, period) => {
        if (Platform.OS === "android") {
          void subscribe(tier, period);
          return;
        }
        void payWithStripe(tier, period);
      }}
      onRestore={() => {
        void restore();
      }}
      loading={subscriptionLoading || stripeLoading}
    />
  );
}
