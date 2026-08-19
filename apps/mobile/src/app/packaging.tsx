import { formatCurrency } from "../shared/utils/format";
import {
  Button,
  Chip,
  EmptyState,
  FilterChipRow,
  fontSizes,
  Typography,
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
import { PACKAGING_TYPES, totalStockCost } from "../features/packaging/domain";
import { useDeletePackaging, usePackagingList } from "../features/packaging/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { FAB } from "../shared/components/fab";
import { SkeletonList, SkeletonSummaryStrip } from "../shared/components/skeleton";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
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
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const item of items) {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    }
    return counts;
  }, [items]);

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
        <View
          style={{
            flex: 1,
            paddingVertical: spacing.xl,
            gap: spacing.lg,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.data),
          }}
        >
          <SkeletonSummaryStrip tiles={2} />
          <SkeletonList rows={5} variant="material" />
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
              style={{
                width: isDesktop ? 240 : 220,
                height: isDesktop ? 240 : 220,
              }}
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
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        {/* Resumo — full width of stretch zone */}
        <View style={{ flexDirection: "row", gap: spacing.md, width: "100%" }}>
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
          <View
            style={
              isDesktop
                ? {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.md,
                    width: "100%",
                  }
                : { gap: spacing.md }
            }
          >
            {visible.map((pkg) => (
              <View
                key={pkg.id}
                style={
                  isDesktop
                    ? { width: "31%", flexGrow: 1, minWidth: 280 }
                    : { width: "100%" }
                }
              >
                <PackagingCard
                  packaging={pkg}
                  onPress={() => openCard(pkg.id)}
                  onEdit={() => startEdit(pkg.id)}
                  onDelete={() => deleteById(pkg.id)}
                />
              </View>
            ))}
          </View>
        )}

        {/* CTA tracejado */}
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova embalagem"
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            width: isDesktop ? "100%" : undefined,
            borderRadius: radii.xl,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
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
            <Typography variant="bodyBold" color={theme.colors.text}>
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
          <FAB
            icon="add"
            header
            onPress={() => setShowCreate(true)}
            accessibilityLabel="Nova embalagem"
          />
        }
      />

      {/* Busca + Filtros */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          ...pageGutter(isDesktop, spacing.lg),
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
          ...(isDesktop
            ? { alignSelf: "flex-start", maxWidth: 480, width: "100%" }
            : undefined),
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
        <View style={{ ...pageGutter(isDesktop, spacing.lg), paddingBottom: spacing.sm }}>
          <FilterChipRow>
            {[{ value: null, label: "Todas" }, ...PACKAGING_TYPES].map((t) => (
              <Chip
                key={t.label}
                label={t.label}
                count={t.value ? (typeCounts[t.value] ?? 0) : typeCounts.all}
                selected={typeFilter === t.value}
                onPress={() => setTypeFilter(t.value)}
              />
            ))}
          </FilterChipRow>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="packaging"
          onUpgrade={() => showPaywall("packaging")}
          containerStyle={{
            marginHorizontal: isDesktop ? 0 : spacing.lg,
            marginTop: spacing.sm,
          }}
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
