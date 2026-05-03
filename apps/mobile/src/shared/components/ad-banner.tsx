import React from "react";
import { Platform, View } from "react-native";

import { useShowAds } from "../hooks/use-show-ads";

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

interface AdBannerProps {
  readonly size?: "banner" | "largeBanner" | "mediumRectangle";
  readonly style?: object;
}

export function AdBanner({ style }: AdBannerProps) {
  const showAds = useShowAds();
  if (!showAds) return null;

  const mod = getAdMob();
  if (!mod) return null;

  const unitId = getBannerUnitId();
  if (!unitId) return null;

  const { BannerAd, BannerAdSize } = mod;

  return (
    <View style={[{ alignItems: "center", paddingVertical: 8 }, style]}>
      <BannerAd unitId={unitId} size={BannerAdSize.ADAPTIVE_BANNER} />
    </View>
  );
}

export const AD_ITEM_MARKER = "__AD__" as const;

export function interleaveAds<T>(
  items: T[],
  interval: number = 8,
): (T | typeof AD_ITEM_MARKER)[] {
  if (items.length < 5) return items;

  const result: (T | typeof AD_ITEM_MARKER)[] = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items[i]);
    if ((i + 1) % interval === 0 && i < items.length - 1) {
      result.push(AD_ITEM_MARKER);
    }
  }
  return result;
}
