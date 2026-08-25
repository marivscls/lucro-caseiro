import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope/800ExtraBold";
import {
  BrandProvider,
  ThemeProvider,
  useFeature,
  useTheme,
  type ThemeMode,
} from "@lucro-caseiro/ui";
import { getActiveBrand } from "@lucro-caseiro/brands";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { useBirthdayNotifier } from "../features/clients/use-birthday-notifier";
import { useAppMetrics } from "../features/analytics/use-app-metrics";
import { useScreenMetrics } from "../features/analytics/use-screen-metrics";
import { useDeliveryNotifier } from "../features/orders/use-delivery-notifier";
import { useLowStockNotifier } from "../features/products/use-low-stock-notifier";
import { useFiadoNotifier } from "../features/sales/use-fiado-notifier";
import { useDailyReminderNotifier } from "../shared/hooks/use-daily-reminder-notifier";
import { useNotificationPrefs } from "../shared/hooks/notification-prefs";
import { useThemePref } from "../shared/hooks/theme-pref";
import { useWeeklySummaryNotifier } from "../shared/hooks/use-weekly-summary-notifier";
import { AlertHost } from "../shared/components/alert-host";
import { BrandIntro } from "../shared/components/brand-intro";
import { DesktopShell } from "../shared/components/desktop-shell";
import { MobileFloatingTabBar } from "../shared/components/mobile-floating-tab-bar";
import { ResponsiveModal } from "../shared/components/responsive-modal-surface";
import { OfflineBanner } from "../shared/components/offline-banner";
import { ToastHost } from "../shared/components/toast";
import { useAuth } from "../shared/hooks/use-auth";
import { useNotifications } from "../shared/hooks/use-notifications";
import { setupAutoSync } from "../shared/hooks/use-offline-queue";
import { usePaywall } from "../shared/hooks/use-paywall";
import { usePremiumSuccess } from "../shared/hooks/use-premium-success";
import {
  floatingTabBarReserve,
  mobileTabBarSafeInset,
} from "../shared/layout/floating-tab-bar";
import { shouldShowMobileTabBar } from "../shared/layout/mobile-tab-bar";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { preloadStaticImageAssets } from "../shared/static-image-assets";
import { SubscriptionCheckout } from "../features/subscription/components/subscription-checkout";
import { PremiumSuccess } from "../features/subscription/components/premium-success";
import { getPaywallRecommendedTier } from "../features/subscription/limit-copy";
import { activePlan, useProfile } from "../features/subscription/hooks";

const activeBrand = getActiveBrand();

