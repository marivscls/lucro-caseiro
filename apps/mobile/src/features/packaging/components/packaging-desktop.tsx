/**
 * Embalagens no desktop (web >= 1024px): painel vinho com indicadores
 * grandes, busca com tipos em linha e tabela. Estado e ações continuam em
 * `app/packaging.tsx`.
 */
import type { Packaging } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Image, Pressable, View, type ImageSourcePropType } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  DesktopTable,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { displayPackagingName, isLowStock, typeLabel, typeStripeColor } from "../domain";
import { PackagingAvatar } from "./packaging-avatar";
import { DesktopSearchField } from "../../../shared/layout/desktop-kit";

type HoverState = { pressed: boolean; hovered?: boolean };

/** Painel vinho: cadastradas, custo somado e para repor, com a arte à direita. */
export function DesktopPackagingBand({
  totalCount,
  invested,
  toRestock,
  illustration,
}: Readonly<{
  totalCount: number;
  invested: number;
  toRestock: number;
  illustration: ImageSourcePropType;
}>) {
  const pal = useBrandScreenPalette();
  const [width, setWidth] = useState(0);
  const showArt = width >= 680;
  const metrics = [
    { label: totalCount === 1 ? "cadastrada" : "cadastradas", value: String(totalCount) },
    { label: "investidos", value: formatCurrency(invested) },
    {
      label: "para repor",
      value: String(toRestock),
      accent: toRestock > 0 ? pal.lime : undefined,
    },
  ];
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityLabel={`Estoque de embalagens: ${totalCount} ${metrics[0].label}, ${formatCurrency(invested)} investidos, ${toRestock} para repor`}
      style={{
        minHeight: 172,
        borderRadius: radii["2xl"],
        backgroundColor: pal.wineFill,
        overflow: "hidden",
        paddingVertical: spacing["2xl"],
        paddingLeft: spacing["2xl"],
        paddingRight: showArt ? 240 : spacing["2xl"],
        gap: spacing.xl,
      }}
    >
      <Typography variant="desktopSection" color={pal.onWine}>
        Estoque de embalagens
      </Typography>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.lg }}>
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            style={{
              minWidth: 96,
              paddingRight: spacing.xl,
              marginRight: spacing.xl,
              borderRightWidth: index < metrics.length - 1 ? 1 : 0,
              borderRightColor: pal.wineDivider,
              gap: 2,
            }}
          >
            <Typography
              variant="desktopMetric"
              color={metric.accent ?? pal.onWine}
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
      </View>
      {showArt ? (
        <Image
          source={illustration}
          resizeMode="contain"
          accessible={false}
          style={{
            position: "absolute",
            right: spacing["2xl"],
            bottom: 0,
            width: 208,
            height: 183,
          }}
        />
      ) : null}
    </View>
  );
}

/** Busca que cresce + todos os tipos em linha (sem o botão Filtros). */
export function DesktopPackagingToolbar({
  search,
  onSearch,
  filters,
  selected,
  onSelect,
}: Readonly<{
  search: string;
  onSearch: (value: string) => void;
  filters: readonly { value: string | null; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View style={{ gap: spacing.md }}>
      <DesktopSearchField
        value={search}
        onChangeText={onSearch}
        placeholder="Buscar embalagem"
        style={{ flexBasis: "auto" }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {filters.map((filter) => {
          const isSelected = filter.value === selected;
          return (
            <Pressable
              key={filter.label}
              onPress={() => onSelect(filter.value)}
              accessibilityRole="button"
              accessibilityLabel={filter.label}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed, hovered }: HoverState) => ({
                minHeight: 44,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.full,
                borderWidth: 1,
                borderColor: isSelected || hovered ? pal.wine : theme.colors.border,
                backgroundColor: isSelected ? pal.wineFill : theme.colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Typography
                variant="desktopBodyStrong"
                color={isSelected ? pal.onWine : theme.colors.text}
              >
                {filter.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Tabela: embalagem, tipo, fornecedor e custo unitário, com menu por linha. */
export function DesktopPackagingTable({
  items,
  onOpen,
  onMenu,
}: Readonly<{
  items: readonly Packaging[];
  onOpen: (item: Packaging) => void;
  onMenu: (item: Packaging) => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const columns: DesktopTableColumn<Packaging>[] = [
    {
      key: "name",
      title: "Embalagem",
      flex: 2.4,
      render: (item) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <PackagingAvatar
            name={item.name}
            type={item.type}
            photoUrl={item.photoUrl}
            size={44}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="desktopBodyStrong" numberOfLines={2}>
              {displayPackagingName(item.name)}
            </Typography>
            {isLowStock(item) ? (
              <Typography variant="desktopMeta" color={theme.colors.alert}>
                Estoque baixo
              </Typography>
            ) : null}
          </View>
        </View>
      ),
    },
    {
      key: "type",
      title: "Tipo",
      flex: 1,
      render: (item) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: radii.full,
              backgroundColor: typeStripeColor(item.type),
            }}
          />
          <Typography variant="desktopBody" numberOfLines={1}>
            {typeLabel(item.type)}
          </Typography>
        </View>
      ),
    },
    {
      key: "supplier",
      title: "Fornecedor",
      flex: 1.4,
      render: (item) => (
        <Typography
          variant="desktopBody"
          numberOfLines={2}
          color={item.supplier?.trim() ? undefined : theme.colors.textSecondary}
        >
          {item.supplier?.trim() || "Não informado"}
        </Typography>
      ),
    },
    {
      key: "cost",
      title: "Custo unitário",
      flex: 1,
      align: "right",
      render: (item) => (
        <Typography
          variant="desktopBodyStrong"
          color={pal.wine}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(item.unitCost)}
        </Typography>
      ),
    },
    {
      key: "actions",
      title: "",
      width: 44,
      align: "right",
      render: (item) => (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onMenu(item);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Ações de ${displayPackagingName(item.name)}`}
          style={({ pressed, hovered }: HoverState) => ({
            width: 44,
            height: 44,
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: hovered ? theme.colors.border : "transparent",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <AppIcon name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </Pressable>
      ),
    },
  ];
  return (
    <DesktopTable
      columns={columns}
      rows={items}
      keyExtractor={(item) => item.id}
      onRowPress={onOpen}
      rowAccessibilityLabel={(item) =>
        `Ver detalhes de ${displayPackagingName(item.name)}`
      }
    />
  );
}
