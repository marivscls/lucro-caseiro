// Inicializa o SDK do Google Mobile Ads UMA única vez. Renderizar um BannerAd ou
// criar um Interstitial ANTES do initialize() resolver pode crashar nativamente em
// builds de produção (em dev os ads nem renderizam). Por isso cada uso de anúncio
// espera por esta função. À prova de falha: se algo der errado, resolve `false` e o
// chamador simplesmente não mostra o anúncio (em vez de derrubar o app).
interface MobileAdsModule {
  default?: () => { initialize: () => Promise<unknown> };
}

let initialized = false;
let initPromise: Promise<boolean> | null = null;

export function ensureAdsInitialized(): Promise<boolean> {
  if (initialized) return Promise.resolve(true);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("react-native-google-mobile-ads") as MobileAdsModule;
      if (typeof mod.default !== "function") return false;
      await mod.default().initialize();
      initialized = true;
      return true;
    } catch {
      return false;
    }
  })();
  return initPromise;
}
