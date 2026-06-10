import {
  Button,
  EmptyState,
  ModalHeader,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialCard } from "../features/materials/components/material-card";
import { MaterialForm } from "../features/materials/components/material-form";
import { buildShoppingList } from "../features/materials/domain";
import { useLowStockMaterials, useMaterials } from "../features/materials/hooks";
import { Illustration } from "../shared/components/illustrations";

function LowStockBanner() {
  const { theme } = useTheme();
  const { data } = useLowStockMaterials();
  if (!data || data.length === 0) return null;

  function shareList() {
    if (!data) return;
    void Share.share({ message: buildShoppingList(data) });
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        margin: spacing.xl,
        marginBottom: 0,
        padding: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.alertBg,
      }}
    >
      <Ionicons name="alert-circle" size={20} color={theme.colors.alert} />
      <Typography variant="caption" color={theme.colors.text} style={{ flex: 1 }}>
        {data.length === 1
          ? "1 insumo com estoque baixo"
          : `${data.length} insumos com estoque baixo`}
      </Typography>
      <Pressable
        onPress={shareList}
        accessibilityRole="button"
        accessibilityLabel="Compartilhar lista de compras"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Ionicons name="share-social-outline" size={16} color={theme.colors.primary} />
        <Typography variant="caption" color={theme.colors.primary}>
          Lista
        </Typography>
      </Pressable>
    </View>
  );
}

export default function MaterialsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useMaterials();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const selected = items.find((m) => m.id === selectedId) ?? null;

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
          description="Não foi possível carregar seus insumos. Tente novamente."
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Illustration name="jars" />}
          title="Nenhum insumo ainda"
          description="Cadastre seus insumos (farinha, açúcar, embalagens...) para controlar o estoque."
          action={<Button title="Novo insumo" onPress={() => setShowCreate(true)} />}
        />
      );
    }
    return (
      <>
        <LowStockBanner />
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: 96 + insets.bottom,
            gap: spacing.md,
          }}
        >
          {items.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onPress={() => setSelectedId(material.id)}
            />
          ))}
        </ScrollView>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderContent()}

      <View
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      >
        <Button title="+ Novo insumo" onPress={() => setShowCreate(true)} size="md" />
      </View>

      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Novo insumo" onClose={() => setShowCreate(false)} />
          <MaterialForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedId(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Editar insumo" onClose={() => setSelectedId(null)} />
          {selected ? (
            <MaterialForm material={selected} onSuccess={() => setSelectedId(null)} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
