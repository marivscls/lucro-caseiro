import { ThemeProvider, useTheme } from "@lucro-caseiro/ui";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Modal, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useBirthdayNotifier } from "../features/clients/use-birthday-notifier";
import { useDeliveryNotifier } from "../features/orders/use-delivery-notifier";
import { useLowStockNotifier } from "../features/products/use-low-stock-notifier";
import { useFiadoNotifier } from "../features/sales/use-fiado-notifier";
import { useDailyReminderNotifier } from "../shared/hooks/use-daily-reminder-notifier";
import { useNotificationPrefs } from "../shared/hooks/notification-prefs";
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
import { useProfile } from "../features/subscription/hooks";
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
  const { initialize, isLoading, token, userId } = useAuth();
  const {
    visible: paywallVisible,
    hide: hidePaywall,
    resource: paywallResource,
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

  const isPremium = profile?.plan === "premium";

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

  // Comemora quando o plano vira Premium (cobre Google Play e Stripe).
  // Guarda o plano inicial para não comemorar quem já abre o app como Premium.
  const prevPlan = useRef<string | undefined>(undefined);
  useEffect(() => {
    const plan = profile?.plan;
    if (!plan) return;
    if (prevPlan.current === undefined) {
      prevPlan.current = plan;
      return;
    }
    if (prevPlan.current !== "premium" && plan === "premium") {
      showPremiumSuccess();
    }
    prevPlan.current = plan;
  }, [profile?.plan, showPremiumSuccess]);

  useEffect(() => {
    void initialize();
  }, []);

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
      <StatusBar style="light" />
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
          onClose={hidePaywall}
          onSubscribe={(period) => {
            // Android must use Google Play Billing (Play Store policy);
            // iOS/Web use hosted Stripe Checkout.
            if (Platform.OS === "android") {
              void subscribe(period);
            } else {
              void payWithStripe(period);
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

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
