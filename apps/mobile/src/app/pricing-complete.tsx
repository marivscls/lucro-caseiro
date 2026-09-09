import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

/** Keep saved links working after unifying the pricing experience. */
export default function CompletePricingScreen() {
  const params = useLocalSearchParams<{
    recipeCost?: string;
    productId?: string;
    name?: string;
    category?: string;
  }>();
  return <Redirect href={{ pathname: "/pricing", params }} />;
}
