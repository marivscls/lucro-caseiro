import type { Label } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateLabelForm } from "../features/labels/components/create-label-form";
import { LabelPreview } from "../features/labels/components/label-preview";
import { useLabels } from "../features/labels/hooks";

export default function LabelsScreen() {
  const { theme } = useTheme();
  const { data, isLoading, error } = useLabels();
  const [showCreate, setShowCreate] = useState(false);
  const [previewLabel, setPreviewLabel] = useState<Label | null>(null);

  function renderContent() {
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
          description="Nao foi possivel carregar seus rotulos."
        />
      );
    }
    if (!data?.items.length) {
      return (
        <EmptyState
          title="Nenhum rotulo ainda"
          description="Crie rotulos para seus produtos"
          action={<Button title="Criar rotulo" onPress={() => setShowCreate(true)} />}
        />
      );
    }
    return (
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        renderItem={({ item }) => (
          <Card onPress={() => setPreviewLabel(item)}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ gap: 2 }}>
                <Typography variant="bodyBold">{item.name}</Typography>
                <Typography variant="caption">Template: {item.templateId}</Typography>
              </View>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
              </Typography>
            </View>
          </Card>
        )}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderContent()}

      {/* FAB */}
      <View style={{ position: "absolute", bottom: 100, right: 20 }}>
        <Button
          title="+ Novo rotulo"
          onPress={() => setShowCreate(true)}
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

      {/* Modal - Criar rotulo */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowCreate(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <CreateLabelForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Modal - Preview rotulo */}
      {previewLabel && (
        <Modal
          visible={true}
          animationType="fade"
          presentationStyle="pageSheet"
          onRequestClose={() => setPreviewLabel(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                padding: spacing.lg,
              }}
            >
              <Pressable onPress={() => setPreviewLabel(null)}>
                <Typography variant="bodyBold" color={theme.colors.primary}>
                  Fechar
                </Typography>
              </Pressable>
            </View>
            <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
              <LabelPreview
                templateId={previewLabel.templateId}
                data={previewLabel.data}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
