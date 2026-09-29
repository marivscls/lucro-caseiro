import {
  Button,
  Card,
  Typography,
  radii,
  spacing,
  useBrand,
  useTheme,
} from "@lucro-caseiro/ui";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { View } from "react-native";

import {
  claimProgress,
  cleanCode,
  inviteMessage,
  inviteUrl,
  invitedSummary,
} from "../features/referrals/domain";
import { useClaimReferral, useReferralSummary } from "../features/referrals/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { getBrandDisplayName } from "../shared/brand-name";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { FormField, TextField } from "../shared/components/form-field";
import { FormActions } from "../shared/components/form-layout";
import { SkeletonList } from "../shared/components/skeleton";
import { showToast } from "../shared/components/toast";
import { useFormValidation } from "../shared/hooks/use-form-validation";
import { ToolPage } from "../shared/layout/tool-page";
import { alertError, errorMessage } from "../shared/utils/alerts";
import { openWhatsAppShare } from "../shared/utils/whatsapp";

const HOW: { icon: AppIconName; text: string }[] = [
  {
    icon: "share-social-outline",
    text: "Mande seu convite para quem também vende em casa.",
  },
  { icon: "person-add-outline", text: "A pessoa cria a conta e digita o seu código." },
  {
    icon: "receipt-outline",
    text: "Quando essa pessoa registrar 3 vendas, vocês ganham.",
  },
  { icon: "gift-outline", text: "1 mês do plano Essencial para cada um, sem cartão." },
];

function ProgressBar({ done, total }: Readonly<{ done: number; total: number }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{
        height: 12,
        borderRadius: 999,
        backgroundColor: theme.colors.border,
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <View style={{ flex: done, backgroundColor: palette.rose }} />
      <View style={{ flex: Math.max(0, total - done) }} />
    </View>
  );
}

export default function ReferralsScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const brand = useBrand();
  const appName = getBrandDisplayName(brand);
  const { data: summary, isLoading } = useReferralSummary();
  const claim = useClaimReferral();
  const [code, setCode] = useState("");
  const validation = useFormValidation({
    code: cleanCode(code).length < 6 && "Digite o código que você recebeu.",
  });

  if (isLoading || !summary) {
    return (
      <ToolPage title="Indique e ganhe">
        <SkeletonList rows={3} />
      </ToolPage>
    );
  }

  const url = inviteUrl(brand, summary.code);
  const progress = claimProgress(summary);

  async function handleCopy() {
    await Clipboard.setStringAsync(summary!.code);
    showToast("Código copiado.");
  }

  async function handleClaim() {
    if (!validation.validate()) return;
    try {
      const next = await claim.mutateAsync(cleanCode(code));
      setCode("");
      showToast(
        next.rewarded
          ? "Convite aceito e prêmio liberado!"
          : "Convite aceito! Registre 3 vendas para liberar o prêmio.",
      );
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  return (
    <ToolPage
      title="Indique e ganhe"
      subtitle="Cada pessoa que você indicar e começar a vender com o app vale 1 mês grátis para vocês"
    >
      <Card
        variant="transparent"
        padding="xl"
        style={{ backgroundColor: palette.wineFill, gap: spacing.lg, borderRadius: 22 }}
      >
        <Typography variant="body" color="#F2D9DE">
          Seu código de convite
        </Typography>
        <Typography
          variant="display"
          color="#FFFFFF"
          selectable
          accessibilityLabel={`Seu código: ${summary.code.split("").join(" ")}`}
          style={{ letterSpacing: 4 }}
        >
          {summary.code}
        </Typography>
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
            {invitedSummary(summary)}
          </Typography>
        </View>
        <FormActions stack>
          <Button
            title="Copiar código"
            variant="outline"
            icon={<AppIcon name="copy-outline" size={20} color={palette.wine} />}
            onPress={() => void handleCopy()}
            style={{ backgroundColor: "#FFFFFF" }}
          />
          <Button
            title="Convidar no WhatsApp"
            icon={<AppIcon name="logo-whatsapp" size={20} color="#FFFFFF" />}
            onPress={() =>
              void openWhatsAppShare(inviteMessage(appName, summary.code, url))
            }
          />
        </FormActions>
      </Card>

      {progress ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
          <Typography variant="h3">
            Você entrou pelo convite de {summary.referredByName}
          </Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Registre {summary.requiredSales} vendas e o mês do Essencial chega para vocês.
          </Typography>
          <ProgressBar done={progress.done} total={progress.total} />
          <Typography variant="bodyBold" color={palette.wine}>
            {progress.label}
          </Typography>
        </Card>
      ) : null}

      {summary.rewarded && summary.referredByName ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
          <Typography variant="h3">Prêmio liberado 🎉</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Você e {summary.referredByName} ganharam {summary.rewardDays} dias do plano
            Essencial.
          </Typography>
        </Card>
      ) : null}

      {summary.canClaim ? (
        <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h3">Recebeu um convite?</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Digite o código de quem te indicou. Vale nos primeiros 14 dias da conta.
            </Typography>
          </View>
          <FormField label="Código de convite" validation={validation.field("code")}>
            <TextField
              icon="gift-outline"
              accessibilityLabel="Código de convite"
              placeholder="Ex: ANAB7K"
              value={code}
              onChangeText={(value) => setCode(value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={14}
            />
          </FormField>
          <FormActions>
            <Button
              title="Usar código"
              loading={claim.isPending}
              onPress={() => void handleClaim()}
            />
          </FormActions>
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Typography variant="h3">Como funciona</Typography>
        {HOW.map((step, index) => (
          <View
            key={step.text}
            style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: palette.softRose,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name={step.icon} size={20} color={palette.wine} />
            </View>
            <Typography variant="body" style={{ flex: 1 }}>
              {index + 1}. {step.text}
            </Typography>
          </View>
        ))}
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Quem já assina não perde nada: o prêmio vale para contas no plano grátis ou em
          teste, e soma com o teste que estiver ativo.
        </Typography>
      </View>
    </ToolPage>
  );
}
