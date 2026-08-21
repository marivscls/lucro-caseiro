import { iconSizes, spacing, useTheme } from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateRecipeForm } from "../features/recipes/components/create-recipe-form";
import { EditRecipeForm } from "../features/recipes/components/edit-recipe-form";
import { RecipeDetail } from "../features/recipes/components/recipe-detail";
import { RecipeList } from "../features/recipes/components/recipe-list";
import { RecipeStatisticsModal } from "../features/recipes/components/recipe-statistics-modal";
import { useRecipe } from "../features/recipes/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { useBrandScreenPalette } from "../shared/brand-palette";
import { AppIcon } from "../shared/components/app-icon";
import { FAB } from "../shared/components/fab";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { ScreenHeader } from "../shared/components/screen-header";
import { StandardModal } from "../shared/components/standard-modal";
import { usePaywall } from "../shared/hooks/use-paywall";
import { displayIngredientName } from "../shared/ingredient-image/resolve";
import {
  desktopContained,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "statistics" }
  | { type: "detail"; recipeId: string }
  | { type: "edit"; recipeId: string };

function RecipesContent() {
  const pal = useBrandScreenPalette();
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const showPaywall = usePaywall((s) => s.show);

  const editingRecipeId = modal.type === "edit" ? modal.recipeId : "";
  const { data: editingRecipe } = useRecipe(editingRecipeId);
  const detailRecipeId = modal.type === "detail" ? modal.recipeId : "";
  const { data: detailRecipe } = useRecipe(detailRecipeId);

  function closeModal() {
    setModal({ type: "none" });
  }

  const pageFrame = {
    ...pageGutter(isDesktop),
    ...desktopContained(isDesktop, desktopWidths.standard),
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: pal.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, width: "100%", ...pageFrame }}>
        <ScreenHeader
          title="Receitas"
          hideBack={isDesktop}
          style={{ paddingHorizontal: 0 }}
          titleStyle={{ color: pal.wine }}
          backButtonStyle={{ marginLeft: -spacing.sm }}
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Pressable
                onPress={() => setModal({ type: "statistics" })}
                accessibilityRole="button"
                accessibilityLabel="Estatísticas de receitas"
                hitSlop={10}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="bar-chart-outline" size={iconSizes.md} color={pal.wine} />
              </Pressable>
              <FAB
                icon="add"
                header
                accessibilityLabel="Nova receita"
                onPress={() => setModal({ type: "create" })}
                style={{ backgroundColor: pal.rose, ...theme.shadows.sm }}
              />
            </View>
          }
        />

        <View style={{ flex: 1 }}>
          <LimitBanner
            resource="recipes"
            onUpgrade={() => showPaywall("recipes")}
            containerStyle={{ marginTop: spacing.sm }}
          />
          <RecipeList
            onRecipePress={(id) => setModal({ type: "detail", recipeId: id })}
            onAddPress={() => setModal({ type: "create" })}
            onEditPress={(id) => setModal({ type: "edit", recipeId: id })}
          />
        </View>
      </View>

      <CreateRecipeForm
        visible={modal.type === "create"}
        onClose={closeModal}
        onSuccess={closeModal}
      />

      {modal.type === "statistics" ? (
        <RecipeStatisticsModal visible onClose={closeModal} />
      ) : null}

      {modal.type === "detail" ? (
        <StandardModal
          visible
          onClose={closeModal}
          title={detailRecipe ? displayIngredientName(detailRecipe.name) : "Receita"}
        >
          <RecipeDetail
            recipeId={modal.recipeId}
            onEdit={() => setModal({ type: "edit", recipeId: modal.recipeId })}
            onDeleted={closeModal}
          />
        </StandardModal>
      ) : null}

      {modal.type === "edit" && editingRecipe ? (
        <EditRecipeForm
          recipe={editingRecipe}
          visible
          onClose={closeModal}
          onSuccess={closeModal}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function RecipesScreen() {
  return (
    <FeatureRouteGuard feature="fichaTecnica">
      <RecipesContent />
    </FeatureRouteGuard>
  );
}
