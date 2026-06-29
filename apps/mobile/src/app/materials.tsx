import {
  Button,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialCard } from "../features/materials/components/material-card";
import { MaterialForm } from "../features/materials/components/material-form";
import { buildShoppingList, isLowStock } from "../features/materials/domain";
import { useLowStockMaterials, useMaterials } from "../features/materials/hooks";
import materialsEmpty from "../assets/materials-empty.png";
import { useNotificationEnabled } from "../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../shared/hooks/notification-types";

function FormModalHeader({
  title,
  onClose,
}: Readonly<{ title: string; onClose: () => void }>) {
  const { theme } = useTheme();
  return (
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
        onPress={onClose}
        accessibilityRole="button"
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
        style={{ flex: 1, fontSize: 24, fontWeight: "800" }}
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
        <Typography
          variant="bodyBold"
          color={theme.colors.primary}
          style={{ fontSize: 17 }}
        >
          Fechar
        </Typography>
      </Pressable>
    </View>
  );
}

function LowStockBanner() {
  const { theme } = useTheme();
  const { data } = useLowStockMaterials();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);
  // Respeita a preferência "Estoque baixo" das configurações (igual a Produtos).
  if (!enabled || !data || data.length === 0) return null;

  function shareList() {
    if (!data) return;
    void Share.share({ message: buildShoppingList(data) });
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.alert}55`,
        backgroundColor: theme.colors.alertBg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.full,
          backgroundColor: `${theme.colors.alert}26`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="alert-circle" size={24} color={theme.colors.alert} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="bodyBold" color={theme.colors.alert}>
          {data.length === 1
            ? "1 insumo com estoque baixo"
            : `${data.length} insumos com estoque baixo`}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Revise e reponha para não ficar sem.
        </Typography>
      </View>
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
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
        }}
      >
        <Ionicons name="list" size={18} color={theme.colors.primary} />
        <Typography
          variant="bodyBold"
          color={theme.colors.primary}
          style={{ fontSize: 14 }}
        >
          Lista
        </Typography>
      </Pressable>
    </View>
  );
}

export default function MaterialsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useMaterials();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const items = data?.items ?? [];
  const selected = items.find((m) => m.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((m) => {
      if (lowOnly && !(isLowStock(m) || m.stockQuantity <= 0)) return false;
      return !query || m.name.toLowerCase().includes(query);
    });
  }, [items, search, lowOnly]);

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
          icon={
            <Image
              source={materialsEmpty}
              resizeMode="contain"
              style={{ width: 146, height: 146 }}
            />
          }
          title="Nenhum insumo ainda"
          description="Cadastre seus insumos (farinha, açúcar, embalagens...) para controlar o estoque."
          action={<Button title="Novo insumo" onPress={() => setShowCreate(true)} />}
        />
      );
    }
    if (visible.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.xl,
          }}
        >
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Nenhum insumo encontrado. Ajuste a busca ou o filtro.
          </Typography>
        </View>
      );
    }
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        <LowStockBanner />
        {visible.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onPress={() => setSelectedId(material.id)}
          />
        ))}
      </ScrollView>
    );
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
        <Typography
          variant="h1"
          color={theme.colors.text}
          style={{ flex: 1, fontSize: 28, fontWeight: "800" }}
        >
          Insumos
        </Typography>
        <Pressable
          onPress={() => {
            setSearchOpen((v) => !v);
            if (searchOpen) setSearch("");
          }}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </Pressable>
        <Pressable
          onPress={() => setLowOnly((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Filtrar estoque baixo"
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={lowOnly ? theme.colors.primary : theme.colors.text}
          />
        </Pressable>
      </View>

      {searchOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              minHeight: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: `${theme.colors.text}1f`,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar insumo"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 16,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>{renderContent()}</View>

      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm + insets.bottom,
          gap: spacing.md,
        }}
      >
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={24} color={theme.colors.textOnPrimary} />
          <Typography
            variant="bodyBold"
            color={theme.colors.textOnPrimary}
            style={{ fontSize: 18 }}
          >
            Novo insumo
          </Typography>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="bulb-outline" size={16} color={theme.colors.success} />
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ flex: 1 }}
          >
            Dica: mantenha seu estoque atualizado para uma gestão mais eficiente.
          </Typography>
        </View>
      </View>

      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <FormModalHeader title="Novo insumo" onClose={() => setShowCreate(false)} />
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
          <FormModalHeader title="Editar insumo" onClose={() => setSelectedId(null)} />
          {selected ? (
            <MaterialForm material={selected} onSuccess={() => setSelectedId(null)} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
