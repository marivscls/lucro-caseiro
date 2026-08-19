import { hasActiveFeature, type SupplierOverviewItem } from "@lucro-caseiro/contracts";
import { Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreatePurchaseForm } from "../features/purchases/components/create-purchase-form";
import { useProfile } from "../features/subscription/hooks";
import { CreateSupplierForm } from "../features/suppliers/components/create-supplier-form";
import { EditSupplierForm } from "../features/suppliers/components/edit-supplier-form";
import { SupplierDetail } from "../features/suppliers/components/supplier-detail";
import { SupplierList } from "../features/suppliers/components/supplier-list";
import {
  useDeleteSupplier,
  useSupplier,
  useUpdateSupplier,
} from "../features/suppliers/hooks";
import { supplierPurchasePrefill } from "../features/suppliers/domain";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { FAB } from "../shared/components/fab";
import { ScreenHeader } from "../shared/components/screen-header";
import { StandardModal } from "../shared/components/standard-modal";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { useBrandScreenPalette } from "../shared/brand-palette";
import { alertError } from "../shared/utils/alerts";
import { openWhatsApp } from "../shared/utils/whatsapp";

type NavItem = {
  label: string;
  icon: AppIconName;
  route: "/tabs" | "/tabs/sales" | "/suppliers" | "/products" | "/tabs/more";
};
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Início", icon: "home-outline", route: "/tabs" },
  { label: "Vendas", icon: "bag-handle-outline", route: "/tabs/sales" },
  { label: "Gestão", icon: "bar-chart-outline", route: "/suppliers" },
  { label: "Produtos", icon: "cube-outline", route: "/products" },
  { label: "Mais", icon: "ellipsis-horizontal", route: "/tabs/more" },
];

