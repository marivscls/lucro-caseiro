import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useProfile } from "../features/subscription/hooks";
import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function Index() {
  const { isAuthenticated } = useAuth();
  const { completed } = useOnboarding();
  const hasHydrated = useOnboarding.persist.hasHydrated();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasHydrated) {
    return <Loading />;
  }

  // Onboarding ja concluido neste aparelho.
  if (completed) {
    return <Redirect href="/tabs" />;
  }

  // Aparelho novo, mas a conta pode ja estar configurada (usuario retornando).
  // Espera o perfil pra decidir e evita mostrar onboarding pra quem ja tem conta.
  if (profileLoading) {
    return <Loading />;
  }
  if (profile?.businessName) {
    return <Redirect href="/tabs" />;
  }

  return <Redirect href="/onboarding" />;
}
