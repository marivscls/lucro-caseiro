import type { BrandFeatures } from "@lucro-caseiro/brands";
import { useFeature } from "@lucro-caseiro/ui";
import { Redirect } from "expo-router";
import type { ReactNode } from "react";

export function FeatureRouteGuard({
  feature,
  children,
}: Readonly<{ feature: keyof BrandFeatures; children: ReactNode }>) {
  const enabled = useFeature(feature);
  return enabled ? <>{children}</> : <Redirect href="/tabs" />;
}
