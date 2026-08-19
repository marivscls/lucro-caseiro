import type { Material } from "@lucro-caseiro/contracts";
import {
  Button,
  EmptyState,
  fonts,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  buildShoppingList,
  formatQty,
  groupShoppingListItems,
} from "../features/materials/domain";
import { useLowStockMaterials } from "../features/materials/hooks";
import { AppIcon } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { showToast } from "../shared/components/toast";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

function ShoppingListItem({
  material,
  selected,
  onToggle,
}: Readonly<{
  material: Material;
  selected: boolean;
  onToggle: () => void;
}>) {
  const { theme } = useTheme();
  const isOutOfStock = material.stockQuantity <= 0;
  const minimum = material.stockAlertThreshold;
  const idleOpacity = selected ? 1 : 0.68;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${material.name}, estoque atual ${formatQty(material.stockQuantity)} ${material.unit}`}
      style={({ pressed }) => ({
        minHeight: 76,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.76 : idleOpacity,
      })}
    >
      <AppIcon
        name={selected ? "checkbox" : "square-outline"}
        size={24}
        color={selected ? theme.colors.primary : theme.colors.textSecondary}
      />
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="bodyBold" numberOfLines={1}>
          {material.name}
        </Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Typography
            variant="caption"
            color={isOutOfStock ? theme.colors.alert : theme.colors.textSecondary}
            style={{ fontFamily: isOutOfStock ? fonts.bold : fonts.regular }}
          >
            Atual: {formatQty(material.stockQuantity)} {material.unit}
          </Typography>
          {minimum != null ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Mínimo: {formatQty(minimum)} {material.unit}
            </Typography>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ShoppingListSection({
  title,
  tone,
  items,
  deselectedIds,
  onToggle,
}: Readonly<{
  title: string;
  tone: "alert" | "warning";
  items: Material[];
  deselectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}>) {
  const { theme } = useTheme();
  if (items.length === 0) return null;

  const color = tone === "alert" ? theme.colors.alert : theme.colors.primaryStrong;
  const backgroundColor =
    tone === "alert" ? theme.colors.alertBg : theme.colors.primaryBg;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: radii.full,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon
            name={tone === "alert" ? "alert-circle-outline" : "cube-outline"}
            size={19}
            color={color}
          />
        </View>
        <Typography variant="h3" style={{ flex: 1 }}>
          {title}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {items.length} {items.length === 1 ? "item" : "itens"}
        </Typography>
      </View>

      {items.map((material) => (
        <ShoppingListItem
          key={material.id}
          material={material}
          selected={!deselectedIds.has(material.id)}
          onToggle={() => onToggle(material.id)}
        />
      ))}
    </View>
  );
}

function BuyMaterialsContent() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const { data = [], isLoading, error, refetch } = useLowStockMaterials();
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(() => new Set());

  const { outOfStock, lowStock } = useMemo(() => groupShoppingListItems(data), [data]);
  const selectedItems = useMemo(
    () => data.filter((material) => !deselectedIds.has(material.id)),
    [data, deselectedIds],
  );
  const allSelected = data.length > 0 && selectedItems.length === data.length;

  function toggle(id: string) {
    setDeselectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setDeselectedIds(
      allSelected ? new Set(data.map((material) => material.id)) : new Set(),
    );
  }

  async function shareList() {
    if (selectedItems.length === 0) return;
    await Share.share({ message: buildShoppingList(selectedItems) });
  }

  async function copyList() {
    if (selectedItems.length === 0 || Platform.OS !== "web") return;
    try {
      await navigator.clipboard.writeText(buildShoppingList(selectedItems));
      showToast("Lista copiada!");
    } catch {
      showAlert({
        title: "Não foi possível copiar",
        message: "Tente novamente ou use Compartilhar lista.",
      });
    }
  }

  function renderContent() {
    if (isLoading) {
      return (
        <View
          style={{
            flex: 1,
            paddingVertical: spacing.xl,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.wide),
          }}
        >
          <SkeletonList rows={5} variant="material" />
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Algo deu errado"
          description="Não foi possível carregar os insumos que precisam de reposição."
          action={<Button title="Tentar novamente" onPress={() => void refetch()} />}
        />
      );
    }

    if (data.length === 0) {
      return (
        <EmptyState
          icon={
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.full,
                backgroundColor: theme.colors.successBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="checkmark-circle-outline"
                size={38}
                color={theme.colors.success}
              />
            </View>
          }
          title="Estoque em dia"
          description="Nenhum insumo precisa ser comprado agora."
          action={
            <Button
              title="Revisar estoque"
              variant="secondary"
              onPress={() => router.replace("/tabs/materials")}
            />
          }
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.wide),
          paddingTop: spacing.md,
          paddingBottom: spacing.xl + insets.bottom,
          gap: spacing.xl,
        }}
      >
        <View
          style={{
            minHeight: 52,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surfaceElevated,
            paddingHorizontal: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Typography variant="body" style={{ flex: 1 }}>
            {selectedItems.length} de {data.length} selecionados
          </Typography>
          <Pressable
            onPress={toggleAll}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allSelected }}
            accessibilityLabel={allSelected ? "Desmarcar todos" : "Selecionar todos"}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Typography
              variant="bodyBold"
              color={theme.colors.primaryStrong}
              style={{ fontFamily: fonts.bold }}
            >
              {allSelected ? "Desmarcar todos" : "Selecionar todos"}
            </Typography>
          </Pressable>
        </View>

        <ShoppingListSection
          title="Sem estoque"
          tone="alert"
          items={outOfStock}
          deselectedIds={deselectedIds}
          onToggle={toggle}
        />
        <ShoppingListSection
          title="Estoque baixo"
          tone="warning"
          items={lowStock}
          deselectedIds={deselectedIds}
          onToggle={toggle}
        />

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "flex-end",
            gap: spacing.md,
            paddingTop: spacing.sm,
          }}
        >
          {isDesktop && Platform.OS === "web" ? (
            <Button
              title="Copiar lista"
              variant="outline"
              disabled={selectedItems.length === 0}
              onPress={() => void copyList()}
              icon={
                <AppIcon
                  name="clipboard-outline"
                  size={19}
                  color={theme.colors.primaryStrong}
                />
              }
              style={{ minWidth: 180 }}
            />
          ) : null}
          <Button
            title="Compartilhar lista"
            disabled={selectedItems.length === 0}
            onPress={() => void shareList()}
            icon={
              <AppIcon
                name="share-social-outline"
                size={19}
                color={theme.colors.textOnPrimary}
              />
            }
            style={isDesktop ? { minWidth: 220 } : { width: "100%", minHeight: 52 }}
          />
        </View>
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
        title="Comprar insumos"
        subtitle="Lista gerada com os insumos abaixo do estoque mínimo"
        fallbackRoute="/tabs/materials"
      />
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
}

export default function BuyMaterialsScreen() {
  return (
    <FeatureRouteGuard feature="materiais">
      <BuyMaterialsContent />
    </FeatureRouteGuard>
  );
}
