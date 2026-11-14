import React, { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Href, useRouter } from "expo-router";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";

import { AppIcon } from "../../../shared/components/app-icon";
import { useAuth } from "../../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useDiscoveryStore } from "../store";

const VISIBLE_MS = 12_000;

/** Próximo passo sugerido depois de uma ação. Montado uma vez no _layout. */
export function NextStepHost() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const step = useDiscoveryStore((state) => state.banner);
  const hide = useDiscoveryStore((state) => state.hideBanner);

  useEffect(() => {
    if (!step) return;
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [step, hide]);

  if (!step) return null;

  function open() {
    if (!step) return;
    void trackAnalyticsAction("discovery_step_opened", useAuth.getState().token, {
      step: step.id,
    });
    hide();
    router.push(step.route as Href);
  }

  return (
    <View
      accessibilityRole="alert"
      style={{
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom: insets.bottom + 96,
        maxWidth: 480,
        alignSelf: "center",
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.sm,
        ...theme.shadows.md,
        // Montado antes das telas no _layout: precisa ficar por cima delas.
        zIndex: 1000,
        elevation: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name="sparkles-outline" size={20} color={theme.colors.primary} />
        <Typography variant="bodyBold" color={theme.colors.text} style={{ flex: 1 }}>
          {step.title}
        </Typography>
      </View>
      <Typography variant="body" color={theme.colors.textSecondary}>
        {step.message}
      </Typography>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        <Button title={step.action} onPress={open} style={{ flexGrow: 1 }} />
        <Button title="Agora não" variant="outline" onPress={hide} />
      </View>
    </View>
  );
}
