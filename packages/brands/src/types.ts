export interface BrandThemeOverrides {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  primaryStrong?: string;
  primaryInteractive?: string;
  primarySoft?: string;
  primarySoftDark?: string;
  background?: string;
  surface?: string;
  backgroundDark?: string;
  surfaceDark?: string;
}

export interface BrandCopy {
  productNoun: string;
  productNounPlural: string;
  saleLabel: string;
  stockLabel: string;
  revenueLabel: string;
  [key: string]: string;
}

export interface BrandFeatures {
  estoque: boolean;
  agendamento: boolean;
  catalogoCores: boolean;
  fichaTecnica: boolean;
  [key: string]: boolean;
}

export interface BrandAdMobConfig {
  androidAppId?: string;
  iosAppId?: string;
  bannerUnitIdAndroid?: string;
  interstitialUnitIdAndroid?: string;
}

export interface BrandConfig {
  id: string;
  appName: string;
  slug: string;
  scheme: string;
  iosBundleId: string;
  androidPackage: string;
  easProjectId?: string;
  theme: BrandThemeOverrides;
  copy: BrandCopy;
  features: BrandFeatures;
  admob?: BrandAdMobConfig;
}
