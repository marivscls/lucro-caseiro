import { iconSizes, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateRecipeForm } from "../features/recipes/components/create-recipe-form";
import { EditRecipeForm } from "../features/recipes/components/edit-recipe-form";
import { RecipeDetail } from "../features/recipes/components/recipe-detail";
import { RecipeList } from "../features/recipes/components/recipe-list";
import { RecipeStatisticsModal } from "../features/recipes/components/recipe-statistics-modal";
import { useRecipe } from "../features/recipes/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { StandardModal } from "../shared/components/standard-modal";
import { FAB } from "../shared/components/fab";
import { ScreenHeader } from "../shared/components/screen-header";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { AppIcon } from "../shared/components/app-icon";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "statistics" }
  | { type: "detail"; recipeId: string }
  | { type: "edit"; recipeId: string };

function RecipesContent() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const showPaywall = usePaywall((s) => s.show);

  const editingRecipeId = modal.type === "edit" ? modal.recipeId : "";
  const { data: editingRecipe } = useRecipe(editingRecipeId);
  const detailRecipeId = modal.type === "detail" ? modal.recipeId : "";
  const { data: detailRecipe } = useRecipe(detailRecipeId);

  function closeModal() {
    setModal({ type: "none" });
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Receitas"
        hideBack={isDesktop}
        right={
          <Pressable
            onPress={() => setModal({ type: "statistics" })}
            accessibilityRole="button"
            accessibilityLabel="Estatísticas de receitas"
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}
          >
            <AppIcon
              name="stats-chart"
              size={iconSizes.sm}
              color={theme.colors.primaryStrong}
            />
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Estatísticas
            </Typography>
          </Pressable>
        }
      />

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="recipes"
          onUpgrade={() => showPaywall("recipes")}
          containerStyle={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}
        />
        <RecipeList
          onRecipePress={(id) => setModal({ type: "detail", recipeId: id })}
          onAddPress={() => setModal({ type: "create" })}
        />
      </View>

      {/* FAB - Nova receita */}
      <FAB
        icon="add"
        label="Nova receita"
        accessibilityLabel="Nova receita"
        onPress={() => setModal({ type: "create" })}
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      />

      {/* Modal - Criar receita */}
      <CreateRecipeForm
        visible={modal.type === "create"}
        onClose={closeModal}
        onSuccess={closeModal}
      />

      {modal.type === "statistics" ? (
        <RecipeStatisticsModal visible onClose={closeModal} />
      ) : null}

      {/* Modal - Detalhe da receita */}
      {modal.type === "detail" ? (
        <StandardModal
          visible
          onClose={closeModal}
          title={detailRecipe?.name ?? "Receita"}
        >
          <RecipeDetail
            recipeId={modal.recipeId}
            onEdit={() => setModal({ type: "edit", recipeId: modal.recipeId })}
            onDeleted={closeModal}
          />
        </StandardModal>
      ) : null}

      {/* Modal - Editar receita */}
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
