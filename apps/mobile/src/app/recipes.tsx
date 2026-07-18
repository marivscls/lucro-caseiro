import { iconSizes, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateRecipeForm } from "../features/recipes/components/create-recipe-form";
import { EditRecipeForm } from "../features/recipes/components/edit-recipe-form";
import { RecipeDetail } from "../features/recipes/components/recipe-detail";
import { RecipeList } from "../features/recipes/components/recipe-list";
import { useRecipe } from "../features/recipes/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { ResponsiveModal } from "../shared/components/responsive-modal-surface";
import { FAB } from "../shared/components/fab";
import { ScreenHeader } from "../shared/components/screen-header";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "detail"; recipeId: string }
  | { type: "edit"; recipeId: string };

/** Header dos modais de receita: ícone esquerdo + (badge) + título serif + Fechar. */
function RecipeModalHeader({
  title,
  leftIcon,
  badgeIcon,
  onClose,
}: Readonly<{
  title: string;
  leftIcon: keyof typeof Ionicons.glyphMap;
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
      }}
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={10}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Ionicons name={leftIcon} size={28} color={theme.colors.text} />
      </Pressable>
      {badgeIcon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={badgeIcon} size={22} color={theme.colors.textSecondary} />
        </View>
      ) : null}
      <Typography
        variant="h1"
        serif
        color={theme.colors.text}
        numberOfLines={1}
        style={{ flex: 1 }}
      >
        {title}
      </Typography>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={10}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
          Fechar
        </Typography>
      </Pressable>
    </View>
  );
}

function RecipesContent() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
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
            onPress={() => router.push("/insights")}
            accessibilityRole="button"
            accessibilityLabel="Estatísticas"
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}
          >
            <Ionicons
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
      <ResponsiveModal
        desktopMaxWidth={1120}
        visible={modal.type === "create"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <RecipeModalHeader title="Nova receita" leftIcon="close" onClose={closeModal} />
          <CreateRecipeForm onSuccess={closeModal} />
        </SafeAreaView>
      </ResponsiveModal>

      {/* Modal - Detalhe da receita */}
      <ResponsiveModal
        desktopMaxWidth={1120}
        visible={modal.type === "detail"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <RecipeModalHeader
            title={detailRecipe?.name ?? "Receita"}
            leftIcon="arrow-back"
            onClose={closeModal}
          />
          {modal.type === "detail" && (
            <RecipeDetail
              recipeId={modal.recipeId}
              onEdit={() => setModal({ type: "edit", recipeId: modal.recipeId })}
              onDeleted={closeModal}
            />
          )}
        </SafeAreaView>
      </ResponsiveModal>

      {/* Modal - Editar receita */}
      <ResponsiveModal
        desktopMaxWidth={1120}
        visible={modal.type === "edit" && !!editingRecipe}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <RecipeModalHeader
            title="Editar receita"
            leftIcon="arrow-back"
            badgeIcon="ice-cream-outline"
            onClose={closeModal}
          />
          {editingRecipe && (
            <EditRecipeForm recipe={editingRecipe} onSuccess={closeModal} />
          )}
        </SafeAreaView>
      </ResponsiveModal>
    </SafeAreaView>
  );
}

export default function RecipesScreen() {
  return <RecipesContent />;
}
