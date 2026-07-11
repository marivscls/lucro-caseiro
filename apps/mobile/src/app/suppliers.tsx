import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateSupplierForm } from "../features/suppliers/components/create-supplier-form";
import { EditSupplierForm } from "../features/suppliers/components/edit-supplier-form";
import { SupplierDetail } from "../features/suppliers/components/supplier-detail";
import { SupplierList } from "../features/suppliers/components/supplier-list";
import { useDeleteSupplier, useSupplier } from "../features/suppliers/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { showAlert } from "../shared/components/alert-store";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";

export default function SuppliersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const showPaywall = usePaywall((s) => s.show);
  const deleteSupplier = useDeleteSupplier();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const { data: selected } = useSupplier(selectedId ?? "");

  const isDark = theme.mode === "dark";
  const border = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)";

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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
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
        <Typography
          variant="h1"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          Fornecedores
        </Typography>
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
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={26} color={theme.colors.textOnPrimary} />
        </Pressable>
      </View>

      {/* Search */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
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
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar fornecedor..."
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 16,
              paddingVertical: 0,
            }}
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
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
        <SupplierList
          search={search.trim() || undefined}
          onSupplierPress={(id) => {
            setSelectedId(id);
            setEditing(false);
          }}
          onAddPress={() => setShowCreate(true)}
        />
      </View>

      {/* Modal: criar */}
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
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setShowCreate(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              style={{ flex: 1, fontSize: 24 }}
            >
              Novo fornecedor
            </Typography>
          </View>
          <CreateSupplierForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Modal: detalhe / editar */}
      <Modal
        visible={!!selectedId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {selectedId && !editing ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.sm,
                }}
              >
                <Pressable onPress={closeDetail} hitSlop={10}>
                  <Typography variant="bodyBold" color={theme.colors.primary}>
                    Fechar
                  </Typography>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!selected) return;
                    showAlert({
                      title: "Excluir fornecedor",
                      message: `Tem certeza que deseja excluir ${selected.name}?`,
                      buttons: [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Excluir",
                          style: "destructive",
                          onPress: () => deleteById(selected.id),
                        },
                      ],
                    });
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="trash-outline" size={22} color={theme.colors.alert} />
                </Pressable>
              </View>
              <SupplierDetail
                supplierId={selectedId}
                onEditPress={() => setEditing(true)}
              />
            </>
          ) : null}

          {selectedId && editing && selected ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.sm,
                  gap: spacing.md,
                }}
              >
                <Pressable
                  onPress={() => setEditing(false)}
                  accessibilityLabel="Voltar"
                  hitSlop={10}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </Pressable>
                <Typography
                  variant="h1"
                  color={theme.colors.text}
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 22 }}
                >
                  Editar fornecedor
                </Typography>
              </View>
              <EditSupplierForm supplier={selected} onSuccess={() => setEditing(false)} />
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
