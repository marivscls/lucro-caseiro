import { fontSizes, iconSizes, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateSupplierForm } from "../features/suppliers/components/create-supplier-form";
import { EditSupplierForm } from "../features/suppliers/components/edit-supplier-form";
import { SupplierDetail } from "../features/suppliers/components/supplier-detail";
import { SupplierList } from "../features/suppliers/components/supplier-list";
import { SupplierTable } from "../features/suppliers/components/supplier-table";
import { useDeleteSupplier, useSupplier } from "../features/suppliers/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { showAlert } from "../shared/components/alert-store";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { StandardModal } from "../shared/components/standard-modal";
import { ScreenHeader } from "../shared/components/screen-header";

export default function SuppliersScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const showPaywall = usePaywall((s) => s.show);
  const deleteSupplier = useDeleteSupplier();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const { data: selected } = useSupplier(selectedId ?? "");

  const border = theme.colors.border;

  function closeDetail() {
    setSelectedId(null);
    setEditing(false);
  }

  function deleteById(id: string) {
    deleteSupplier
      .mutateAsync(id)
      .then(closeDetail)
      .catch(() => alertError("Não foi possível excluir o fornecedor."));
  }

  function confirmDelete(id: string, name: string) {
    showAlert({
      title: "Excluir fornecedor",
      message: `Tem certeza que deseja excluir ${name}?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteById(id),
        },
      ],
    });
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <ScreenHeader
        title="Fornecedores"
        hideBack={isDesktop}
        style={{ gap: spacing.sm }}
        right={
          <Pressable
            onPress={() => setShowCreate(true)}
            accessibilityRole="button"
            accessibilityLabel="Novo fornecedor"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primaryInteractive,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name="add" size={iconSizes.md} color={theme.colors.textOnPrimary} />
          </Pressable>
        }
      />

      {/* Search */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <View
          style={{
            minHeight: 48,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          }}
        >
          <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar fornecedor..."
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: fontSizes.md,
              paddingVertical: 0,
            }}
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="suppliers"
          onUpgrade={() => showPaywall("suppliers")}
          containerStyle={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}
        />
        {isDesktop ? (
          <SupplierTable
            search={search.trim() || undefined}
            onSupplierPress={(id) => {
              setSelectedId(id);
              setEditing(false);
            }}
            onEditPress={(supplier) => {
              setSelectedId(supplier.id);
              setEditing(true);
            }}
            onDeletePress={(supplier) => confirmDelete(supplier.id, supplier.name)}
            onAddPress={() => setShowCreate(true)}
          />
        ) : (
          <SupplierList
            search={search.trim() || undefined}
            onSupplierPress={(id) => {
              setSelectedId(id);
              setEditing(false);
            }}
            onAddPress={() => setShowCreate(true)}
          />
        )}
      </View>

      {/* Modal: criar */}
      <CreateSupplierForm
        modal={{ visible: showCreate, onClose: () => setShowCreate(false) }}
        onSuccess={() => setShowCreate(false)}
      />

      {/* Modal: detalhe */}
      {selectedId && !editing ? (
        <StandardModal
          visible
          onClose={closeDetail}
          title="Fornecedor"
          right={
            <Pressable
              onPress={() => {
                if (!selected) return;
                confirmDelete(selected.id, selected.name);
              }}
              accessibilityRole="button"
              accessibilityLabel="Excluir fornecedor"
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <AppIcon name="trash-outline" size={22} color={theme.colors.alert} />
            </Pressable>
          }
        >
          <SupplierDetail supplierId={selectedId} onEditPress={() => setEditing(true)} />
        </StandardModal>
      ) : null}

      {/* Modal: editar */}
      {editing && selected ? (
        <EditSupplierForm
          supplier={selected}
          visible={!!selectedId && editing}
          onClose={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
