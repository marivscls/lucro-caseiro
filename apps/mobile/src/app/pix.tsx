import { Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { PixSettingsForm } from "../features/pix/components/pix-settings-form";
import { chargePix, hasPixKey, maskedPixKey } from "../features/pix/domain";
import { usePixSettings } from "../features/pix/hooks";
import { useProfile } from "../features/subscription/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { SkeletonList } from "../shared/components/skeleton";
import { ToolPage } from "../shared/layout/tool-page";
import { formatCurrency } from "../shared/utils/format";

const STEPS: { icon: AppIconName; text: string }[] = [
  { icon: "cash-outline", text: "Na cobrança do fiado, com o valor exato em aberto." },
  {
    icon: "receipt-outline",
    text: "No recibo de uma venda que ficou para pagar depois.",
  },
  {
    icon: "document-text-outline",
    text: "No orçamento, para a pessoa confirmar pagando.",
  },
];

export default function PixScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { data: settings, isLoading } = usePixSettings();
  const { data: profile } = useProfile();
  const ready = hasPixKey(settings);
  const example = chargePix(settings, profile, 42.5);

  return (
    <ToolPage
      title="Receber no Pix"
      subtitle="Sua chave vai junto de cada cobrança, com o valor já preenchido"
    >
      <Card
        variant="transparent"
        padding="xl"
        style={{ backgroundColor: palette.wineFill, gap: spacing.md, borderRadius: 22 }}
      >
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: palette.lime,
            borderRadius: 999,
            paddingHorizontal: spacing.md,
            paddingVertical: 4,
          }}
        >
          <Typography variant="captionBold" color={palette.onLime}>
            {ready ? "Pix ligado" : "Sem taxa do app, direto na sua conta"}
          </Typography>
        </View>
        <Typography variant="h2" color="#FFFFFF">
          {ready
            ? `Chave ${maskedPixKey(settings)}`
            : "Cliente paga em 2 toques, sem digitar valor"}
        </Typography>
        <Typography variant="body" color="#F2D9DE">
          O app monta o Pix copia e cola com o valor certo. O dinheiro cai na sua conta,
          sem intermediário. Quando receber, é só marcar a venda como paga.
        </Typography>
      </Card>

      {isLoading ? <SkeletonList rows={2} /> : <PixSettingsForm settings={settings} />}

      <View style={{ gap: spacing.md }}>
        <Typography variant="h3">Onde o Pix aparece</Typography>
        {STEPS.map((step) => (
          <View
            key={step.text}
            style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
          >
            <AppIcon name={step.icon} size={20} color={theme.colors.textSecondary} />
            <Typography variant="body" style={{ flex: 1 }}>
              {step.text}
            </Typography>
          </View>
        ))}
      </View>

      {example ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold">
            Exemplo de Pix de {formatCurrency(42.5)}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary} selectable>
            {example}
          </Typography>
        </Card>
      ) : null}
    </ToolPage>
  );
}
