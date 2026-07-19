import fs from "node:fs";
import path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

type AdMobKey =
  | "androidAppId"
  | "iosAppId"
  | "bannerUnitIdAndroid"
  | "interstitialUnitIdAndroid";

interface RuntimeBrandConfig {
  id: string;
  appName: string;
  slug: string;
  scheme: string;
  iosBundleId: string;
  androidPackage: string;
  easProjectId?: string;
  theme: {
    primary: string;
    primarySoft?: string;
    backgroundDark?: string;
  };
  admob?: Partial<Record<AdMobKey, string>>;
}

const DEFAULT_BRAND_ID = "lucro-caseiro";
const brandsRoot = path.resolve(__dirname, "../../packages/brands");

function readBrand(id: string): RuntimeBrandConfig {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Marca invalida: ${id}`);
  const file = path.join(brandsRoot, "src", id, "brand.json");
  if (!fs.existsSync(file)) throw new Error(`Marca desconhecida: ${id}`);
  const brand = JSON.parse(fs.readFileSync(file, "utf8")) as RuntimeBrandConfig;
  if (brand.id !== id) throw new Error(`Config de marca inconsistente: ${id}`);
  return brand;
}

const activeBrandId =
  process.env.BRAND?.trim() ||
  process.env.EXPO_PUBLIC_BRAND?.trim() ||
  process.env.NEXT_PUBLIC_BRAND?.trim() ||
  DEFAULT_BRAND_ID;
const activeBrand = readBrand(activeBrandId);
const defaultBrand = readBrand(DEFAULT_BRAND_ID);
const knownBrandIds = fs
  .readdirSync(path.join(brandsRoot, "src"), { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      fs.existsSync(path.join(brandsRoot, "src", entry.name, "brand.json")),
  )
  .map((entry) => entry.name)
  .sort();
const isProduction = process.env.NODE_ENV === "production";

function brandAsset(name: string) {
  const candidate = path.join(brandsRoot, activeBrand.id, "assets", name);
  return fs.existsSync(candidate) ? candidate : path.resolve(__dirname, "assets", name);
}

function envOrBrand(envName: string, brandKey: AdMobKey, value?: string) {
  return (
    process.env[envName]?.trim() ||
    value ||
    (!isProduction ? defaultBrand.admob?.[brandKey] : undefined)
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = process.env.EAS_PROJECT_ID?.trim() || activeBrand.easProjectId;
  const androidAppId = envOrBrand(
    "EXPO_PUBLIC_ADMOB_ANDROID_APP_ID",
    "androidAppId",
    activeBrand.admob?.androidAppId,
  );
  const iosAppId = envOrBrand(
    "EXPO_PUBLIC_ADMOB_IOS_APP_ID",
    "iosAppId",
    activeBrand.admob?.iosAppId,
  );
  const bannerUnitIdAndroid = envOrBrand(
    "EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID",
    "bannerUnitIdAndroid",
    activeBrand.admob?.bannerUnitIdAndroid,
  );
  const interstitialUnitIdAndroid = envOrBrand(
    "EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID_ANDROID",
    "interstitialUnitIdAndroid",
    activeBrand.admob?.interstitialUnitIdAndroid,
  );

  const adMobPlugin: ExpoConfig["plugins"] =
    androidAppId && iosAppId
      ? [["react-native-google-mobile-ads", { androidAppId, iosAppId }]]
      : [];
  const plugins: ExpoConfig["plugins"] = [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: brandAsset("notification-icon.png"),
        color: activeBrand.theme.primary,
        defaultChannel: "default",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "O app precisa acessar suas fotos para adicionar imagens a produtos e receitas.",
        cameraPermission:
          "O app precisa acessar a camera para tirar fotos de produtos e receitas.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "O app usa a camera para escanear o codigo de barras dos produtos.",
      },
    ],
    ...adMobPlugin,
    "@react-native-community/datetimepicker",
    "expo-font",
    "expo-web-browser",
  ];

  return {
    ...config,
    name: activeBrand.appName,
    slug: activeBrand.slug,
    version: "1.2.0",
    orientation: "portrait",
    icon: brandAsset("icon.png"),
    userInterfaceStyle: "automatic",
    scheme: activeBrand.scheme,
    splash: {
      image: brandAsset("splash.png"),
      backgroundColor: activeBrand.theme.backgroundDark ?? "#1E1814",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: activeBrand.iosBundleId,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: brandAsset("adaptive-icon.png"),
        backgroundColor: activeBrand.theme.primarySoft ?? "#F7DFD6",
      },
      package: activeBrand.androidPackage,
      versionCode: 19,
      softwareKeyboardLayoutMode: "resize",
      permissions: [],
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    plugins,
    experiments: { autolinkingModuleResolution: true },
    extra: {
      router: {},
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
      brand: activeBrand.id,
      knownBrands: knownBrandIds,
      admob: { bannerUnitIdAndroid, interstitialUnitIdAndroid },
    },
    owner: "marivscls5",
  };
};
