import { formatCurrency } from "../shared/utils/format";
import {
  Button,
  EmptyState,
  fonts,
  fontSizes,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PackagingCard } from "../features/packaging/components/packaging-card";
import { PackagingDetail } from "../features/packaging/components/packaging-detail";
import { PackagingForm } from "../features/packaging/components/packaging-form";
import {
  PACKAGING_EXTRA_FILTERS,
  PACKAGING_LIST_FILTERS,
  packagingHeroIllustrationWidth,
  packagingHeroPanelHeight,
  restockCount,
  totalStockCost,
  type PackagingTypeValue,
} from "../features/packaging/domain";
import { useDeletePackaging, usePackagingList } from "../features/packaging/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { useBrandIllustration } from "../shared/brand-illustrations";
import { brandScreenPalette } from "../shared/brand-palette";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { FAB } from "../shared/components/fab";
import { Skeleton } from "../shared/components/skeleton";
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

function PackagingSummary({
  totalCount,
  invested,
  toRestock,
}: Readonly<{
  totalCount: number;
  invested: number;
  toRestock: number;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const hero = useBrandIllustration("embalagensHero");
  const compact = viewportWidth < 360;
  const gutter = isDesktop ? 0 : spacing.lg;
  const panelWidth = Math.min(720, Math.max(280, viewportWidth - gutter * 2));
  const panelHeight = packagingHeroPanelHeight(viewportWidth);
  const illustrationWidth = packagingHeroIllustrationWidth(panelWidth);
  const illustrationHeight = Math.min(
    panelHeight,
    Math.round(illustrationWidth * (900 / 1024)),
  );
  const registeredLabel = totalCount === 1 ? "cadastrada" : "cadastradas";

  return (
    <View
      style={{
        height: panelHeight,
        borderRadius: radii.xl,
        backgroundColor: palette.wineFill,
        overflow: "hidden",
        paddingVertical: compact ? spacing.md : spacing.lg,
        paddingLeft: compact ? spacing.md : spacing.lg,
        paddingRight: spacing.sm,
      }}
    >
      <View
        style={{
          width: "50%",
          maxWidth: "52%",
          height: "100%",
          zIndex: 1,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <Typography
            variant="label"
            color={palette.softRose}
            numberOfLines={1}
            style={{ fontFamily: fonts.bold, letterSpacing: 0.8 }}
          >
            ESTOQUE DE EMBALAGENS
          </Typography>
          <View
            style={{
              width: 28,
              height: 2,
              borderRadius: 1,
              backgroundColor: palette.rose,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: spacing.sm,
          }}
        >
          <Typography
            color={palette.onWine}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              fontFamily: fonts.extraBold,
              fontSize: compact ? 32 : 40,
              lineHeight: compact ? 38 : 46,
            }}
          >
            {totalCount}
          </Typography>
          <Typography
            color={palette.onWine}
            style={{ fontFamily: fonts.medium, fontSize: compact ? 13 : fontSizes.sm }}
          >
            {registeredLabel}
          </Typography>
        </View>

        <View style={{ height: 1, backgroundColor: "rgba(245, 229, 232, 0.22)" }} />

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: spacing.sm,
          }}
        >
          <Typography
            variant="moneyLg"
            color={palette.rose}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(invested)}
          </Typography>
          <Typography
            color={palette.onWine}
            style={{ fontFamily: fonts.medium, fontSize: compact ? 13 : fontSizes.sm }}
          >
            investidos
          </Typography>
        </View>

        <View
          accessibilityLabel={`${toRestock} ${toRestock === 1 ? "embalagem para repor" : "embalagens para repor"}`}
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: palette.lime,
            borderRadius: radii.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            minHeight: 28,
          }}
        >
          <AppIcon name="alert-circle-outline" size={14} color={palette.ink} />
          <Typography
            color={palette.ink}
            style={{ fontFamily: fonts.bold, fontSize: 13, lineHeight: 16 }}
          >
            {toRestock} para repor
          </Typography>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: compact ? -4 : 0,
          bottom: 0,
          width: illustrationWidth,
          height: illustrationHeight,
        }}
      >
        <Image
          source={hero}
          resizeMode="contain"
          accessible={false}
          accessibilityElementsHidden
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        height: 44,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: selected ? palette.rose : palette.border,
        backgroundColor: selected ? palette.rose : palette.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Typography
        variant="bodyBold"
        color={selected ? palette.onWine : palette.ink}
        style={{ fontFamily: selected ? fonts.bold : fonts.semiBold, fontSize: 14 }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function PackagingSkeleton() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width } = useWindowDimensions();
  return (
    <View style={{ gap: spacing.lg }}>
      <Skeleton height={packagingHeroPanelHeight(width)} borderRadius={radii.xl} />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Skeleton height={48} borderRadius={14} style={{ flex: 1 }} />
        <Skeleton width={108} height={48} borderRadius={14} />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Skeleton width={88} height={44} borderRadius={radii.full} />
        <Skeleton width={96} height={44} borderRadius={radii.full} />
        <Skeleton width={88} height={44} borderRadius={radii.full} />
      </View>
      <View style={{ gap: spacing.md }}>
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={`packaging-skeleton-${index}`}
            style={{
              minHeight: 80,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.white,
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <Skeleton width={4} height={56} borderRadius={2} />
            <Skeleton width={52} height={52} borderRadius={26} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton width="62%" height={16} />
              <Skeleton width="34%" height={14} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PackagingScreenContent() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const isDesktop = useDesktopLayout();
  const { data, isLoading, error } = usePackagingList();
  const deletePackaging = useDeletePackaging();
  const showPaywall = usePaywall((s) => s.show);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<PackagingTypeValue | null>(null);

  const items = data?.items ?? [];
  const selected = items.find((p) => p.id === selectedId) ?? null;
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      return !query || p.name.toLowerCase().includes(query);
    });
  }, [items, search, typeFilter]);

  const contentStyle = {
    ...pageGutter(isDesktop, spacing.lg),
    ...desktopStretch(isDesktop, desktopWidths.data),
  };

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

  function renderToolbar() {
    const extraSelected = PACKAGING_EXTRA_FILTERS.some(
      (filter) => filter.value === typeFilter,
    );
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.sm, width: "100%" }}>
          <View
            style={{
              flex: 1,
              minHeight: 48,
              height: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.white,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <AppIcon name="search-outline" size={20} color={palette.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar embalagem..."
              placeholderTextColor={palette.muted}
              accessibilityLabel="Buscar embalagem"
              returnKeyType="search"
              style={{
                flex: 1,
                minWidth: 0,
                color: palette.ink,
                fontSize: fontSizes.md,
                fontFamily: fonts.regular,
                paddingVertical: 0,
              }}
            />
            {search.length > 0 ? (
              <Pressable
                onPress={() => setSearch("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="close-circle" size={20} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setFiltersOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Filtros"
            accessibilityState={{ expanded: filtersOpen, selected: extraSelected }}
            style={({ pressed }) => ({
              minHeight: 48,
              minWidth: 44,
              paddingHorizontal: spacing.md,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.rose,
              backgroundColor: extraSelected ? palette.softRose : "transparent",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <AppIcon name="funnel-outline" size={18} color={palette.rose} />
            <Typography
              variant="bodyBold"
              color={palette.rose}
              style={{ fontFamily: fonts.semiBold }}
            >
              Filtros
            </Typography>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.sm }}
          style={{ flexGrow: 0 }}
        >
          {PACKAGING_LIST_FILTERS.map((filter) => (
            <CategoryChip
              key={filter.label}
              label={filter.label}
              selected={typeFilter === filter.value}
              onPress={() => setTypeFilter(filter.value)}
            />
          ))}
        </ScrollView>

        {filtersOpen ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PACKAGING_EXTRA_FILTERS.map((filter) => (
              <CategoryChip
                key={filter.value}
                label={filter.label}
                selected={typeFilter === filter.value}
                onPress={() =>
                  setTypeFilter(typeFilter === filter.value ? null : filter.value)
                }
              />
            ))}
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Typography
            variant="bodyBold"
            color={palette.ink}
            style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
          >
            Suas embalagens
          </Typography>
          <Typography
            variant="caption"
            color={palette.muted}
            style={{ fontFamily: fonts.medium }}
          >
            {visible.length} {visible.length === 1 ? "item" : "itens"}
          </Typography>
        </View>
      </>
    );
  }

  function renderList() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, paddingVertical: spacing.sm, ...contentStyle }}>
          <PackagingSkeleton />
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
          title="Nenhuma embalagem ainda"
          description="Cadastre sua primeira embalagem pra calcular o custo certinho dos seus produtos"
          action={
            <Button title="Cadastrar embalagem" onPress={() => setShowCreate(true)} />
          }
        />
      );
    }

    const itemCount = data?.total ?? items.length;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          ...contentStyle,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        <PackagingSummary
          totalCount={itemCount}
          invested={totalStockCost(items)}
          toRestock={restockCount(items)}
        />

        {renderToolbar()}

        {visible.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center" }}>
            <Typography
              variant="body"
              color={palette.muted}
              style={{ textAlign: "center" }}
            >
              Nenhuma embalagem encontrada. Ajuste a busca ou o filtro.
            </Typography>
          </View>
        ) : (
          <View style={{ gap: spacing.md, width: "100%" }}>
            {visible.map((pkg) => (
              <PackagingCard
                key={pkg.id}
                packaging={pkg}
                onPress={() => openCard(pkg.id)}
                onEdit={() => startEdit(pkg.id)}
                onDelete={() => deleteById(pkg.id)}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova embalagem"
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            borderRadius: radii.xl,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: palette.border,
            backgroundColor: palette.white,
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppIcon name="add-circle-outline" size={28} color={palette.rose} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={palette.ink}>
              Adicionar nova embalagem
            </Typography>
            <Typography variant="caption" color={palette.muted}>
              Cadastre uma embalagem que será utilizada nos seus produtos
            </Typography>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background, overflow: "hidden" }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Embalagens"
        hideBack={isDesktop}
        style={{ gap: spacing.sm, ...pageGutter(isDesktop, spacing.lg) }}
        titleStyle={{ color: palette.ink }}
        right={
          <FAB
            icon="add"
            header
            onPress={() => setShowCreate(true)}
            accessibilityLabel="Nova embalagem"
            style={{
              backgroundColor: palette.rose,
              shadowOpacity: 0,
              shadowRadius: 0,
              elevation: 0,
            }}
          />
        }
      />

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

      <PackagingForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        existingPackaging={items}
        onSuccess={() => setShowCreate(false)}
        onCancel={() => setShowCreate(false)}
      />

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
