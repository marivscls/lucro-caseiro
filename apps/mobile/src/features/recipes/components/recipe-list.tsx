import {
  EmptyState,
  Typography,
  fonts,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { useRecipes } from "../hooks";
import { RecipeCard } from "./recipe-card";
import recipesEmpty from "../../../assets/recipes-empty.png";

function FeatureCol({
  icon,
  title,
  desc,
}: Readonly<{ icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.xs,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(196, 112, 126, 0.35)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Typography
        variant="caption"
        color={theme.colors.text}
        style={{ fontFamily: fonts.bold, textAlign: "center" }}
      >
        {title}
      </Typography>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", lineHeight: 16 }}
      >
        {desc}
      </Typography>
    </View>
  );
}

function RecipesEmptyState({ onAddPress }: Readonly<{ onAddPress?: () => void }>) {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.55)" : theme.colors.surface;
  const border = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)";

  function howItWorks() {
    showAlert({
      title: "Como funciona",
      message:
        "Cadastre uma receita com os insumos e o rendimento. O app calcula o custo por unidade e ajuda você a definir o preço com lucro.",
    });
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.xl,
        // Espaço extra no fundo pra o "Saiba como funciona" não ficar embaixo
        // do FAB "Nova receita" (renderizado por cima pela tela).
        paddingBottom: spacing.xl + 96,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
      }}
    >
      <Image
        source={recipesEmpty}
        style={{ width: 240, height: 200 }}
        resizeMode="contain"
      />
      <Typography
        variant="h1"
        serif
        color={theme.colors.text}
        style={{ textAlign: "center" }}
      >
        Nenhuma receita ainda
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center", lineHeight: 22 }}
      >
        Cadastre sua primeira receita para começar a calcular seus custos e lucros.
      </Typography>

      <Pressable
        onPress={onAddPress}
        accessibilityRole="button"
        style={({ pressed }) => ({
          alignSelf: "stretch",
          minHeight: 56,
          borderRadius: radii.lg,
          backgroundColor: theme.colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons
          name="document-text-outline"
          size={22}
          color={theme.colors.textOnPrimary}
        />
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          Cadastrar receita
        </Typography>
      </Pressable>

      <View
        style={{
          alignSelf: "stretch",
          flexDirection: "row",
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: cardBg,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.sm,
        }}
      >
        <FeatureCol
          icon="calculator-outline"
          title="Calcule custos"
          desc="Saiba exatamente quanto cada receita custa."
        />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: border }} />
        <FeatureCol
          icon="trending-up-outline"
          title="Acompanhe lucros"
          desc="Veja suas margens e aumente seus resultados."
        />
        <View style={{ width: 1, alignSelf: "stretch", backgroundColor: border }} />
        <FeatureCol
          icon="time-outline"
          title="Economize tempo"
          desc="Receitas organizadas e fáceis de consultar sempre que precisar."
        />
      </View>

      <Pressable
        onPress={howItWorks}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 48,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="play-circle-outline" size={20} color={theme.colors.primary} />
        <Typography variant="bodyBold" color={theme.colors.primary}>
          Saiba como funciona
        </Typography>
      </Pressable>
    </ScrollView>
  );
}

interface RecipeListProps {
  readonly onRecipePress?: (id: string) => void;
  readonly onAddPress?: () => void;
}

const CATEGORY_FILTERS = ["Todas", "Doces", "Salgados", "Bolos", "Bebidas", "Outros"];

export function RecipeList({ onRecipePress, onAddPress }: RecipeListProps) {
  const { theme } = useTheme();
  const showAds = useShowAds();
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const category = selectedCategory === "Todas" ? undefined : selectedCategory;
  const { data, isLoading, error } = useRecipes({ category });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Não foi possível carregar suas receitas. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return <RecipesEmptyState onAddPress={onAddPress} />;
  }

  const listData = showAds ? interleaveAds(data.items) : data.items;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return <AdBanner size="banner" />;
        }
        return <RecipeCard recipe={item} onPress={() => onRecipePress?.(item.id)} />;
      }}
      contentContainerStyle={{ gap: spacing.md, padding: spacing.xl }}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg }}>
          {/* Serif title */}
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h1">Receitas</Typography>
            <Typography variant="body">
              Gerencie seus custos e margens de lucro
            </Typography>
          </View>

          {/* Filter chips */}
          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            {CATEGORY_FILTERS.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor:
                    selectedCategory === cat
                      ? theme.colors.primary
                      : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={
                    selectedCategory === cat
                      ? theme.colors.textOnPrimary
                      : theme.colors.textSecondary
                  }
                >
                  {cat}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
    />
  );
}
