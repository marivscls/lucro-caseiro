/**
 * Peças de Produtos no desktop (web >= 1024px). Estado, filtros e modais
 * continuam em `app/products.tsx`; aqui fica só a apresentação.
 */
import type { Product } from "@lucro-caseiro/contracts";
import {
  Button,
  CenteredTextInput,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState, type ReactNode } from "react";
import { Image, Pressable, View, type ImageSourcePropType } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { useNotificationEnabled } from "../../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../../shared/hooks/notification-types";
import { desktopCardStyle } from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName, productInitial } from "../display";
import { getStockBadge } from "../stock-badge";

type HoverState = { pressed: boolean; hovered?: boolean };

function tabBackground(
  selected: boolean,
  hovered: boolean | undefined,
  fill: string,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (selected) return fill;
  return hovered ? theme.colors.surface : "transparent";
}

/** Faixa vinho do catálogo: título, indicadores grandes e a arte. */
export function DesktopCatalogBand({
  summary,
  metrics,
  illustration,
  attention,
}: Readonly<{
  summary: string;
  metrics: readonly { label: string; value: string }[];
  illustration: ImageSourcePropType;
  /** Itens que precisam de reposição; `null` esconde o indicador. */
  attention: {
    count: number;
    detail: string;
    onPress: () => void;
  } | null;
}>) {
  const pal = useBrandScreenPalette();
  const [width, setWidth] = useState(0);
  // Em 1024px a arte sai para os quatro indicadores caberem numa linha.
  const showArt = width >= 880;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={`Seu catálogo: ${metrics.map((m) => m.value + " " + m.label).join(", ")}`}
      style={{
        minHeight: 172,
        borderRadius: radii["2xl"],
        backgroundColor: pal.wineFill,
        overflow: "hidden",
        paddingVertical: spacing["2xl"],
        paddingLeft: spacing["2xl"],
        paddingRight: showArt ? 216 : spacing["2xl"],
        gap: spacing.xl,
      }}
    >
      <View style={{ gap: spacing.xs }}>
        <Typography variant="desktopSection" color={pal.onWine}>
          Seu catálogo
        </Typography>
        <Typography variant="desktopBody" color={pal.onWineMuted}>
          {summary}
        </Typography>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }}>
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            style={{
              minWidth: 96,
              paddingRight: spacing.xl,
              marginRight: spacing.xl,
              borderRightWidth: index < metrics.length - 1 || attention ? 1 : 0,
              borderRightColor: pal.wineDivider,
              gap: 2,
            }}
          >
            <Typography
              variant="desktopMetric"
              color={pal.onWine}
              numberOfLines={1}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {metric.value}
            </Typography>
            <Typography variant="desktopMetricLabel" color={pal.onWineMuted}>
              {metric.label}
            </Typography>
          </View>
        ))}
        {attention ? (
          <Pressable
            onPress={attention.onPress}
            disabled={attention.count === 0}
            accessibilityRole="button"
            accessibilityLabel={
              attention.count === 0
                ? "Estoque em dia"
                : `Ver itens para repor: ${attention.detail}`
            }
            style={({ pressed }) => ({ gap: 2, opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Typography
                variant="desktopMetric"
                color={attention.count > 0 ? pal.lime : pal.onWine}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {attention.count}
              </Typography>
              {attention.count > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    minHeight: 32,
                    paddingHorizontal: spacing.sm,
                    borderRadius: radii.full,
                    backgroundColor: pal.lime,
                  }}
                >
                  <Typography variant="desktopMeta" color={pal.onLime}>
                    Ver itens
                  </Typography>
                  <AppIcon name="chevron-forward" size={16} color={pal.onLime} />
                </View>
              ) : null}
            </View>
            <Typography variant="desktopMetricLabel" color={pal.onWineMuted}>
              {attention.count === 0 ? "estoque em dia" : "para repor"}
            </Typography>
          </Pressable>
        ) : null}
      </View>
      {showArt ? (
        <Image
          source={illustration}
          resizeMode="contain"
          accessible={false}
          style={{
            position: "absolute",
            right: spacing.xl,
            bottom: spacing.md,
            width: 176,
            height: 176,
            objectFit: "contain",
          }}
        />
      ) : null}
    </View>
  );
}

