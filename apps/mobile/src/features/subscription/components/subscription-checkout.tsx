import type { PaidPlan } from "@lucro-caseiro/contracts";
import React from "react";
import { Platform } from "react-native";

import { useStripeCheckout } from "../use-stripe";
import { useSubscription } from "../use-subscription";
import { Paywall } from "./paywall";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useProfile } from "../hooks";
import { businessCopyFor } from "../business-copy";
import { getPaywallCopy } from "../limit-copy";

interface SubscriptionCheckoutProps {
  readonly recommendedTier: PaidPlan;
  readonly onClose?: () => void;
}

export function SubscriptionCheckout({
  recommendedTier,
  onClose,
}: SubscriptionCheckoutProps) {
  const resource = usePaywall((state) => state.resource);
  const { data: profile } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType);
  const copy = getPaywallCopy(resource, experienceCopy);
  const { subscribe, restore, loading: subscriptionLoading } = useSubscription();
  const { checkout: payWithStripe, loading: stripeLoading } = useStripeCheckout();

  return (
    <Paywall
      title={copy.title}
      message={copy.message}
      experienceCopy={experienceCopy}
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