function AppContent() {
  const { theme } = useTheme();
  const hasStock = useFeature("estoque");
  const hasScheduling = useFeature("agendamento");
  const isDesktop = useDesktopLayout();
  const segments = useSegments();
  const rootSegment = String(segments[0] ?? "");
  const showDesktopShell =
    isDesktop &&
    rootSegment !== "" &&
    rootSegment !== "(auth)" &&
    rootSegment !== "onboarding" &&
    rootSegment !== "reset-password" &&
    rootSegment !== "c";
  const { initialize, isLoading, token, userId, passwordRecovery, isAuthenticated } =
    useAuth();
  const insets = useSafeAreaInsets();
  const showMobileNav = shouldShowMobileTabBar({
    isDesktop,
    isAuthenticated,
    rootSegment,
  });
  const stackTabBarReserve =
    showMobileNav && rootSegment !== "tabs"
      ? floatingTabBarReserve(mobileTabBarSafeInset(insets.bottom))
      : 0;
  const router = useRouter();
  const {
    visible: paywallVisible,
    hide: hidePaywall,
    resource: paywallResource,
    recommendedTier: paywallRecommendedTier,
  } = usePaywall();
  const { data: profile } = useProfile();
  const {
    visible: successVisible,
    show: showPremiumSuccess,
    hide: hidePremiumSuccess,
  } = usePremiumSuccess();
  const [introDone, setIntroDone] = useState(false);
  const [staticAssetsReady, setStaticAssetsReady] = useState(false);

  const canUsePremiumNotifications =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "premiumNotifications");
  const requiredPaywallTier =
    paywallRecommendedTier ?? getPaywallRecommendedTier(paywallResource);
  const currentPlan = activePlan(profile);
  const hasRequiredPaywallPlan =
    currentPlan === "professional" ||
    (requiredPaywallTier === "essential" && currentPlan === "essential");

  // Registers for push notifications once the user is authenticated.
  useNotifications();

  // Funil de produto: instalação observada + um dia ativo, sem bloquear o boot.
  useAppMetrics();
  useScreenMetrics();

  // Carrega as preferências de notificação salvas no aparelho (uma vez).
  useEffect(() => {
    void useNotificationPrefs.getState().hydrate();
  }, []);

  // Free: estoque baixo + fiado parado (respeitam a preferência do usuário).
  useLowStockNotifier(hasStock);
  useFiadoNotifier();

  // Entregas próximas na agenda (respeita a preferência "Lembretes de entrega").
  useDeliveryNotifier(hasScheduling);

  // Premium: aniversário de cliente, lembrete diário e resumo semanal.
  useBirthdayNotifier(canUsePremiumNotifications);
  useDailyReminderNotifier(canUsePremiumNotifications);
  useWeeklySummaryNotifier(canUsePremiumNotifications);

  useEffect(() => {
    if (hasRequiredPaywallPlan && paywallVisible) {
      hidePaywall();
    }
  }, [hasRequiredPaywallPlan, hidePaywall, paywallVisible]);

  // Comemora quando o plano vira pago (cobre Google Play e Stripe).
  // Guarda o plano inicial para não comemorar quem já abre o app pagante.
  const prevPlan = useRef<string | undefined>(undefined);
  useEffect(() => {
    const plan = profile?.plan;
    if (!plan) return;
    if (prevPlan.current === undefined) {
      prevPlan.current = plan;
      return;
    }
    if (prevPlan.current === "free" && plan !== "free") {
      showPremiumSuccess();
    }
    prevPlan.current = plan;
  }, [profile?.plan, showPremiumSuccess]);

  useEffect(() => {
    void initialize();
  }, []);

  useEffect(() => {
    let mounted = true;
    const fallback = setTimeout(() => {
      if (mounted) setStaticAssetsReady(true);
    }, 3_000);

    void preloadStaticImageAssets().finally(() => {
      clearTimeout(fallback);
      if (mounted) setStaticAssetsReady(true);
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
    };
  }, []);

  // Link de recuperação de senha → abre a tela de "criar nova senha" (sobrepõe
  // o roteamento normal de auth). Só navega com o app já montado (introDone).
  useEffect(() => {
    if (passwordRecovery && introDone) {
      router.replace("/reset-password");
    }
  }, [passwordRecovery, introDone, router]);

  // Auto-sync offline queue when connection is restored. Apos sincronizar,
  // invalida o cache para listas/resumos refletirem as vendas enviadas.
  const appQueryClient = useQueryClient();
  useEffect(() => {
    return setupAutoSync(
      () => token,
      () => {
        void appQueryClient.invalidateQueries();
      },
    );
  }, [token, appQueryClient]);

  // Ao voltar para o app (ex.: depois de pagar na loja ou no checkout externo),
  // revalida o plano para o botão de upgrade sumir e a comemoração disparar
  // assim que a assinatura é confirmada no backend.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && token) {
        void appQueryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    });
    return () => sub.remove();
  }, [token, appQueryClient]);

  // Ao trocar de conta (ou sair), descarta o cache da conta anterior. Sem isso,
  // o React Query (gcTime infinito) continua servindo dados do usuario antigo
  // ate o app ser reaberto. Tambem reseta o "comemorar premium" para nao
  // parabenizar quem acabou de entrar numa conta que ja era Premium.
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    if (prevUserId.current !== null && prevUserId.current !== userId) {
      appQueryClient.clear();
      prevPlan.current = undefined;
    }
    prevUserId.current = userId;
  }, [userId, appQueryClient]);

  // Abertura da marca: visivel durante o initialize() da auth, some quando a
  // sessao e as imagens estao prontas (e apos o tempo minimo de exibicao).
  if (!introDone) {
    return (
      <BrandIntro
        authReady={!isLoading && staticAssetsReady}
        onFinish={() => setIntroDone(true)}
      />
    );
  }

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <ToastHost />
      <AlertHost />
      <PremiumSuccess visible={successVisible} onClose={hidePremiumSuccess} />
      {paywallVisible ? (
        <ResponsiveModal
          desktopMaxWidth={1120}
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={hidePaywall}
        >
          <SubscriptionCheckout
            recommendedTier={requiredPaywallTier}
            onClose={hidePaywall}
          />
        </ResponsiveModal>
      ) : null}
      <DesktopShell enabled={showDesktopShell}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: theme.colors.background,
              paddingBottom: stackTabBarReserve,
            },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="tabs"
            options={{
              contentStyle: {
                backgroundColor: theme.colors.background,
                paddingBottom: 0,
              },
            }}
          />
          <Stack.Screen
            name="operations"
            options={{
              headerShown: false,
              title: activeBrand.vertical.operationLabel,
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="lucro-apps"
            options={{
              headerShown: false,
              title: "Conheça também",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="agenda"
            options={{
              headerShown: !showDesktopShell,
              title: "Agenda",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="materials"
            options={{
              headerShown: !showDesktopShell,
              title: "Insumos",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="buy-materials"
            options={{
              headerShown: !showDesktopShell,
              title: "Comprar insumos",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="finance"
            options={{
              headerShown: !showDesktopShell,
              title: "Financeiro",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="quotes"
            options={{
              headerShown: !showDesktopShell,
              title: "Orçamentos",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="catalog"
            options={{
              headerShown: !showDesktopShell,
              title: "Catálogo online",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="fiado"
            options={{
              headerShown: !showDesktopShell,
              title: "Fiado",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="insights"
            options={{
              headerShown: !showDesktopShell,
              title: "Insights",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="products"
            options={{
              headerShown: !showDesktopShell,
              title: "Produtos",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="services"
            options={{
              headerShown: !showDesktopShell,
              title: "Serviços",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="recipes"
            options={{
              headerShown: !showDesktopShell,
              title: "Receitas",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="pricing"
            options={{
              headerShown: !showDesktopShell,
              title: "Precificação",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="pricing-complete"
            options={{
              headerShown: !showDesktopShell,
              title: "Precificação completa",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="plans"
            options={{
              headerShown: !showDesktopShell,
              title: "Planos",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="labels"
            options={{
              headerShown: !showDesktopShell,
              title: "Etiquetas",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="packaging"
            options={{
              headerShown: !showDesktopShell,
              title: "Embalagens",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: !showDesktopShell,
              title: "Configurações",
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.text,
            }}
          />
        </Stack>
      </DesktopShell>
      <MobileFloatingTabBar />
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: Infinity,
            staleTime: 5 * 60 * 1000,
            networkMode: "offlineFirst",
            retry: 3,
          },
          mutations: {
            networkMode: "offlineFirst",
            retry: 3,
          },
        },
      }),
  );

  // Tema salvo no aparelho: hidrata antes de montar o ThemeProvider para não
  // montar com o modo errado e trocar depois (flash). Default = segue o sistema.
  const themeLoaded = useThemePref((s) => s.loaded);
  const storedMode = useThemePref((s) => s.mode);
  const systemScheme = useColorScheme();
  const [bootstrapTimedOut, setBootstrapTimedOut] = useState(false);
  useEffect(() => {
    void useThemePref.getState().hydrate();
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => setBootstrapTimedOut(true), 3_000);
    return () => clearTimeout(timeout);
  }, []);

  // Familia oficial (ADR-0008): os nomes batem com o token `fonts` do
  // @lucro-caseiro/ui. Segura o mount até carregar pra nao piscar fonte de
  // sistema (o BrandIntro cobre a espera logo em seguida).
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Preferencias ou fontes indisponiveis nao podem manter o app inteiro em
  // branco. Depois do limite, monta com tema/fonte do sistema e atualiza quando
  // a hidratacao terminar.
  if (!bootstrapTimedOut && (!themeLoaded || (!fontsLoaded && !fontError))) return null;

  const initialMode: ThemeMode =
    storedMode ?? (systemScheme === "light" ? "light" : "dark");

  return (
    <SafeAreaProvider>
      <ThemeProvider
        brand={activeBrand}
        initialMode={initialMode}
        onModeChange={(m) => useThemePref.getState().setMode(m)}
      >
        <BrandProvider brand={activeBrand}>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </BrandProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
