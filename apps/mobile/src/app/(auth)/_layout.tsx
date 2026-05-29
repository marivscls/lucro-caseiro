import { Redirect, Stack } from "expo-router";
import React from "react";

import { useAuth } from "../../shared/hooks/use-auth";

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  // Assim que a sessao e estabelecida (login por email/senha ou callback do
  // OAuth, que pode chegar via deep link de forma assincrona), sai das telas de
  // auth e deixa o index (/) decidir entre onboarding e tabs.
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
