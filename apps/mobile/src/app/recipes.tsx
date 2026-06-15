import { Button, ModalHeader, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Modal, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateRecipeForm } from "../features/recipes/components/create-recipe-form";
import { EditRecipeForm } from "../features/recipes/components/edit-recipe-form";
import { RecipeDetail } from "../features/recipes/components/recipe-detail";
import { RecipeList } from "../features/recipes/components/recipe-list";
import { useRecipe } from "../features/recipes/hooks";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "detail"; recipeId: string }
  | { type: "edit"; recipeId: string };

export default function RecipesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const editingRecipeId = modal.type === "edit" ? modal.recipeId : "";
  const { data: editingRecipe } = useRecipe(editingRecipeId);

  function closeModal() {
    setModal({ type: "none" });
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
      <View style={{ flex: 1 }}>
        <RecipeList
          onRecipePress={(id) => setModal({ type: "detail", recipeId: id })}
          onAddPress={() => setModal({ type: "create" })}
        />
      </View>

      {/* FAB - Nova receita */}
      <View
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      >
        <Button
          title="+ Nova receita"
          onPress={() => setModal({ type: "create" })}
          size="md"
          style={{
            borderRadius: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
      </View>

      {/* Modal - Criar receita */}
      <Modal
        visible={modal.type === "create"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Nova receita" onClose={closeModal} />
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
          <ModalHeader title="Detalhes da receita" onClose={closeModal} />
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
          <ModalHeader title="Editar receita" onClose={closeModal} />
          {editingRecipe && (
            <EditRecipeForm recipe={editingRecipe} onSuccess={closeModal} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
