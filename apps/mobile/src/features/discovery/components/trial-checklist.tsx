import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import { type Href, useRouter } from "expo-router";
import {
  Button,
  Card,
  Typography,
  spacing,
  useFeature,
  useTheme,
} from "@lucro-caseiro/ui";

import { AppIcon } from "../../../shared/components/app-icon";
import { useAuth } from "../../../shared/hooks/use-auth";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { trialChecklist, type TrialChecklistItem } from "../domain";
import { useDiscoveryProgress, useDiscoveryStore } from "../store";

/**
 * Lista do teste grátis na tela inicial: o que o teste libera, com atalhos.
 * Some quando tudo foi feito ou quando a pessoa dispensa.
 */
export function TrialChecklist({
  recipes,
  trialEndLabel,
}: Readonly<{ recipes: number; trialEndLabel?: string }>) {
  const { theme } = useTheme();
  const router = useRouter();
  const recipesAvailable = useFeature("fichaTecnica");
  const { userId, ready, progress } = useDiscoveryProgress();
  const load = useDiscoveryStore((state) => state.load);
  const markOpened = useDiscoveryStore((state) => state.markOpened);
  const dismiss = useDiscoveryStore((state) => state.dismissChecklist);

  useEffect(() => {
    if (userId) void load(userId);
  }, [load, userId]);

  if (!userId || !ready || progress.checklistDismissed) return null;
  const items = trialChecklist({ recipes, opened: progress.opened, recipesAvailable });
  if (items.every((item) => item.done)) return null;

  function open(item: TrialChecklistItem) {
    if (!userId) return;
    markOpened(userId, item.id);
    void trackAnalyticsAction("trial_checklist_opened", useAuth.getState().token, {
      item: item.id,
    });
    router.push(item.route as Href);
  }

  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h3">Aproveite seu teste grátis</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          {trialEndLabel
            ? `Seu teste acaba ${trialEndLabel}. Experimente o que está liberado:`
            : "Experimente o que está liberado no seu teste:"}
        </Typography>
      </View>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityState={{ checked: item.done }}
          onPress={() => open(item)}
          style={({ pressed }) => ({
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppIcon
            name={item.done ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={item.done ? theme.colors.success : theme.colors.textSecondary}
          />
          <Typography
            variant="body"
            color={item.done ? theme.colors.textSecondary : theme.colors.text}
            style={{ flex: 1 }}
          >
            {item.label}
          </Typography>
          <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      ))}
      <Button
        title="Dispensar"
        variant="text"
        style={{ alignSelf: "flex-start" }}
        onPress={() => dismiss(userId)}
      />
    </Card>
  );
}