/** Barra de ferramentas: busca que cresce, abas de tipo e filtros. */
export function DesktopProductToolbar({
  search,
  onSearch,
  searchLabel,
  types,
  selectedType,
  onType,
  filterCount,
  onFilters,
}: Readonly<{
  search: string;
  onSearch: (value: string) => void;
  searchLabel: string;
  types: readonly { value: string; label: string }[];
  selectedType: string;
  onType: (value: string) => void;
  filterCount: number;
  onFilters: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <View
        style={[
          desktopCardStyle(theme, { padding: 0 }),
          {
            flexGrow: 1,
            flexBasis: 260,
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
        <CenteredTextInput
          value={search}
          onChangeText={onSearch}
          placeholder={searchLabel}
          accessibilityLabel={searchLabel}
          placeholderTextColor={theme.colors.textSecondary}
          style={{
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: 16,
            paddingVertical: 0,
          }}
        />
        {search.length > 0 ? (
          <Pressable
            onPress={() => onSearch("")}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          padding: 4,
          gap: 4,
          minHeight: 52,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
        }}
      >
        {types.map((type) => {
          const selected = type.value === selectedType;
          return (
            <Pressable
              key={type.value}
              onPress={() => onType(type.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed, hovered }: HoverState) => ({
                minHeight: 42,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: tabBackground(selected, hovered, pal.wineFill, theme),
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Typography
                variant="desktopBodyStrong"
                color={selected ? pal.onWine : theme.colors.text}
                numberOfLines={1}
              >
                {type.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onFilters}
        accessibilityRole="button"
        accessibilityLabel={
          filterCount > 0 ? `Filtros, ${filterCount} ativos` : "Abrir filtros"
        }
        style={({ pressed, hovered }: HoverState) => ({
          minHeight: 52,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: hovered || filterCount > 0 ? pal.wine : theme.colors.border,
          backgroundColor: filterCount > 0 ? pal.softRose : theme.colors.surfaceElevated,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <AppIcon name="options-outline" size={20} color={theme.colors.text} />
        <Typography variant="desktopBodyStrong" numberOfLines={1}>
          {filterCount > 0 ? `Filtros (${filterCount})` : "Filtros"}
        </Typography>
      </Pressable>
    </View>
  );
}

/** Título da lista com contagem ("Todos os produtos · 6 itens"). */
export function DesktopListTitle({
  title,
  count,
}: Readonly<{ title: string; count: string }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}>
      <Typography variant="desktopCardTitle" accessibilityRole="header">
        {title}
      </Typography>
      <Typography variant="desktopMeta">{count}</Typography>
    </View>
  );
}

function stockLine(product: Product, lowStockEnabled: boolean) {
  const badge = getStockBadge(product, lowStockEnabled);
  if (!badge) return null;
  if (badge.variant === "success") {
    return { label: badge.label.replace("un.", "em estoque"), alert: false };
  }
  return { label: badge.label, alert: true };
}

/** Cartão da grade: foto ou inicial, nome, categoria, preço e estoque. */
export function DesktopProductTile({
  product,
  kitLabel,
  onPress,
}: Readonly<{ product: Product; kitLabel: string; onPress: () => void }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const lowStockEnabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);
  const name = displayProductName(product.name);
  const stock = stockLine(product, lowStockEnabled);
  const price =
    product.saleUnit === "kg"
      ? `${formatCurrency(product.salePrice)}/kg`
      : formatCurrency(product.salePrice);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${name}, ${price}`}
      style={({ pressed, hovered }: HoverState) => [
        desktopCardStyle(theme, { padding: spacing.lg }),
        {
          height: "100%",
          gap: spacing.md,
          borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radii.md,
            overflow: "hidden",
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {product.photoUrl ? (
            <Image
              source={{ uri: product.photoUrl }}
              resizeMode="cover"
              accessibilityLabel={`Foto de ${name}`}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Typography variant="desktopCardTitle" color={theme.colors.textSecondary}>
              {productInitial(product.name)}
            </Typography>
          )}
        </View>
        <View style={{ flex: 1 }} />
        {product.isComposite ? (
          <View
            style={{
              minHeight: 28,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: theme.colors.lavenderBg,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <AppIcon name="gift-outline" size={16} color={theme.colors.lavender} />
            <Typography variant="desktopMeta" color={theme.colors.lavender}>
              {kitLabel}
            </Typography>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 2 }}>
        <Typography
          variant="desktopBodyStrong"
          numberOfLines={2}
          style={{ minHeight: 48 }}
        >
          {name}
        </Typography>
        <Typography variant="desktopMeta" numberOfLines={1}>
          {product.category}
        </Typography>
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: spacing.md,
        }}
      >
        <Typography
          variant="desktopCardTitle"
          color={pal.wine}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {price}
        </Typography>
        {stock ? (
          <Typography
            variant="desktopMeta"
            color={stock.alert ? theme.colors.alert : undefined}
            numberOfLines={1}
          >
            {stock.label}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Estado vazio do desktop: cartão tracejado na coluna, com ação. */
export function DesktopEmptyCard({
  icon = "cube-outline",
  title,
  description,
  action,
}: Readonly<{
  icon?: "cube-outline" | "search-outline" | "cloud-offline-outline";
  title: string;
  description: string;
  action?: ReactNode;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: theme.colors.border,
        borderRadius: radii.lg,
        paddingVertical: spacing["3xl"],
        paddingHorizontal: spacing["2xl"],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xl,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radii.full,
          backgroundColor: pal.softRose,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={26} color={pal.wine} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="desktopCardTitle">{title}</Typography>
        <Typography variant="desktopBody">{description}</Typography>
      </View>
      {action}
    </View>
  );
}

/** Botão de ação do estado vazio com largura do texto. */
export function DesktopEmptyAction({
  title,
  onPress,
  variant = "primary",
}: Readonly<{ title: string; onPress: () => void; variant?: "primary" | "secondary" }>) {
  return (
    <Button
      title={title}
      variant={variant}
      onPress={onPress}
      style={{ minWidth: 160, minHeight: 48 }}
    />
  );
}