function SupplierBottomNavigation() {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: 74 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          flexDirection: "row",
          zIndex: 20,
        },
        theme.shadows.md,
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const selected = item.route === "/suppliers";
        return (
          <Pressable
            key={item.label}
            onPress={() => {
              if (!selected) router.replace(item.route);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 58,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <View
              style={{
                width: 42,
                height: 30,
                borderRadius: radii.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected ? colors.wineFill : "transparent",
              }}
            >
              <AppIcon
                name={item.icon}
                size={22}
                color={selected ? colors.onWine : theme.colors.textSecondary}
              />
            </View>
            <Typography
              variant="caption"
              numberOfLines={1}
              color={selected ? colors.wine : theme.colors.textSecondary}
              style={{ fontFamily: selected ? fonts.bold : fonts.medium }}
            >
              {item.label}
            </Typography>
            {selected ? (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colors.rose,
                  position: "absolute",
                  bottom: -2,
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SuppliersScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const showPaywall = usePaywall((state) => state.show);
  const addButtonRef = React.useRef<View>(null);
  const editTriggerRef = React.useRef<{ focus: () => void } | null>(null);
  const { data: profile } = useProfile();
  const purchasesEnabled =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "purchases");
  const deleteSupplier = useDeleteSupplier();
  const updateSupplier = useUpdateSupplier();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reorderSupplier, setReorderSupplier] = useState<SupplierOverviewItem | null>(
    null,
  );
  const { data: selected } = useSupplier(selectedId ?? "");
  const editingQuery = useSupplier(editingId ?? "");
  const editing = editingQuery.data;

  function closeCreate() {
    setShowCreate(false);
    requestAnimationFrame(() => {
      const button = addButtonRef.current;
      if (Platform.OS === "web") {
        (button as unknown as { focus?: () => void } | null)?.focus?.();
        return;
      }
      const handle = findNodeHandle(button);
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    });
  }

  function startEditing(id: string) {
    if (Platform.OS === "web") {
      editTriggerRef.current = document.activeElement as { focus: () => void } | null;
    }
    setEditingId(id);
  }

  function closeEditing() {
    setEditingId(null);
    requestAnimationFrame(() => editTriggerRef.current?.focus());
  }

  function confirmDelete(supplier: SupplierOverviewItem) {
    showAlert({
      title: "Excluir fornecedor",
      message:
        supplier.totalPurchaseCount > 0
          ? `Há ${supplier.totalPurchaseCount} compra(s) ligada(s) a ${supplier.name}. O histórico financeiro será mantido, mas perderá o vínculo. Prefira arquivar.`
          : `Excluir ${supplier.name} permanentemente?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteSupplier.mutate(supplier.id, {
              onError: () => alertError("Não foi possível excluir o fornecedor."),
            });
          },
        },
      ],
    });
  }

  function confirmArchive(supplier: SupplierOverviewItem) {
    showAlert({
      title: "Arquivar fornecedor",
      message: `${supplier.name} deixará de aparecer na lista. O histórico será preservado.`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Arquivar",
          onPress: () => {
            updateSupplier.mutate(
              { id: supplier.id, data: { isActive: false } },
              { onError: () => alertError("Não foi possível arquivar o fornecedor.") },
            );
          },
        },
      ],
    });
  }

  function updateFlag(
    supplier: SupplierOverviewItem,
    data: { needsFollowUp?: boolean; restockSoon?: boolean },
  ) {
    updateSupplier.mutate(
      { id: supplier.id, data },
      { onError: () => alertError("Não foi possível atualizar o status.") },
    );
  }

  function reorder(supplier: SupplierOverviewItem) {
    if (!purchasesEnabled) {
      showPaywall("purchases");
      return;
    }
    setReorderSupplier(supplier);
  }

  const prefill = reorderSupplier ? supplierPurchasePrefill(reorderSupplier) : undefined;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Fornecedores"
        subtitle="Quem abastece o seu negócio, sempre à mão."
        subtitleNumberOfLines={2}
        hideBack={isDesktop}
        fallbackRoute="/tabs/more"
        style={{ paddingBottom: spacing.sm }}
        right={
          <FAB
            ref={addButtonRef}
            icon="add"
            header
            accessibilityLabel="Novo fornecedor"
            onPress={() => setShowCreate(true)}
          />
        }
      />

      <View style={{ flex: 1 }}>
        <SupplierList
          onSupplierPress={(supplier) => setSelectedId(supplier.id)}
          onEditPress={(supplier) => startEditing(supplier.id)}
          onArchivePress={confirmArchive}
          onDeletePress={confirmDelete}
          onReorderPress={reorder}
          onWhatsAppPress={(supplier) => {
            if (supplier.phone)
              void openWhatsApp(
                supplier.phone,
                `Olá! Gostaria de falar sobre uma nova compra com ${supplier.name}.`,
              );
          }}
          onToggleFollowUp={(supplier) =>
            updateFlag(supplier, { needsFollowUp: !supplier.needsFollowUp })
          }
          onToggleRestock={(supplier) =>
            updateFlag(supplier, { restockSoon: !supplier.restockSoon })
          }
          onAddPress={() => setShowCreate(true)}
        />
      </View>

      {!isDesktop ? <SupplierBottomNavigation /> : null}

      {showCreate ? (
        <CreateSupplierForm
          modal={{ visible: true, onClose: closeCreate }}
          onSuccess={closeCreate}
        />
      ) : null}

      {selectedId && selected ? (
        <StandardModal visible onClose={() => setSelectedId(null)} title="Fornecedor">
          <SupplierDetail
            supplierId={selectedId}
            onEditPress={() => {
              setSelectedId(null);
              startEditing(selectedId);
            }}
          />
        </StandardModal>
      ) : null}

      {editingId && editing ? (
        <EditSupplierForm
          supplier={editing}
          visible
          onClose={closeEditing}
          onSuccess={closeEditing}
        />
      ) : null}

      {editingId && !editing && editingQuery.isPending ? (
        <StandardModal
          visible
          onClose={closeEditing}
          title="Editar fornecedor"
          closeAccessibilityLabel="Fechar formulário"
        >
          <Typography accessibilityLiveRegion="polite">Carregando fornecedor…</Typography>
        </StandardModal>
      ) : null}

      {editingId && !editing && editingQuery.isError ? (
        <StandardModal
          visible
          onClose={closeEditing}
          title="Editar fornecedor"
          closeAccessibilityLabel="Fechar formulário"
        >
          <Typography color={theme.colors.alert} accessibilityLiveRegion="assertive">
            Fornecedor não encontrado. Feche o formulário e atualize a lista.
          </Typography>
        </StandardModal>
      ) : null}

      {prefill ? (
        <CreatePurchaseForm
          visible
          prefill={prefill}
          onClose={() => setReorderSupplier(null)}
          onSuccess={() => setReorderSupplier(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
