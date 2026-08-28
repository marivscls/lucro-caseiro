import {
  Button,
  EmptyState,
  Input,
  Typography,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { showAlert } from "../../../shared/components/alert-store";
import { AppIcon } from "../../../shared/components/app-icon";
import { Skeleton, SkeletonList } from "../../../shared/components/skeleton";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { alertError } from "../../../shared/utils/alerts";
import { formatCurrency } from "../../../shared/utils/format";
import { useBusinessCopy } from "../../subscription/business-copy";
import {
  ALL_RECIPES_CATEGORY,
  displayRecipeName,
  filterRecipes,
  recipeCategoryFilters,
  recipeCountLabel,
  recipeListSummary,
} from "../domain";
import { useAllRecipes, useDeleteRecipe } from "../hooks";
import { RecipeCard } from "./recipe-card";

interface RecipeListProps {
  readonly onRecipePress?: (id: string) => void;
  readonly onAddPress?: () => void;
  readonly onEditPress?: (id: string) => void;
}

export function RecipeList({ onRecipePress, onAddPress, onEditPress }: RecipeListProps) {
  const pal = useBrandScreenPalette();
  const experienceCopy = useBusinessCopy();
  const showAds = useShowAds();
  const [selectedCategory, setSelectedCategory] = useState(ALL_RECIPES_CATEGORY);
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAllRecipes();
  const deleteRecipe = useDeleteRecipe();
  const recipes = data ?? [];
  const categoryFilters = useMemo(
    () => recipeCategoryFilters(recipes, experienceCopy.categoryPresets),
    [recipes, experienceCopy.categoryPresets],
  );
  const summary = recipeListSummary(recipes);
  const category =
    selectedCategory === ALL_RECIPES_CATEGORY ? undefined : selectedCategory;
  const visibleRecipes = filterRecipes(recipes, { category, query: search });
  const listData = showAds ? interleaveAds(visibleRecipes) : visibleRecipes;
  const hasQuery = search.trim().length > 0;
  const hasCategoryFilter = selectedCategory !== ALL_RECIPES_CATEGORY;

  function clearSearchAndFilters() {
    setSearch("");
    setSelectedCategory(ALL_RECIPES_CATEGORY);
  }

  function confirmDelete(id: string, name: string) {
    showAlert({
      title: "Excluir receita",
      message: `Tem certeza que deseja excluir "${name}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteRecipe
              .mutateAsync(id)
              .catch(() =>
                alertError(`Não foi possível excluir a ${experienceCopy.formulaNoun}.`),
              );
          },
        },
      ],
    });
  }

  const header = (
    <View style={{ gap: spacing.lg, paddingBottom: spacing.sm }}>
      <RecipesHero
        isLoading={isLoading}
        count={summary.count}
        averageCost={summary.averageCost}
        singular={experienceCopy.formulaNoun}
        plural={experienceCopy.formulaNounPlural}
      />
      {isLoading || recipes.length > 0 ? (
        <>
          {isLoading ? (
            <RecipesSearchSkeleton />
          ) : (
            <RecipesSearch value={search} onChange={setSearch} />
          )}
          {isLoading ? (
            <RecipesFiltersSkeleton />
          ) : (
            <RecipesFilterRow
              categories={categoryFilters}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
            />
          )}
        </>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: spacing.sm,
          paddingBottom: spacing["3xl"],
          gap: spacing.md,
        }}
      >
        {header}
        <SkeletonList rows={6} variant="recipe" />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: spacing.sm }}
      >
        {header}
        <EmptyState
          title="Algo deu errado"
          description={`Não foi possível carregar suas ${experienceCopy.formulaNounPlural}. Tente novamente.`}
          action={
            <Button
              title="Tentar novamente"
              onPress={() => void refetch()}
              style={{ backgroundColor: pal.rose }}
            />
          }
        />
      </ScrollView>
    );
  }

  if (recipes.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingTop: spacing.sm }}
      >
        {header}
        <EmptyState
          title={`Nenhuma ${experienceCopy.formulaNoun} ainda`}
          description="Cadastre a primeira para acompanhar custos e rendimentos em um só lugar."
          action={
            onAddPress ? (
              <Button
                title={`Cadastrar ${experienceCopy.formulaNoun}`}
                onPress={onAddPress}
                style={{ backgroundColor: pal.rose }}
              />
            ) : null
          }
          style={{ paddingVertical: spacing["2xl"] }}
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        gap: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing["3xl"],
        flexGrow: 1,
      }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState
          title={`Nenhuma ${experienceCopy.formulaNoun} encontrada`}
          description="Tente outro nome ou limpe a busca e os filtros."
          action={
            hasQuery || hasCategoryFilter ? (
              <Button
                title="Limpar busca e filtros"
                variant="outline"
                onPress={clearSearchAndFilters}
              />
            ) : null
          }
          style={{ paddingVertical: spacing["2xl"] }}
        />
      }
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return <AdBanner size="banner" />;
        }
        return (
          <RecipeCard
            recipe={item}
            onPress={() => onRecipePress?.(item.id)}
            onEdit={onEditPress ? () => onEditPress(item.id) : undefined}
            onDelete={() => confirmDelete(item.id, displayRecipeName(item.name))}
          />
        );
      }}
    />
  );
}

const SUMMARY_CARD_HEIGHT = 92;

function RecipesHero({
  isLoading,
  count,
  averageCost,
  singular,
  plural,
}: Readonly<{
  isLoading: boolean;
  count: number;
  averageCost: number;
  singular: string;
  plural: string;
}>) {
  return (
    <View style={{ gap: spacing.md }}>
      <RecipesIntro />
      {isLoading ? (
        <RecipesSummarySkeleton />
      ) : (
        <RecipesSummary
          count={count}
          averageCost={averageCost}
          singular={singular}
          plural={plural}
        />
      )}
    </View>
  );
}

function RecipesIntro() {
  const pal = useBrandScreenPalette();

  return (
    <View style={{ gap: spacing.xs }}>
      <Typography variant="h3" color={pal.wine}>
        Suas receitas, seus lucros.
      </Typography>
      <Typography variant="body" color={pal.muted}>
        Acompanhe custos e rendimentos em um só lugar.
      </Typography>
    </View>
  );
}

function RecipesSummary({
  count,
  averageCost,
  singular,
  plural,
}: Readonly<{
  count: number;
  averageCost: number;
  singular: string;
  plural: string;
}>) {
  const pal = useBrandScreenPalette();
  const { theme } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const compact = viewportWidth < 360;
  const summaryIconSize = compact ? 36 : 42;

  return (
    <View
      style={{
        minHeight: SUMMARY_CARD_HEIGHT,
        borderRadius: radii.xl,
        backgroundColor: pal.white,
        borderWidth: 1,
        borderColor: pal.border,
        paddingVertical: spacing.lg,
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        ...theme.shadows.sm,
      }}
    >
      <View
        style={{
          flex: compact ? 1.5 : 1.35,
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? spacing.sm : spacing.md,
          minWidth: 0,
        }}
      >
        <View
          style={{
            width: summaryIconSize,
            height: summaryIconSize,
            flexShrink: 0,
            borderRadius: radii.full,
            backgroundColor: "rgba(220, 232, 106, 0.38)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="trending-up-outline" size={iconSizes.sm} color={pal.wine} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography
            variant={compact ? "bodyBold" : "h3"}
            color={pal.wine}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
          >
            {recipeCountLabel(count, singular, plural)}
          </Typography>
          <Typography variant="caption" color={pal.muted}>
            Ativas
          </Typography>
        </View>
      </View>

      <View
        style={{
          width: 1,
          alignSelf: "stretch",
          marginVertical: spacing.xs,
          backgroundColor: pal.border,
        }}
      />

      <View
        style={{
          flex: compact ? 0.85 : 1,
          paddingLeft: compact ? spacing.md : spacing.lg,
          gap: 2,
          minWidth: 0,
        }}
      >
        <Typography variant="caption" color={pal.muted}>
          Custo médio
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Typography
            variant="h3"
            color={pal.wine}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatCurrency(averageCost)}
          </Typography>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: radii.full,
              backgroundColor: pal.lime,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function RecipesSearch({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (next: string) => void }>) {
  const pal = useBrandScreenPalette();

  return (
    <Input
      value={value}
      onChangeText={onChange}
      placeholder="Buscar receita"
      accessibilityLabel="Buscar receita"
      returnKeyType="search"
      autoCorrect={false}
      autoCapitalize="none"
      icon={<AppIcon name="search-outline" size={iconSizes.list} color={pal.muted} />}
      containerStyle={{ gap: 0 }}
    />
  );
}

function RecipesFilterRow({
  categories,
  selected,
  onSelect,
}: Readonly<{
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
}>) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, flexGrow: 0, paddingRight: spacing.sm }}
    >
      {categories.map((category) => (
        <RecipeFilterChip
          key={category}
          label={category}
          selected={selected === category}
          onPress={() => onSelect(category)}
        />
      ))}
    </ScrollView>
  );
}

function RecipeFilterChip({
  label,
  selected,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>) {
  const pal = useBrandScreenPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: selected ? pal.rose : pal.white,
        borderWidth: selected ? 0 : 1,
        borderColor: pal.border,
        opacity: pressed ? 0.85 : 1,
        ...(Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as object) : null),
      })}
    >
      <Typography
        variant="bodyBold"
        color={selected ? pal.onWine : pal.wine}
        numberOfLines={1}
        style={{ flexShrink: 0 }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function RecipesSummarySkeleton() {
  const pal = useBrandScreenPalette();
  return (
    <View
      style={{
        minHeight: SUMMARY_CARD_HEIGHT,
        borderRadius: radii.xl,
        backgroundColor: pal.white,
        borderWidth: 1,
        borderColor: pal.border,
        padding: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
      }}
    >
      <Skeleton width={42} height={42} borderRadius={radii.full} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="30%" height={12} />
      </View>
      <Skeleton width={1} height={40} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="50%" height={12} />
        <Skeleton width="70%" height={16} />
      </View>
    </View>
  );
}

function RecipesSearchSkeleton() {
  return <Skeleton width="100%" height={48} borderRadius={radii.lg} />;
}

function RecipesFiltersSkeleton() {
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <Skeleton width={76} height={44} borderRadius={radii.full} />
      <Skeleton width={88} height={44} borderRadius={radii.full} />
      <Skeleton width={96} height={44} borderRadius={radii.full} />
      <Skeleton width={72} height={44} borderRadius={radii.full} />
    </View>
  );
}
