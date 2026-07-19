export interface BrandThemeOverrides {
  primary: string;
  primaryLight?: string;
  primaryDark?: string;
  primaryStrong?: string;
  primaryInteractive?: string;
  /** Fill primario no tema escuro: pastel luminoso (o rotulo vira textOnPrimary escuro). */
  primaryInteractiveDark?: string;
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
  materiais: boolean;
  embalagens: boolean;
  vendaPorPeso: boolean;
  custoDireto: boolean;
  comprasComEstoque: boolean;
  varejoPapelaria: boolean;
  [key: string]: boolean;
}

export interface BrandOnboardingConfig {
  /** Valor persistido no perfil quando a marca já representa um nicho vertical. */
  businessType: string;
  /** Nicho local usado para textos/imagens e retomada do onboarding. */
  nicheId: string;
  /** Remove a escolha redundante de nicho em aplicativos verticais. */
  skipNicheSelection: boolean;
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
  onboarding?: BrandOnboardingConfig;
  admob?: BrandAdMobConfig;
}
