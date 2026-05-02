import { useCallback } from "react";

import { useShowAds } from "./use-show-ads";

/**
 * Interstitial ad placeholder — native module (react-native-google-mobile-ads)
 * will be enabled in production dev builds.
 */
export function useInterstitial() {
  const showAds = useShowAds();

  const show = useCallback(() => {
    if (!showAds) return;
  }, [showAds]);

  return { show };
}
