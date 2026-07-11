import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateRecipeForm } from "../features/recipes/components/create-recipe-form";
import { EditRecipeForm } from "../features/recipes/components/edit-recipe-form";
import { RecipeDetail } from "../features/recipes/components/recipe-detail";
import { RecipeList } from "../features/recipes/components/recipe-list";
import { useRecipe } from "../features/recipes/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { usePaywall } from "../shared/hooks/use-paywall";

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
            backgroundColor: `${theme.colors.primary}30`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={badgeIcon} size={22} color={theme.colors.primary} />
        </View>
      ) : null}
      <Typography
        variant="h1"
        serif
        color={theme.colors.text}
        numberOfLines={1}
        style={{ flex: 1, fontSize: 26 }}
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
        <Typography variant="bodyBold" color={theme.colors.primary}>
          Fechar
        </Typography>
      </Pressable>
    </View>
  );
}

export default function RecipesScreen() {
  const { theme } = useTheme();
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

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography variant="h2" color={theme.colors.text} style={{ flex: 1 }}>
          Receitas
        </Typography>
        <Pressable
          onPress={() => router.push("/insights")}
          accessibilityRole="button"
          accessibilityLabel="Estatísticas"
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
          <Typography variant="bodyBold" color={theme.colors.primary}>
            Estatísticas
          </Typography>
        </Pressable>
      </View>

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
      <Pressable
        onPress={() => setModal({ type: "create" })}
        accessibilityRole="button"
        accessibilityLabel="Nova receita"
        style={({ pressed }) => ({
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
          minHeight: 56,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.full,
          backgroundColor: theme.colors.primary,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        })}
      >
        <Ionicons name="add" size={26} color={theme.colors.textOnPrimary} />
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          Nova receita
        </Typography>
      </Pressable>

      {/* Modal - Criar receita */}
      <Modal
        visible={modal.type === "create"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <RecipeModalHeader title="Nova receita" leftIcon="close" onClose={closeModal} />
          <CreateRecipeForm onSuccess={closeModal} />
        </SafeAreaView>
      </Modal>

      {/* Modal - Detalhe da receita */}
      <Modal
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
      </Modal>

      {/* Modal - Editar receita */}
      <Modal
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
      </Modal>
    </SafeAreaView>
  );
}
