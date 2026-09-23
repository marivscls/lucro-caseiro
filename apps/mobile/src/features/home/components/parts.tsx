import type { Product, Sale } from "@lucro-caseiro/contracts";
import { Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { formatCurrency, formatIntBR } from "../../../shared/utils/format";
import { localDateKey, queryState } from "../domain";
import { styles } from "./styles";

export type Query<T> = { data: T | undefined; isError: boolean; refetch: () => unknown };
export type SalesPage = { items: Sale[] };
export type ProductsPage = { items: Product[] };

// ---------------------------------------------------------------------------
// Peças comuns
// ---------------------------------------------------------------------------

export function useHomeColors() {
  const { theme } = useTheme();
  const palette = useBrandScreenPalette();
  return {
    ...palette,
    text: palette.ink,
    strong: theme.colors.primaryStrong,
    action: theme.colors.primaryInteractive,
    onAction: theme.colors.textOnPrimary,
    green: theme.colors.success,
    greenBg: theme.colors.successBg,
    ringTrack: palette.border,
  };
}

export function T({
  style,
  color,
  children,
  ...props
}: Readonly<{
  style: StyleProp<TextStyle>;
  color?: string;
  children: React.ReactNode;
  numberOfLines?: number;
  accessibilityRole?: "header" | "text";
  accessibilityLabel?: string;
}>) {
  const colors = useHomeColors();
  return (
    <Text style={[{ color: colors.text }, style, color ? { color } : null]} {...props}>
      {children}
    </Text>
  );
}

export function HomeCard({
  children,
  style,
  soft = false,
}: Readonly<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
}>) {
  const colors = useHomeColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: soft ? colors.softRose : colors.white,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBox({
  name,
  size = 44,
  filled = false,
}: Readonly<{ name: AppIconName; size?: number; filled?: boolean }>) {
  const colors = useHomeColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: filled ? colors.wineFill : colors.softRose,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AppIcon name={name} size={22} color={filled ? colors.onWine : colors.wine} />
    </View>
  );
}

export function HomePrimaryButton({
  label,
  onPress,
  icon = "add",
  height = 56,
  style,
}: Readonly<{
  label: string;
  onPress: () => void;
  icon?: AppIconName | null;
  height?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useHomeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        {
          minHeight: height,
          backgroundColor: colors.action,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <AppIcon name={icon} size={22} color={colors.onAction} /> : null}
      <T style={styles.primaryLabel} color={colors.onAction}>
        {label}
      </T>
    </Pressable>
  );
}

export function GhostLink({
  label,
  onPress,
  small = false,
}: Readonly<{ label: string; onPress: () => void; small?: boolean }>) {
  const colors = useHomeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={small ? 6 : 0}
      style={({ pressed }) => [
        styles.ghost,
        { minHeight: small ? 40 : 48, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <T style={small ? styles.ghostSmall : styles.ghostLabel} color={colors.strong}>
        {label}
      </T>
      <AppIcon name="chevron-forward" size={18} color={colors.strong} />
    </Pressable>
  );
}

export function Link({
  label,
  onPress,
}: Readonly<{ label: string; onPress: () => void }>) {
  const colors = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        justifyContent: "center",
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Typography variant="homeLink" color={colors.wine}>
        {label}
      </Typography>
    </Pressable>
  );
}

export function HomeSection({
  title,
  children,
  action,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
}>) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.rowBetween}>
        <T style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </T>
        {action && <GhostLink {...action} small />}
      </View>
      {children}
    </View>
  );
}

export function QueryNotice<T>({
  query,
  label,
  light = false,
}: Readonly<{ query: Query<T>; label: string; light?: boolean }>) {
  const colors = useHomeColors();
  const state = queryState(query);
  if (state === "ready") return null;
  const messages = {
    loading: `Carregando ${label}…`,
    stale: `Não foi possível atualizar ${label}. Exibindo a última informação disponível.`,
    error: `Não foi possível carregar ${label}.`,
  };
  const color = light ? colors.onWineMuted : colors.muted;
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
      <T style={styles.caption} color={color}>
        {messages[state]}
      </T>
      {query.isError && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            query.refetch();
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <T style={styles.ghostLabel} color={light ? colors.onWine : colors.strong}>
            Tentar novamente: {label}
          </T>
        </Pressable>
      )}
    </View>
  );
}

/** Moeda sem quebra entre "R$" e o valor. */
export function money(value: number): string {
  return formatCurrency(value).replace("R$ ", "R$\u00A0");
}

/** Valor curto do destaque: sem centavos a partir de R$ 100. */
export function heroMoney(value: number): string {
  if (Math.abs(value) < 100) return money(value);
  const sign = value < 0 ? "-" : "";
  return `${sign}R$\u00A0${formatIntBR(Math.abs(value))}`;
}

export function Tile({
  label,
  value,
  tone = "text",
  compact = false,
  ghost = false,
  note,
}: Readonly<{
  label: string;
  value: string;
  tone?: "text" | "green";
  compact?: boolean;
  ghost?: boolean;
  note?: string;
}>) {
  const colors = useHomeColors();
  let color = colors.text;
  if (ghost) color = colors.muted;
  else if (tone === "green") color = colors.green;
  return (
    <View
      style={[
        styles.tile,
        compact
          ? {
              backgroundColor: colors.surface,
              paddingVertical: spacing.md,
              paddingHorizontal: 10,
            }
          : { backgroundColor: colors.surface, padding: 14 },
      ]}
    >
      <T style={styles.tileLabel} color={colors.muted}>
        {label}
      </T>
      <T
        style={
          compact
            ? [styles.tileValueCompact, value.length > 8 && styles.tileValueTight]
            : styles.tileValue
        }
        color={color}
      >
        {value}
      </T>
      {note ? (
        <T style={styles.tileNote} color={colors.muted}>
          {note}
        </T>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  pct,
  label,
  height = 12,
}: Readonly<{ pct: number; label: string; height?: number }>) {
  const colors = useHomeColors();
  const value = Math.round(Math.min(100, Math.max(0, pct)));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={{
        height,
        borderRadius: radii.full,
        backgroundColor: colors.surface,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${value}%`,
          height,
          borderRadius: radii.full,
          backgroundColor: colors.rose,
        }}
      />
    </View>
  );
}

export function Segments({
  filled,
  label,
}: Readonly<{ filled: boolean[]; label: string }>) {
  const colors = useHomeColors();
  return (
    <View accessible accessibilityLabel={label} style={{ flexDirection: "row", gap: 6 }}>
      {filled.map((on, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 10,
            borderRadius: radii.full,
            backgroundColor: on ? colors.rose : colors.white,
            borderWidth: 1,
            borderColor: on ? colors.rose : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export function saleTime(sale: Sale, now: Date): string {
  const date = new Date(sale.soldAt);
  const day = localDateKey(date);
  if (day === localDateKey(now))
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (day === localDateKey(yesterday)) return "ontem";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function valueOrState<T>(query: Query<T>, value: (data: T) => string): string {
  if (query.data !== undefined) return value(query.data);
  return query.isError ? "Indisponível" : "…";
}
