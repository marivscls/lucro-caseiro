import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { SaleVoiceCard } from "../features/assistant/components/sale-voice-card";
import { usageExhausted, usageLabel } from "../features/assistant/domain";
import { useAssistantUsage } from "../features/assistant/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { AppIcon } from "../shared/components/app-icon";
import { ToolPage } from "../shared/layout/tool-page";

export default function AssistantScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const { data: usage } = useAssistantUsage();
  const exhausted = usageExhausted(usage);

  return (
    <ToolPage
      title="Anotar falando"
      subtitle="Fale ou escreva a venda: o app anota por você"
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <AppIcon name="sparkles-outline" size={20} color={palette.wine} />
        <Typography variant="bodyBold" color={palette.wine} style={{ flex: 1 }}>
          {usageLabel(usage)}
        </Typography>
      </View>

      {exhausted ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
          <Typography variant="h3">Você usou tudo deste mês</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            No próximo mês os usos voltam. Nos planos pagos você anota muito mais vezes.
          </Typography>
          <Button title="Ver planos" onPress={() => router.push("/plans")} />
        </Card>
      ) : null}

      <SaleVoiceCard disabled={exhausted} />

      <Typography variant="caption" color={theme.colors.textSecondary}>
        Sempre confira antes de salvar: a leitura automática pode errar um nome ou um
        valor. O app não guarda os áudios: eles servem só para montar a anotação.
      </Typography>
    </ToolPage>
  );
}
