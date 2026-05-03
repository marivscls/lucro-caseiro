import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useShowAds } from "./use-show-ads";

interface AdMobConfig {
  interstitialUnitIdAndroid?: string;
  interstitialUnitIdIOS?: string;
}

function getAdMobConfig(): AdMobConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants").default as
      | { expoConfig?: { extra?: { admob?: AdMobConfig } } }
      | undefined;
    return Constants?.expoConfig?.extra?.admob ?? {};
  } catch {
    return {};
  }
}

interface InterstitialInstance {
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (event: string, listener: () => void) => () => void;
}

interface InterstitialAdStatic {
  createForAdRequest: (
    unitId: string,
    options?: { requestNonPersonalizedAdsOnly?: boolean },
  ) => InterstitialInstance;
}

interface AdMobModule {
  InterstitialAd: InterstitialAdStatic;
  AdEventType: { LOADED: string; CLOSED: string; ERROR: string };
  TestIds: { INTERSTITIAL: string };
}

let admobModule: AdMobModule | null = null;
let admobLoadFailed = false;

function getAdMob(): AdMobModule | null {
  if (admobModule) return admobModule;
  if (admobLoadFailed) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    admobModule = require("react-native-google-mobile-ads") as AdMobModule;
    return admobModule;
  } catch {
    admobLoadFailed = true;
    return null;
  }
}

function getInterstitialUnitId(): string | null {
  const mod = getAdMob();
  if (!mod) return null;

  if (__DEV__) return mod.TestIds.INTERSTITIAL;

  const cfg = getAdMobConfig();
  const unit = Platform.select({
    android: cfg.interstitialUnitIdAndroid ?? null,
    ios: cfg.interstitialUnitIdIOS ?? null,
    default: null,
  });

  return unit && unit.length > 0 ? unit : null;
}

const FREQUENCY_CAP_MS = 3 * 60 * 1000;

let lastShownAt = 0;

export function useInterstitial() {
  const showAds = useShowAds();
  const adRef = useRef<InterstitialInstance | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!showAds) return;

    const mod = getAdMob();
    if (!mod) return;

    const unitId = getInterstitialUnitId();
    if (!unitId) return;

    const ad = mod.InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(mod.AdEventType.LOADED, () => {
      isLoadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
      isLoadedRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(mod.AdEventType.ERROR, () => {
      isLoadedRef.current = false;
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [showAds]);

  const show = useCallback(() => {
    if (!showAds) return;
    if (!isLoadedRef.current || !adRef.current) return;

    const now = Date.now();
    if (now - lastShownAt < FREQUENCY_CAP_MS) return;

    lastShownAt = now;
    void adRef.current.show().catch(() => {
      // silent — ad can't be shown
    });
  }, [showAds]);

  return { show };
}
