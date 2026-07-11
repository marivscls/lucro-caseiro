import { Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from "@expo-google-fonts/nunito-sans";
import { ThemeProvider, useTheme, type ThemeMode } from "@lucro-caseiro/ui";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Modal, Platform, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useBirthdayNotifier } from "../features/clients/use-birthday-notifier";
import { useDeliveryNotifier } from "../features/orders/use-delivery-notifier";
import { useLowStockNotifier } from "../features/products/use-low-stock-notifier";
import { useFiadoNotifier } from "../features/sales/use-fiado-notifier";
import { useDailyReminderNotifier } from "../shared/hooks/use-daily-reminder-notifier";
import { useNotificationPrefs } from "../shared/hooks/notification-prefs";
import { useThemePref } from "../shared/hooks/theme-pref";
import { useWeeklySummaryNotifier } from "../shared/hooks/use-weekly-summary-notifier";
import { AlertHost } from "../shared/components/alert-host";
import { BrandIntro } from "../shared/components/brand-intro";
import { OfflineBanner } from "../shared/components/offline-banner";
import { ToastHost } from "../shared/components/toast";
import { useAuth } from "../shared/hooks/use-auth";
import { useNotifications } from "../shared/hooks/use-notifications";
import { setupAutoSync } from "../shared/hooks/use-offline-queue";
import { usePaywall } from "../shared/hooks/use-paywall";
import { usePremiumSuccess } from "../shared/hooks/use-premium-success";
import { Paywall } from "../features/subscription/components/paywall";
import { PremiumSuccess } from "../features/subscription/components/premium-success";
import { getPaywallCopy } from "../features/subscription/limit-copy";
import { isProfilePremiumActive, useProfile } from "../features/subscription/hooks";
import { useSubscription } from "../features/subscription/use-subscription";
import { useStripeCheckout } from "../features/subscription/use-stripe";

// Dev/emulador: o react-native-iap falha ao iniciar a conexão quando não há Google
// Play billing (ex.: emulador) e loga via console.error, o que faz o LogBox abrir um
// overlay vermelho recorrente — atrapalhando o uso e travando os testes E2E. Filtra
// APENAS esse ruído conhecido do IAP, mantendo o LogBox para os demais erros.
// Só roda em dev: em produção `__DEV__` é false e o LogBox nem existe.
if (__DEV__) {
  const originalError = console.error.bind(console);
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === "string" && args[0].includes("[RN-IAP]")) return;
    originalError(...args);
  };
}

function AppContent() {
  const { theme } = useTheme();
  const { initialize, isLoading, token, userId, passwordRecovery } = useAuth();
  const router = useRouter();
  const {
    visible: paywallVisible,
    hide: hidePaywall,
    resource: paywallResource,
    recommendedTier: paywallRecommendedTier,
  } = usePaywall();
  const paywallCopy = getPaywallCopy(paywallResource);
  const { subscribe, restore, loading: subscriptionLoading } = useSubscription();
  const { checkout: payWithStripe, loading: stripeLoading } = useStripeCheckout();
  const { data: profile } = useProfile();
  const {
    visible: successVisible,
    show: showPremiumSuccess,
    hide: hidePremiumSuccess,
  } = usePremiumSuccess();
  const [introDone, setIntroDone] = useState(false);

  const isPremium = isProfilePremiumActive(profile);

  // Registers for push notifications once the user is authenticated.
  useNotifications();

  // Carrega as preferências de notificação salvas no aparelho (uma vez).
  useEffect(() => {
    void useNotificationPrefs.getState().hydrate();
  }, []);

  // Free: estoque baixo + fiado parado (respeitam a preferência do usuário).
  useLowStockNotifier();
  useFiadoNotifier();

  // Entregas próximas na agenda (respeita a preferência "Lembretes de entrega").
  useDeliveryNotifier();

  // Premium: aniversário de cliente, lembrete diário e resumo semanal.
  useBirthdayNotifier(isPremium);
  useDailyReminderNotifier(isPremium);
  useWeeklySummaryNotifier(isPremium);

  useEffect(() => {
    if (isPremium && paywallVisible) {
      hidePaywall();
    }
  }, [hidePaywall, isPremium, paywallVisible]);

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
  // sessao esta pronta (e apos o tempo minimo de exibicao).
  if (!introDone) {
    return <BrandIntro authReady={!isLoading} onFinish={() => setIntroDone(true)} />;
  }

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <OfflineBanner />
      <ToastHost />
      <AlertHost />
      <PremiumSuccess visible={successVisible} onClose={hidePremiumSuccess} />
      <Modal
        visible={paywallVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={hidePaywall}
      >
        <Paywall
          title={paywallCopy.title}
          message={paywallCopy.message}
          recommendedTier={
            paywallRecommendedTier ??
            (paywallResource &&
            ["sales", "clients", "products", "recipes", "packaging"].includes(
              paywallResource,
            )
              ? "essential"
              : "professional")
          }
          onClose={hidePaywall}
          onSubscribe={(tier, period) => {
            // Android must use Google Play Billing (Play Store policy);
            // iOS/Web use hosted Stripe Checkout.
            if (Platform.OS === "android") {
              void subscribe(tier, period);
            } else {
              void payWithStripe(tier, period);
            }
          }}
          onRestore={() => {
            void restore();
          }}
          loading={subscriptionLoading || stripeLoading}
        />
      </Modal>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="tabs" />
        <Stack.Screen
          name="agenda"
          options={{
            headerShown: true,
            title: "Agenda",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="materials"
          options={{
            headerShown: true,
            title: "Insumos",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="finance"
          options={{
            headerShown: true,
            title: "Financeiro",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="quotes"
          options={{
            headerShown: true,
            title: "Orçamentos",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="catalog"
          options={{
            headerShown: true,
            title: "Catálogo online",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="fiado"
          options={{
            headerShown: true,
            title: "Fiado",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="insights"
          options={{
            headerShown: true,
            title: "Insights",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="products"
          options={{
            headerShown: true,
            title: "Produtos",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="recipes"
          options={{
            headerShown: true,
            title: "Receitas",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="pricing"
          options={{
            headerShown: true,
            title: "Precificação",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="plans"
          options={{
            headerShown: true,
            title: "Planos",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="labels"
          options={{
            headerShown: true,
            title: "Rótulos",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="packaging"
          options={{
            headerShown: true,
            title: "Embalagens",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Configurações",
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
          }}
        />
      </Stack>
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
  useEffect(() => {
    void useThemePref.getState().hydrate();
  }, []);

  // Familias oficiais (ADR-0008): os nomes batem com o token `fonts` do
  // @lucro-caseiro/ui. Segura o mount até carregar pra nao piscar fonte de
  // sistema (o BrandIntro cobre a espera logo em seguida).
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  if (!themeLoaded || !fontsLoaded) return null;

  const initialMode: ThemeMode =
    storedMode ?? (systemScheme === "light" ? "light" : "dark");

  return (
    <SafeAreaProvider>
      <ThemeProvider
        initialMode={initialMode}
        onModeChange={(m) => useThemePref.getState().setMode(m)}
      >
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
