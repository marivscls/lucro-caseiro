import type { Recipe } from "@lucro-caseiro/contracts";
import { Card, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View, useWindowDimensions } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { showAlert } from "../../../shared/components/alert-store";
import { AppIcon } from "../../../shared/components/app-icon";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { formatCurrency } from "../../../shared/utils/format";
import { displayRecipeName, formatRecipeQuantity, recipeKindLabel } from "../domain";

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress?: () => void;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
}

const CATEGORY_FALLBACK = new Map<string, { emoji: string; color: string }>([
  ["Doces", { emoji: "🍬", color: "#C4566B" }],
  ["Bolos", { emoji: "🎂", color: "#C4707E" }],
  ["Salgados", { emoji: "🥟", color: "#C9A36A" }],
  ["Bebidas", { emoji: "🥤", color: "#6E93B5" }],
]);

export function RecipeCard({ recipe, onPress, onEdit, onDelete }: RecipeCardProps) {
  const pal = useBrandScreenPalette();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const visibleName = displayRecipeName(recipe.name);
  const kind = recipeKindLabel(recipe.name);
  const fallback = CATEGORY_FALLBACK.get(recipe.category) ?? {
    emoji: "🍽️",
    color: "#9A8F87",
  };
  const thumbSize = compact ? 56 : 64;

  function openMenu() {
    showAlert({
      title: visibleName,
      message: "O que você quer fazer?",
      buttons: [
        ...(onEdit ? [{ text: "Editar", onPress: onEdit }] : []),
        ...(onDelete
          ? [
              {
                text: "Excluir receita",
                style: "destructive" as const,
                onPress: onDelete,
              },
            ]
          : []),
        { text: "Cancelar", style: "cancel" },
      ],
    });
  }

  return (
    <Card
      variant="elevated"
      shadow="sm"
      padding="md"
      style={{
        backgroundColor: pal.white,
        borderColor: pal.border,
        borderRadius: radii.lg,
        minHeight: compact ? 88 : 96,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${visibleName}`}
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <IngredientAvatar
            name={visibleName}
            photoUrl={recipe.photoUrl}
            matchCatalog={false}
            fallbackEmoji={fallback.emoji}
            fallbackColor={fallback.color}
            size={thumbSize}
            imageResizeMode="contain"
            accessibilityLabel={visibleName}
          />

          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            {kind ? <RecipeKindPill label={kind} /> : null}
            <Typography variant="h3" color={pal.wine} numberOfLines={2}>
              {visibleName}
            </Typography>
            <Typography variant="caption" color={pal.muted}>
              Custo:{" "}
              <Typography variant="captionBold" color={pal.rose}>
                {formatCurrency(recipe.costPerUnit)}/{recipe.yieldUnit}
              </Typography>
              {"  |  "}
              Rende: {formatRecipeQuantity(recipe.yieldQuantity)} {recipe.yieldUnit}
            </Typography>
          </View>
        </Pressable>

        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            alignSelf: "stretch",
            paddingVertical: 2,
            maxWidth: compact ? 88 : 104,
          }}
        >
          <Typography
            variant="caption"
            color={pal.muted}
            numberOfLines={1}
            style={{ textAlign: "right" }}
          >
            {recipe.category}
          </Typography>
          <Pressable
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel={`Mais ações de ${visibleName}`}
            hitSlop={6}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              marginRight: -8,
              marginBottom: -8,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            <AppIcon name="ellipsis-vertical" size={20} color={pal.wine} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function RecipeKindPill({ label }: Readonly<{ label: string }>) {
  const pal = useBrandScreenPalette();
  const { theme } = useTheme();
  const tone = kindTone(label, theme.colors.lavender, theme.colors.lavenderBg, pal);

  return (
    <View
      style={{
        alignSelf: "flex-start",
        minHeight: 22,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.full,
        backgroundColor: tone.background,
        borderWidth: 1,
        borderColor: tone.border,
      }}
    >
      <Typography variant="captionBold" color={tone.color}>
        {label}
      </Typography>
    </View>
  );
}

function kindTone(
  label: string,
  lavender: string,
  lavenderBg: string,
  pal: ReturnType<typeof useBrandScreenPalette>,
): { background: string; border: string; color: string } {
  const kind = label.toLocaleLowerCase("pt-BR");
  if (kind === "recheio") {
    return { background: lavenderBg, border: `${lavender}33`, color: lavender };
  }
  return {
    background: pal.softRose,
    border: pal.border,
    color: pal.rose,
  };
}
