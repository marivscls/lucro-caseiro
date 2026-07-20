import { formatCurrency } from "../shared/utils/format";
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
import type { AppIconName } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import packagingEmpty from "../assets/packaging-empty.png";
import { PackagingCard } from "../features/packaging/components/packaging-card";
import { PackagingDetail } from "../features/packaging/components/packaging-detail";
import { PackagingForm } from "../features/packaging/components/packaging-form";
import { PACKAGING_TYPES, totalStockCost, typeColor } from "../features/packaging/domain";
import { useDeletePackaging, usePackagingList } from "../features/packaging/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { StandardModal } from "../shared/components/standard-modal";

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: Readonly<{
  icon: AppIconName;
  label: string;
  value: string;
  hint: string;
}>) {
  const { theme } = useTheme();
  const border = theme.colors.border;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: theme.colors.surfaceElevated,
        padding: spacing.lg,
        gap: spacing.sm,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={24} color={theme.colors.textSecondary} />
      </View>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        numberOfLines={2}
        style={{ textAlign: "center", minHeight: 34 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h3"
        color={theme.colors.text}
        style={{ fontSize: fontSizes.xl, textAlign: "center" }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {hint}
      </Typography>
    </View>
  );
}

function PackagingScreenContent() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data, isLoading, error } = usePackagingList();
  const deletePackaging = useDeletePackaging();
  const showPaywall = usePaywall((s) => s.show);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const items = data?.items ?? [];
  const selected = items.find((p) => p.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      return !query || p.name.toLowerCase().includes(query);
    });
  }, [items, search, typeFilter]);

  const border = theme.colors.border;

  function deleteById(id: string) {
    deletePackaging
      .mutateAsync(id)
      .then(() => {
        if (selectedId === id) {
          setSelectedId(null);
          setEditing(false);
        }
      })
      .catch(() => alertError("Não foi possível excluir a embalagem."));
  }

  function openCard(id: string) {
    setSelectedId(id);
    setEditing(false);
  }

  function startEdit(id: string) {
    setSelectedId(id);
    setEditing(true);
  }

  function renderList() {
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
          description="Não foi possível carregar suas embalagens. Tente novamente."
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={
            <Image
              source={packagingEmpty}
              resizeMode="contain"
              style={{ width: 146, height: 146 }}
            />
          }
          title="Nenhuma embalagem ainda"
          description="Cadastre sua primeira embalagem pra calcular o custo certinho dos seus produtos"
          action={
            <Button title="Cadastrar embalagem" onPress={() => setShowCreate(true)} />
          }
        />
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
        {/* Resumo */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <SummaryCard
            icon="cube-outline"
            label="Total de embalagens"
            value={String(data?.total ?? items.length)}
            hint="cadastradas"
          />
          <SummaryCard
            icon="cash-outline"
            label="Custo total em estoque"
            value={formatCurrency(totalStockCost(items))}
            hint="valor investido"
          />
        </View>

        {visible.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center" }}>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              Nenhuma embalagem encontrada. Ajuste a busca ou o filtro.
            </Typography>
          </View>
        ) : (
          visible.map((pkg) => (
            <PackagingCard
              key={pkg.id}
              packaging={pkg}
              onPress={() => openCard(pkg.id)}
              onEdit={() => startEdit(pkg.id)}
              onDelete={() => deleteById(pkg.id)}
            />
          ))
        )}

        {/* CTA tracejado */}
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova embalagem"
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            borderRadius: radii.xl,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: theme.colors.primaryLight,
            backgroundColor: theme.colors.primaryBg,
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppIcon
            name="add-circle-outline"
            size={28}
            color={theme.colors.primaryStrong}
          />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Adicionar nova embalagem
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Cadastre uma embalagem que será utilizada nos seus produtos
            </Typography>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <ScreenHeader
        title="Embalagens"
        hideBack={isDesktop}
        style={{ gap: spacing.sm }}
        right={
          <Pressable
            onPress={() => setShowCreate(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova embalagem"
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

      {/* Busca + Filtros */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
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
            onChangeText={(v) => {
              setSearch(v);
              setSearchOpen(true);
            }}
            placeholder="Buscar embalagem..."
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: fontSizes.md,
              paddingVertical: 0,
            }}
          />
          {searchOpen && search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setFiltersOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          style={({ pressed }) => ({
            minHeight: 48,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: typeFilter ? theme.colors.primaryStrong : border,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppIcon
            name="funnel-outline"
            size={18}
            color={typeFilter ? theme.colors.primaryStrong : theme.colors.text}
          />
          <Typography
            variant="bodyBold"
            color={typeFilter ? theme.colors.primaryStrong : theme.colors.text}
          >
            Filtros
          </Typography>
        </Pressable>
      </View>

      {filtersOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {[{ value: null, label: "Todas" }, ...PACKAGING_TYPES].map((t) => {
              const active = typeFilter === t.value;
              const chipColor = t.value
                ? typeColor(theme, t.value)
                : theme.colors.primaryStrong;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => setTypeFilter(t.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: active ? chipColor : border,
                    backgroundColor: active ? `${chipColor}26` : "transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    color={active ? chipColor : theme.colors.textSecondary}
                    style={{ fontFamily: fonts.bold }}
                  >
                    {t.label}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="packaging"
          onUpgrade={() => showPaywall("packaging")}
          containerStyle={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}
        />
        {renderList()}
      </View>

      {/* Modal: criar */}
      <PackagingForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        existingPackaging={items}
        onSuccess={() => setShowCreate(false)}
        onCancel={() => setShowCreate(false)}
      />

      {/* Modal: detalhe */}
      {selected && !editing ? (
        <StandardModal
          visible
          onClose={() => setSelectedId(null)}
          title="Embalagem"
          right={
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Editar embalagem"
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <AppIcon
                name="create-outline"
                size={22}
                color={theme.colors.primaryStrong}
              />
            </Pressable>
          }
        >
          <PackagingDetail
            packaging={selected}
            onDelete={() => deleteById(selected.id)}
            isDeleting={deletePackaging.isPending}
          />
        </StandardModal>
      ) : null}

      {/* Modal: editar */}
      {selected && editing ? (
        <PackagingForm
          packaging={selected}
          visible
          onClose={() => setEditing(false)}
          existingPackaging={items}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          headerRight={
            <Pressable
              onPress={() => {
                showAlert({
                  title: "Excluir embalagem",
                  message: "Tem certeza que deseja excluir esta embalagem?",
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
              accessibilityRole="button"
              accessibilityLabel="Excluir embalagem"
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
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function PackagingScreen() {
  return (
    <FeatureRouteGuard feature="embalagens">
      <PackagingScreenContent />
    </FeatureRouteGuard>
  );
}
