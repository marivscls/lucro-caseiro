import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useProfile } from "../features/subscription/hooks";
import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";
import { isNewAccount } from "../shared/utils/new-account";

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function Index() {
  const { isAuthenticated, userId, user } = useAuth();
  const { completed, completedUserIds } = useOnboarding();
  const hasHydrated = useOnboarding.persist.hasHydrated();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasHydrated) {
    return <Loading />;
  }

  // Onboarding ja concluido neste aparelho: na sessao atual (`completed`) ou em
  // sessao anterior por esta conta (`completedUserIds`, sobrevive ao relogin).
  if (completed || (userId && completedUserIds.includes(userId))) {
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

  // Sem nome de negocio salvo NAO significa conta nova: o campo e opcional no
  // cadastro. O onboarding so aparece para contas realmente recem-criadas
  // (created_at do Auth). Conta antiga sem nome de negocio = usuario retornando
  // (ex.: apos recuperar a senha) -> vai direto pro app.
  if (isNewAccount(user?.created_at, Date.now())) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/tabs" />;
}
