import {
  Button,
  EmptyState,
  fontSizes,
  iconSizes,
  Typography,
  fonts,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialCard } from "../features/materials/components/material-card";
import { MaterialForm } from "../features/materials/components/material-form";
import { buildShoppingList, isLowStock } from "../features/materials/domain";
import { useLowStockMaterials, useMaterials } from "../features/materials/hooks";
import materialsEmpty from "../assets/materials-empty.png";
import { useNotificationEnabled } from "../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../shared/hooks/notification-types";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";

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
        <AppIcon name="alert-circle" size={24} color={theme.colors.alert} />
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
          borderColor: `${theme.colors.primaryStrong}66`,
        }}
      >
        <AppIcon name="list" size={18} color={theme.colors.primaryStrong} />
        <Typography
          variant="bodyBold"
          color={theme.colors.primaryStrong}
          style={{ fontSize: fontSizes.sm }}
        >
          Lista
        </Typography>
      </Pressable>
    </View>
  );
}

function MaterialsScreenContent() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
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
        <View style={{ flex: 1, padding: spacing.xl }}>
          <SkeletonList rows={6} />
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
          action={
            <Button
              title="Novo insumo"
              variant="outline"
              onPress={() => setShowCreate(true)}
            />
          }
        />
      );
    }
    if (visible.length === 0) {
      const lowFilterEmpty = lowOnly && !search.trim();
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            {lowFilterEmpty
              ? "Nenhum insumo com estoque baixo. Está tudo em dia! 🎉"
              : "Nenhum insumo encontrado. Ajuste a busca ou o filtro."}
          </Typography>
          {lowOnly ? (
            <Button
              title="Ver todos os insumos"
              variant="secondary"
              onPress={() => setLowOnly(false)}
            />
          ) : null}
        </View>
      );
    }
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
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

      <ScreenHeader
        title="Insumos"
        hideBack={isDesktop}
        right={
          <>
            <Pressable
              onPress={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setSearch("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Buscar"
              hitSlop={10}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="search" size={iconSizes.md} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={() => setLowOnly((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Filtrar estoque baixo"
              hitSlop={10}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="options-outline"
                size={iconSizes.md}
                color={lowOnly ? theme.colors.primaryStrong : theme.colors.text}
              />
            </Pressable>
          </>
        }
      />

      {searchOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              minHeight: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
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
              placeholder="Buscar insumo"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: fontSizes.md,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
      ) : null}

      {lowOnly ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <Pressable
            onPress={() => setLowOnly(false)}
            accessibilityRole="button"
            accessibilityLabel="Remover filtro de estoque baixo"
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              minHeight: 36,
              paddingHorizontal: spacing.md,
              borderRadius: radii.full,
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <AppIcon
              name="funnel"
              size={iconSizes.xs}
              color={theme.colors.primaryStrong}
            />
            <Typography
              variant="caption"
              color={theme.colors.primaryStrong}
              style={{ fontFamily: fonts.bold }}
            >
              Estoque baixo
            </Typography>
            <AppIcon name="close" size={16} color={theme.colors.primaryStrong} />
          </Pressable>
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
            alignSelf: isDesktop ? "flex-end" : undefined,
            width: isDesktop ? 180 : undefined,
            minHeight: isDesktop ? 44 : 56,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primaryInteractive,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppIcon
            name="add"
            size={isDesktop ? 20 : 24}
            color={theme.colors.textOnPrimary}
          />
          <Typography
            variant={isDesktop ? "bodyBold" : "h3"}
            color={theme.colors.textOnPrimary}
          >
            Novo insumo
          </Typography>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <AppIcon name="bulb-outline" size={16} color={theme.colors.textSecondary} />
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ flex: 1 }}
          >
            Dica: mantenha seu estoque atualizado para uma gestão mais eficiente.
          </Typography>
        </View>
      </View>

      <MaterialForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        existingMaterials={items}
        onSuccess={() => setShowCreate(false)}
      />

      {selected ? (
        <MaterialForm
          visible
          onClose={() => setSelectedId(null)}
          material={selected}
          existingMaterials={items}
          onSuccess={() => setSelectedId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function MaterialsScreen() {
  return (
    <FeatureRouteGuard feature="materiais">
      <MaterialsScreenContent />
    </FeatureRouteGuard>
  );
}
