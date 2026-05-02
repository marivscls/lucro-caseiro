import { ThemeProvider, useTheme } from "@lucro-caseiro/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, View } from "react-native";

import { OfflineBanner } from "../shared/components/offline-banner";
import { useAuth } from "../shared/hooks/use-auth";
import { useNotifications } from "../shared/hooks/use-notifications";
import { setupAutoSync } from "../shared/hooks/use-offline-queue";
import { usePaywall } from "../shared/hooks/use-paywall";
import { Paywall } from "../features/subscription/components/paywall";

function AppContent() {
  const { theme } = useTheme();
  const { initialize, isLoading, token } = useAuth();
  const { visible: paywallVisible, hide: hidePaywall } = usePaywall();

  // Registers for push notifications once the user is authenticated.
  useNotifications();

  useEffect(() => {
    void initialize();
  }, []);

  // Auto-sync offline queue when connection is restored.
  useEffect(() => {
    return setupAutoSync(() => token);
  }, [token]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <OfflineBanner />
      <Modal
        visible={paywallVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={hidePaywall}
      >
        <Paywall onClose={hidePaywall} />
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
          name="finance"
          options={{
            headerShown: true,
            title: "Financeiro",
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
            title: "Precificacao",
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
            title: "Rotulos",
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
            title: "Configuracoes",
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
    <ThemeProvider initialMode="dark">
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
