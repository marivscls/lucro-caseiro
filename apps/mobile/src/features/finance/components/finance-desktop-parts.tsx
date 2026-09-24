/**
 * Peças de apresentação do Financeiro no desktop (web >= 1024px). Sem estado
 * de negócio: tudo chega por props de `finance-dashboard.tsx`.
 */
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  View,
  type ViewStyle,
} from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { desktopCardStyle } from "../../../shared/layout/desktop-page";

const NOWRAP =
  Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as unknown as ViewStyle) : undefined;

export type SegmentOption<T extends string> = Readonly<{
  value: T;
  label: string;
  count?: number;
  accessibilityLabel?: string;
}>;

/**
 * Controle segmentado de 48px (16px de texto). Substitui os chips de 12px
 * no desktop para período e filtro de tipo.
 */
export function DesktopSegmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Readonly<{
  options: readonly SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: radii.lg,
        backgroundColor: pal.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignSelf: "flex-start",
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel}
            onPress={() => onChange(option.value)}
            style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
              {
                minHeight: 44,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: selected ? pal.white : "transparent",
                borderWidth: 1,
                borderColor: selected ? theme.colors.border : "transparent",
              },
              !selected && hovered ? { backgroundColor: theme.colors.background } : null,
            ]}
          >
            <Typography
              variant="desktopBodyStrong"
              color={selected ? pal.wine : theme.colors.textSecondary}
              style={NOWRAP}
            >
              {option.label}
            </Typography>
            {option.count !== undefined ? (
              <Typography
                variant="desktopMeta"
                color={selected ? pal.wine : theme.colors.textSecondary}
              >
                {option.count}
              </Typography>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Navegação de mês compacta: ‹ Setembro 2026 ›. */
export function DesktopMonthStepper({
  label,
  onPrev,
  onNext,
  onOpenPicker,
}: Readonly<{
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const arrow = (
    icon: AppIconName,
    accessibilityLabel: string,
    onPress: () => void,
  ): ReactNode => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({
        width: 44,
        height: 44,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hovered ? pal.surface : "transparent",
      })}
    >
      <AppIcon name={icon} size={22} color={theme.colors.text} />
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pal.white,
      }}
    >
      {arrow("chevron-back", "Mês anterior", onPrev)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Escolher mês, ${label}`}
        onPress={onOpenPicker}
        style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({
          minHeight: 44,
          minWidth: 180,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          backgroundColor: hovered ? pal.surface : "transparent",
        })}
      >
        <AppIcon name="calendar-outline" size={20} color={theme.colors.textSecondary} />
        <Typography variant="desktopBodyStrong" style={NOWRAP}>
          {label}
        </Typography>
      </Pressable>
      {arrow("chevron-forward", "Próximo mês", onNext)}
    </View>
  );
}

/** Valor do painel vinho que abre a lista filtrada (Entradas / Saídas). */
export function HeroFlowButton({
  label,
  value,
  caption,
  icon,
  onPress,
  accessibilityLabel,
}: Readonly<{
  label: string;
  value: string;
  caption: string;
  icon: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
}>) {
  const pal = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => ({
        flex: 1,
        minWidth: 0,
        gap: 2,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hovered ? pal.onWineMuted : pal.wineDivider,
        backgroundColor: hovered || pressed ? "rgba(255,255,255,0.06)" : "transparent",
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name={icon} size={18} color={pal.onWineMuted} strokeWidth={2} />
        <Typography variant="desktopMetricLabel" color={pal.onWineMuted}>
          {label}
        </Typography>
        <View style={{ flex: 1 }} />
        <AppIcon name="chevron-forward" size={18} color={pal.onWineMuted} />
      </View>
      <Typography
        variant="desktopMetric"
        color={pal.onWine}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Typography>
      <Typography variant="desktopMeta" color={pal.onWineMuted}>
        {caption}
      </Typography>
    </Pressable>
  );
}

/** Cartão da lateral com título de 18px e ação opcional à direita. */
export function AsideCard({
  title,
  right,
  children,
  style,
}: Readonly<{
  title: string;
  right?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        desktopCardStyle(theme, { padding: spacing.xl }),
        { gap: spacing.lg },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Typography
          variant="desktopCardTitle"
          accessibilityRole="header"
          style={{ flex: 1, minWidth: 0 }}
        >
          {title}
        </Typography>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Barra de comparação: rótulo e valor em 16px, trilho de 10px. */
export function DesktopFlowBar({
  label,
  value,
  percent,
  color,
}: Readonly<{ label: string; value: string; percent: number; color: string }>) {
  const pal = useBrandScreenPalette();
  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}
      >
        <Typography variant="desktopBody">{label}</Typography>
        <Typography variant="desktopBodyStrong" style={NOWRAP}>
          {value}
        </Typography>
      </View>
      <View
        style={{
          height: 10,
          borderRadius: radii.full,
          backgroundColor: pal.surface,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, percent))}%`,
            borderRadius: radii.full,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/** Linha clicável de pendência na lateral (ícone, texto, seta). */
export function AttentionRow({
  icon,
  title,
  detail,
  tone = "neutral",
  onPress,
  actionLabel,
}: Readonly<{
  icon: AppIconName;
  title: string;
  detail?: string;
  tone?: "neutral" | "alert";
  onPress: () => void;
  actionLabel?: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const fg = tone === "alert" ? theme.colors.alert : pal.wine;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionLabel ? `${actionLabel}: ${title}` : title}
      onPress={onPress}
      style={({ hovered, pressed }: { pressed: boolean; hovered?: boolean }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 56,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginHorizontal: -spacing.sm,
        borderRadius: radii.md,
        backgroundColor: hovered || pressed ? pal.surface : "transparent",
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tone === "alert" ? theme.colors.alertBg : pal.softRose,
        }}
      >
        <AppIcon name={icon} size={20} color={fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="desktopBodyStrong" color={tone === "alert" ? fg : undefined}>
          {title}
        </Typography>
        {detail ? <Typography variant="desktopMeta">{detail}</Typography> : null}
      </View>
      {actionLabel ? (
        <Typography variant="desktopMeta" color={fg} style={{ fontWeight: "700" }}>
          {actionLabel}
        </Typography>
      ) : (
        <AppIcon name="chevron-forward" size={18} color={fg} />
      )}
    </Pressable>
  );
}

/** Botão de exportação da lateral (PDF / Excel). */
export function DesktopExportButton({
  icon,
  label,
  loading,
  disabled,
  onPress,
}: Readonly<{
  icon: AppIconName;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Exportar ${label}`}
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered }: { pressed: boolean; hovered?: boolean }) => ({
        flex: 1,
        minHeight: 48,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor:
          hovered && !disabled ? theme.colors.textSecondary : theme.colors.border,
        backgroundColor: pal.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        opacity: disabled && !loading ? 0.55 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={pal.rose} />
      ) : (
        <>
          <AppIcon name={icon} size={20} color={pal.wine} />
          <Typography variant="desktopBodyStrong">{label}</Typography>
        </>
      )}
    </Pressable>
  );
}

/** Estado vazio em cartão tracejado, na coluna. */
export function DesktopEmptyCard({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children?: ReactNode }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: theme.colors.border,
        borderRadius: radii.lg,
        paddingVertical: spacing["3xl"],
        paddingHorizontal: spacing["2xl"],
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <Typography variant="desktopCardTitle" style={{ textAlign: "center" }}>
        {title}
      </Typography>
      <Typography variant="desktopBody" style={{ textAlign: "center", maxWidth: 520 }}>
        {description}
      </Typography>
      {children ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: spacing.md,
            marginTop: spacing.md,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

/** Selo pequeno de tipo/categoria em 14px. */
export function DesktopTag({
  label,
  tone = "neutral",
}: Readonly<{ label: string; tone?: "neutral" | "income" | "expense" }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const colorsByTone: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: pal.surface, fg: theme.colors.textSecondary },
    income: { bg: theme.colors.successBg, fg: theme.colors.success },
    expense: { bg: theme.colors.alertBg, fg: theme.colors.alert },
  };
  const c = colorsByTone[tone];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: radii.sm,
        backgroundColor: c.bg,
      }}
    >
      <Typography variant="desktopMeta" color={c.fg} style={NOWRAP}>
        {label}
      </Typography>
    </View>
  );
}
