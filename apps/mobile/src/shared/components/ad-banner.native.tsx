import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";

import { ensureAdsInitialized } from "../ads-init";
import { useShowAds } from "../hooks/use-show-ads";
import type { AdBannerProps } from "./ad-banner.shared";
export { AD_ITEM_MARKER, interleaveAds } from "./ad-banner.shared";

interface AdMobConfig {
  bannerUnitIdAndroid?: string;
  bannerUnitIdIOS?: string;
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

interface BannerAdProps {
  unitId: string;
  size: string;
}

interface BannerAdSizes {
  ADAPTIVE_BANNER: string;
  BANNER: string;
}

interface AdMobModule {
  BannerAd: React.ComponentType<BannerAdProps>;
  BannerAdSize: BannerAdSizes;
  TestIds: { ADAPTIVE_BANNER: string; BANNER: string };
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

function getBannerUnitId(): string | null {
  const mod = getAdMob();
  if (!mod) return null;

  if (__DEV__) return mod.TestIds.ADAPTIVE_BANNER;

  const cfg = getAdMobConfig();
  return Platform.select({
    android: cfg.bannerUnitIdAndroid ?? null,
    ios: cfg.bannerUnitIdIOS ?? null,
    default: null,
  });
}

export function AdBanner({ style }: AdBannerProps) {
  const showAds = useShowAds();
  // Só renderiza o banner DEPOIS que o SDK do AdMob inicializar. Renderizar antes
  // disso crasha nativamente em produção (e em dev o banner adaptativo também
  // crashava — por isso ads só aparecem em builds de produção, com o SDK pronto).
  const [adsReady, setAdsReady] = useState(false);
  useEffect(() => {
    if (__DEV__ || !showAds) return;
    let active = true;
    void ensureAdsInitialized().then((ok) => {
      if (active && ok) setAdsReady(true);
    });
    return () => {
      active = false;
    };
  }, [showAds]);

  if (__DEV__) return null;
  if (!showAds) return null;
  if (!adsReady) return null;

  const mod = getAdMob();
  if (!mod) return null;

  const unitId = getBannerUnitId();
  if (!unitId) return null;

  const { BannerAd, BannerAdSize } = mod;

  return (
    <View style={[{ alignItems: "center", paddingVertical: 8 }, style]}>
      <BannerAd unitId={unitId} size={BannerAdSize.BANNER} />
    </View>
  );
}
