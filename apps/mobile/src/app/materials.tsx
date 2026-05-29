import {
  Button,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaterialCard } from "../features/materials/components/material-card";
import { MaterialForm } from "../features/materials/components/material-form";
import { useLowStockMaterials, useMaterials } from "../features/materials/hooks";

function LowStockBanner() {
  const { theme } = useTheme();
  const { data } = useLowStockMaterials();
  if (!data || data.length === 0) return null;
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
    </View>
  );
}

export default function MaterialsScreen() {
  const { theme } = useTheme();
  const { data, isLoading } = useMaterials();
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
    if (items.length === 0) {
      return (
        <EmptyState
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
            paddingBottom: spacing["5xl"],
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

      <View style={{ position: "absolute", bottom: spacing.xl, right: spacing.xl }}>
        <Button title="+ Novo insumo" onPress={() => setShowCreate(true)} size="md" />
      </View>

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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setSelectedId(null)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          {selected ? (
            <MaterialForm material={selected} onSuccess={() => setSelectedId(null)} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
