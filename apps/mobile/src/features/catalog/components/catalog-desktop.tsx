/**
 * Peças do Catálogo no desktop (web >= 1024px). Estado e regras continuam em
 * `app/catalog.tsx`; aqui só a apresentação da lateral "Sua vitrine":
 * contadores legíveis, link, ação principal e atalhos com largura da lateral.
 */
import {
  Button,
  IconButton,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { DesktopCard } from "../../../shared/layout/desktop-page";

function Count({
  value,
  label,
  highlighted = false,
  first = false,
}: Readonly<{
  value: number | null;
  label: string;
  highlighted?: boolean;
  first?: boolean;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${value ?? "—"} ${label}`}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.colors.border,
      }}
    >
      {highlighted ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: radii.full,
            backgroundColor: colors.limeText,
          }}
        />
      ) : null}
      <Typography variant="desktopBody" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Typography>
      <Typography
        variant="desktopBodyStrong"
        color={colors.ink}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value ?? "—"}
      </Typography>
    </View>
  );
}

export function CatalogDesktopShareCard({
  productCount,
  serviceCount,
  publishedCount,
  catalogUrl,
  primaryLabel,
  primaryIcon,
  onPrimary,
  readinessMessage,
  shareAnyway,
  onShare,
  enabled,
  onPreview,
  onCopy,
}: Readonly<{
  productCount: number | null;
  serviceCount: number | null;
  publishedCount: number | null;
  catalogUrl: string;
  primaryLabel: string;
  primaryIcon: AppIconName;
  onPrimary: () => void;
  readinessMessage: string;
  shareAnyway: boolean;
  onShare: () => void;
  enabled: boolean;
  onPreview: () => void;
  onCopy: () => void;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  return (
    <DesktopCard>
      <Typography variant="desktopCardTitle" accessibilityRole="header">
        Sua vitrine
      </Typography>
      <View>
        <Count value={productCount} label="Produtos" first />
        <Count value={serviceCount} label="Serviços" />
        <Count value={publishedCount} label="Publicados na vitrine" highlighted />
      </View>
      <View style={{ gap: spacing.sm }}>
        <Typography variant="desktopFieldLabel">Seu link da vitrine</Typography>
        <View
          style={{
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            backgroundColor: theme.colors.background,
            paddingLeft: spacing.md,
            paddingRight: spacing.xs,
          }}
        >
          <AppIcon name="link-outline" size={20} color={theme.colors.primaryStrong} />
          <Typography
            variant="desktopBody"
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{ flex: 1, minWidth: 0 }}
          >
            {catalogUrl.replace(/^https?:\/\//, "")}
          </Typography>
          <IconButton
            size={44}
            onPress={onCopy}
            accessibilityLabel="Copiar link da vitrine"
            icon={
              <AppIcon
                name="clipboard-outline"
                size={20}
                color={theme.colors.primaryStrong}
              />
            }
          />
        </View>
      </View>
      <Button
        title={primaryLabel}
        titleLines={2}
        size="lg"
        icon={<AppIcon name={primaryIcon} size={20} color={theme.colors.textOnPrimary} />}
        onPress={onPrimary}
        accessibilityLabel={primaryLabel}
        style={{ width: "100%", backgroundColor: theme.colors.primaryInteractive }}
      />
      <Typography variant="desktopMeta">{readinessMessage}</Typography>
      {shareAnyway ? (
        <Button
          title="Compartilhar link mesmo assim"
          variant="outline"
          onPress={onShare}
          style={{ width: "100%" }}
        />
      ) : null}
      <Button
        title="Ver como cliente"
        variant="outline"
        disabled={!enabled}
        icon={<AppIcon name="eye-outline" size={18} color={colors.wine} />}
        onPress={onPreview}
        style={{ width: "100%", minHeight: 48 }}
      />
    </DesktopCard>
  );
}

/** Convite ao Essencial na lateral (sem faixa colorida lateral). */
export function CatalogDesktopUpsell({ onPress }: Readonly<{ onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Conhecer o Essencial para mostrar o catálogo completo"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        backgroundColor: theme.colors.premiumBg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hovered ? theme.colors.premium : "transparent",
        padding: spacing.xl,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <AppIcon name="diamond-outline" size={24} color={theme.colors.premium} />
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="desktopBodyStrong">
          Seu catálogo mostra até 3 produtos
        </Typography>
        <Typography variant="desktopMeta" color={theme.colors.text}>
          Mostre seu catálogo completo e personalize as cores no Essencial.
        </Typography>
      </View>
      <AppIcon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}
