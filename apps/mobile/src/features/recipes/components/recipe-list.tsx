import {
  Button,
  Chip,
  EmptyState,
  FilterChipRow,
  Typography,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";

import { SkeletonList } from "../../../shared/components/skeleton";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { useRecipes } from "../hooks";
import { RecipeCard } from "./recipe-card";
import recipesEmpty from "../../../assets/recipes-empty.png";
import recipesHowItWorks from "../../../assets/recipes-how-it-works.png";
import { useBusinessCopy } from "../../subscription/business-copy";
import { showAlert } from "../../../shared/components/alert-store";

function BenefitColumn({
  icon,
  title,
  description,
}: Readonly<{
  icon: AppIconName;
  title: string;
  description: string;
}>) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.xs,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          ...theme.shadows.sm,
        }}
      >
        <AppIcon name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Typography
        variant="captionBold"
        color={theme.colors.text}
        style={{ textAlign: "center" }}
      >
        {title}
      </Typography>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", lineHeight: 16 }}
      >
        {description}
      </Typography>
    </View>
  );
}

function RecipesEmptyState({ onAddPress }: Readonly<{ onAddPress?: () => void }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const imageWidth = Math.min(340, width - spacing.lg * 2);
  const benefitsWidth = Math.min(520, width - spacing.md * 2);

  function showHowItWorks() {
    showAlert({
      title: "Saiba como funciona",
      message:
        "Cadastre os ingredientes, informe o rendimento e deixe o Lucro Caseiro calcular o custo de cada receita para você.",
    });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        ...pageGutter(isDesktop),
        ...desktopStretch(isDesktop, desktopWidths.data),
        paddingTop: spacing["2xl"],
        paddingBottom: spacing.lg,
        ...(isDesktop ? undefined : { alignItems: "center" }),
        justifyContent: "flex-start",
      }}
    >
      <Image
        source={recipesEmpty}
        style={{ width: imageWidth, height: 220 }}
        resizeMode="contain"
      />
      <Typography
        variant="h2"
        color={theme.colors.text}
        style={{ marginTop: spacing.md, textAlign: "center" }}
      >
        Nenhuma receita ainda
      </Typography>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{
          maxWidth: 300,
          marginTop: spacing.sm,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        Cadastre sua primeira ficha técnica para começar a calcular custos e lucros com
        mais precisão.
      </Typography>

      <Button
        title="Cadastrar receita"
        onPress={onAddPress}
        style={{
          minWidth: 188,
          marginTop: spacing.lg,
          shadowColor: theme.colors.primaryInteractive,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 3,
        }}
        icon={
          <AppIcon
            name="document-attach-outline"
            size={20}
            color={theme.colors.textOnPrimary}
          />
        }
      />

      <View
        style={{
          width: benefitsWidth,
          marginTop: spacing.xl,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.lg,
          flexDirection: "row",
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
        }}
      >
        <BenefitColumn
          icon="calculator-outline"
          title="Calcule custos"
          description={"Saiba exatamente\nquanto cada ficha\ntécnica custa."}
        />
        <View
          style={{
            width: 1,
            marginVertical: spacing.xs,
            backgroundColor: theme.colors.border,
          }}
        />
        <BenefitColumn
          icon="trending-up-outline"
          title="Acompanhe lucros"
          description={"Veja suas margens e\naumente seus\nresultados."}
        />
        <View
          style={{
            width: 1,
            marginVertical: spacing.xs,
            backgroundColor: theme.colors.border,
          }}
        />
        <BenefitColumn
          icon="time-outline"
          title="Economize tempo"
          description={"Receitas organizadas\ne fáceis de consultar\nquando precisar."}
        />
      </View>

      <Pressable
        onPress={showHowItWorks}
        accessibilityRole="button"
        accessibilityLabel="Saiba como criar receitas"
        style={({ pressed }) => ({
          width: benefitsWidth,
          minHeight: 84,
          marginTop: spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
          opacity: pressed ? 0.78 : 1,
        })}
      >
        <Image
          source={recipesHowItWorks}
          resizeMode="cover"
          style={{
            width: 92,
            height: 64,
            borderRadius: radii.lg,
            opacity: theme.mode === "dark" ? 0.72 : 1,
          }}
        />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Saiba como funciona
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ lineHeight: 16 }}
          >
            Aprenda a criar suas receitas e aproveitar todos os recursos.
          </Typography>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: radii.full,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 0,
              height: 0,
              marginLeft: 3,
              borderTopWidth: 7,
              borderBottomWidth: 7,
              borderLeftWidth: 10,
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: theme.colors.primary,
            }}
          />
        </View>
      </Pressable>
    </ScrollView>
  );
}

interface RecipeListProps {
  readonly onRecipePress?: (id: string) => void;
  readonly onAddPress?: () => void;
}

export function RecipeList({ onRecipePress, onAddPress }: RecipeListProps) {
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const showAds = useShowAds();
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const categoryFilters = ["Todas", ...experienceCopy.categoryPresets];

  const category = selectedCategory === "Todas" ? undefined : selectedCategory;
  const { data, isLoading, error } = useRecipes({ category });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          paddingVertical: spacing.lg,
          ...pageGutter(isDesktop, spacing.lg),
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
      >
        <SkeletonList rows={6} variant="recipe" />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description={`Não foi possível carregar suas ${experienceCopy.formulaNounPlural}. Tente novamente.`}
      />
    );
  }

  if (!data?.items.length) {
    return <RecipesEmptyState onAddPress={onAddPress} />;
  }

  const listData = showAds ? interleaveAds(data.items) : data.items;

  return (
    <FlatList
      key={isDesktop ? "desktop-recipes" : "mobile-recipes"}
      data={listData}
      numColumns={isDesktop ? 2 : 1}
      columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return (
            <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
              <AdBanner size="banner" />
            </View>
          );
        }
        return (
          <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
            <RecipeCard recipe={item} onPress={() => onRecipePress?.(item.id)} />
          </View>
        );
      }}
      contentContainerStyle={{
        gap: spacing.md,
        paddingVertical: spacing.xl,
        ...pageGutter(isDesktop),
        ...desktopStretch(isDesktop, desktopWidths.data),
      }}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <Typography variant="body" style={{ flex: 1 }}>
              Gerencie seus custos e margens de lucro
            </Typography>
          </View>

          <FilterChipRow>
            {categoryFilters.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
              />
            ))}
          </FilterChipRow>
        </View>
      }
      ListFooterComponent={
        onAddPress ? (
          <View style={{ paddingTop: spacing.sm }}>
            <Button
              title="Adicionar receita"
              onPress={onAddPress}
              style={{ width: "100%" }}
            />
          </View>
        ) : null
      }
    />
  );
}
