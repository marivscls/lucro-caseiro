import React, { useEffect } from "react";
import { View } from "react-native";
import { Button, Card, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";

import { AppIcon } from "../../../shared/components/app-icon";
import { useAuth } from "../../../shared/hooks/use-auth";
import { formatCurrency } from "../../../shared/utils/format";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { PAID_PREVIEWS, type PaidPreviewScreen } from "../domain";

/**
 * No lugar do bloqueio, mostra um exemplo com dados fictícios do que a tela paga
 * entrega. O acesso continua decidido pelo plano; aqui nada chama a API paga.
 */
export function PaidPreview({
  screen,
  onUnlock,
}: Readonly<{ screen: PaidPreviewScreen; onUnlock: () => void }>) {
  const { theme } = useTheme();
  const preview = PAID_PREVIEWS[screen];

  useEffect(() => {
    void trackAnalyticsAction("paid_preview_viewed", useAuth.getState().token, {
      screen,
    });
  }, [screen]);

  function unlock() {
    void trackAnalyticsAction("paid_preview_unlock", useAuth.getState().token, {
      screen,
    });
    onUnlock();
  }

  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
      <View
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.full,
          backgroundColor: theme.colors.primaryBg,
        }}
      >
        <AppIcon name="eye-outline" size={16} color={theme.colors.primaryStrong} />
        <Typography variant="captionBold" color={theme.colors.primaryStrong}>
          Exemplo
        </Typography>
      </View>
      <Typography variant="h3">{preview.title}</Typography>
      <Typography variant="body" color={theme.colors.textSecondary}>
        {preview.description}
      </Typography>

      <View
        accessibilityLabel={`Exemplo de ${preview.title}`}
        style={{
          borderRadius: radii.md,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: theme.colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        {preview.rows.map((row) => (
          <View
            key={row.label}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="bodyBold">{row.label}</Typography>
              {row.detail ? (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {row.detail}
                </Typography>
              ) : null}
            </View>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {row.amount !== undefined ? formatCurrency(row.amount) : row.value}
            </Typography>
          </View>
        ))}
      </View>

      <Typography variant="caption" color={theme.colors.textSecondary}>
        Exemplo com dados fictícios. No Premium, aparecem os seus números.
      </Typography>
      <Button
        title="Desbloquear no Premium"
        size="lg"
        icon={
          <AppIcon
            name="lock-open-outline"
            size={20}
            color={theme.colors.textOnPrimary}
          />
        }
        onPress={unlock}
      />
    </Card>
  );
}
