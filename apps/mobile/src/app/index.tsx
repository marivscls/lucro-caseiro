import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../shared/hooks/use-auth";
import { useOnboarding } from "../shared/hooks/use-onboarding";

export default function Index() {
  const { isAuthenticated } = useAuth();
  const { completed } = useOnboarding();
  const hasHydrated = useOnboarding.persist.hasHydrated();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!completed) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/tabs" />;
}
