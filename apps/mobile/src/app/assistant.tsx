import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

import { SaleVoiceCard } from "../features/assistant/components/sale-voice-card";
import { usageExhausted, usageLabel } from "../features/assistant/domain";
import { useAssistantUsage } from "../features/assistant/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { ToolPage } from "../shared/layout/tool-page";

export default function AssistantScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const { falar } = useLocalSearchParams<{ falar?: string }>();
  const { data: usage } = useAssistantUsage();
  const exhausted = usageExhausted(usage);

  return (
    <ToolPage
      title="Anotar falando"
      subtitle="Fale ou escreva a venda: o app anota por você"
    >
      <Typography variant="bodyBold" color={palette.wine}>
        {usageLabel(usage)}
      </Typography>

      {exhausted ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
          <Typography variant="h3">
            {usage?.trial ? "Seus usos de teste acabaram" : "Você usou tudo deste mês"}
          </Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            {usage?.trial
              ? "Nos planos pagos você anota falando todo mês."
              : "No dia 1º os usos voltam."}
          </Typography>
          <Button title="Ver planos" onPress={() => router.push("/plans")} />
        </Card>
      ) : null}

      <SaleVoiceCard disabled={exhausted} autoStart={falar === "1"} />

      <Typography variant="caption" color={theme.colors.textSecondary}>
        Sempre confira antes de salvar: a leitura automática pode errar um nome ou um
        valor. O app não guarda os áudios: eles servem só para montar a anotação.
      </Typography>
    </ToolPage>
  );
}
