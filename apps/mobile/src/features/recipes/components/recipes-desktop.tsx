/**
 * Receitas no desktop (web >= 1024px): indicadores, busca com categorias e
 * tabela. Dados, filtros e ações continuam em `recipe-list.tsx`.
 */
import type { Recipe } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import {
  DesktopTable,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { displayRecipeName, formatRecipeQuantity, recipeKindLabel } from "../domain";
import { recipeAvatarFallback } from "./recipe-card";
import { DesktopSearchField } from "../../../shared/layout/desktop-kit";

type HoverState = { pressed: boolean; hovered?: boolean };

function chipBorder(
  selected: boolean,
  hovered: boolean | undefined,
  fill: string,
  idle: string,
) {
  if (selected) return fill;
  return hovered ? fill : idle;
}

/** Busca que cresce + categorias em linha, com quebra quando não cabem. */
export function DesktopRecipeToolbar({
  search,
  onSearch,
  categories,
  selected,
  onSelect,
}: Readonly<{
  search: string;
  onSearch: (value: string) => void;
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View style={{ gap: spacing.md }}>
      <DesktopSearchField
        value={search}
        onChangeText={onSearch}
        placeholder="Buscar receita"
        style={{ flexBasis: "auto" }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {categories.map((category) => {
          const isSelected = category === selected;
          return (
            <Pressable
              key={category}
              onPress={() => onSelect(category)}
              accessibilityRole="button"
              accessibilityLabel={category}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed, hovered }: HoverState) => ({
                minHeight: 44,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.full,
                borderWidth: 1,
                borderColor: chipBorder(
                  isSelected,
                  hovered,
                  pal.wine,
                  theme.colors.border,
                ),
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
                {category}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Tabela de receitas: nome, categoria, rendimento e custos à direita. */
export function DesktopRecipeTable({
  recipes,
  onOpen,
  onMenu,
}: Readonly<{
  recipes: readonly Recipe[];
  onOpen: (recipe: Recipe) => void;
  onMenu: (recipe: Recipe) => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const [width, setWidth] = useState(0);
  // Em 1024px a categoria sai da tabela (continua nos filtros acima).
  const narrow = width > 0 && width < 800;
  const allColumns: DesktopTableColumn<Recipe>[] = [
    {
      key: "name",
      title: "Receita",
      flex: 2.4,
      render: (recipe) => {
        const name = displayRecipeName(recipe.name);
        const kind = recipeKindLabel(recipe.name);
        const fallback = recipeAvatarFallback(recipe.category);
        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <IngredientAvatar
              name={name}
              photoUrl={recipe.photoUrl}
              matchCatalog={false}
              fallbackEmoji={fallback.emoji}
              fallbackColor={fallback.color}
              size={44}
              imageResizeMode="contain"
              accessibilityLabel={name}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="desktopBodyStrong" numberOfLines={2}>
                {name}
              </Typography>
              {kind ? <Typography variant="desktopMeta">{kind}</Typography> : null}
            </View>
          </View>
        );
      },
    },
    {
      key: "category",
      title: "Categoria",
      flex: 1,
      render: (recipe) => (
        <Typography variant="desktopBody" numberOfLines={1}>
          {recipe.category}
        </Typography>
      ),
    },
    {
      key: "yield",
      title: "Rende",
      flex: 1,
      render: (recipe) => (
        <Typography variant="desktopBody" numberOfLines={2}>
          {formatRecipeQuantity(recipe.yieldQuantity)} {recipe.yieldUnit}
        </Typography>
      ),
    },
    {
      key: "unit",
      title: narrow ? "Por unidade" : "Custo por unidade",
      flex: 1.2,
      align: "right",
      render: (recipe) => (
        <Typography
          variant="desktopBodyStrong"
          color={pal.wine}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(recipe.costPerUnit)}
        </Typography>
      ),
    },
    {
      key: "total",
      title: "Custo total",
      flex: 1,
      align: "right",
      render: (recipe) => (
        <Typography variant="desktopBody" style={{ fontVariant: ["tabular-nums"] }}>
          {formatCurrency(recipe.totalCost)}
        </Typography>
      ),
    },
    {
      key: "actions",
      title: "",
      width: 44,
      align: "right",
      render: (recipe) => (
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onMenu(recipe);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Mais ações de ${displayRecipeName(recipe.name)}`}
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
  const columns = narrow
    ? allColumns.filter((column) => column.key !== "category")
    : allColumns;
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <DesktopTable
        columns={columns}
        rows={recipes}
        keyExtractor={(recipe) => recipe.id}
        onRowPress={onOpen}
        rowAccessibilityLabel={(recipe) => `Abrir ${displayRecipeName(recipe.name)}`}
      />
    </View>
  );
}
