import type { SupplierOverviewItem } from "@lucro-caseiro/contracts";
import {
  Button,
  Chip,
  EmptyState,
  FilterChipRow,
  Typography,
  fonts,
  fontSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import suppliersHero from "../../../assets/fornecedores-caixas.png";
import { useBrandIllustration } from "../../../shared/brand-illustrations";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { SkeletonList } from "../../../shared/components/skeleton";
import { StandardModal } from "../../../shared/components/standard-modal";
import { formatCurrency } from "../../../shared/utils/format";
import {
  filterAndSortSuppliers,
  supplierCategoryCounts,
  supplierHeroIllustrationWidth,
  type SupplierAdvancedFilter,
  type SupplierCategoryFilter,
  type SupplierSort,
} from "../domain";
import { useSuppliersOverview } from "../hooks";
import { SupplierCard } from "./supplier-card";

interface SupplierListProps {
  onSupplierPress: (supplier: SupplierOverviewItem) => void;
  onEditPress: (supplier: SupplierOverviewItem) => void;
  onArchivePress: (supplier: SupplierOverviewItem) => void;
  onDeletePress: (supplier: SupplierOverviewItem) => void;
  onReorderPress: (supplier: SupplierOverviewItem) => void;
  onWhatsAppPress: (supplier: SupplierOverviewItem) => void;
  onToggleFollowUp: (supplier: SupplierOverviewItem) => void;
  onToggleRestock: (supplier: SupplierOverviewItem) => void;
  onAddPress: () => void;
}

const CATEGORY_FILTERS: readonly { key: SupplierCategoryFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "supplies", label: "Insumos" },
  { key: "packaging", label: "Embalagens" },
  { key: "food", label: "Alimentos" },
  { key: "other", label: "Outros" },
];

const ADVANCED_FILTERS: readonly { key: SupplierAdvancedFilter; label: string }[] = [
  { key: "preferred", label: "Favoritos" },
  { key: "followUp", label: "Com pendência" },
  { key: "openOrder", label: "Pedido aberto" },
  { key: "restockSoon", label: "Repor em breve" },
];

const SORT_LABELS: Record<SupplierSort, string> = {
  recent: "Mais recentes",
  mostPurchased: "Mais comprados",
  highestValue: "Maior valor",
  az: "A–Z",
};

function FilterCheckbox({
  label,
  checked,
  onPress,
}: Readonly<{ label: string; checked: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.68 : 1,
      })}
    >
      <AppIcon
        name={checked ? "checkbox" : "square-outline"}
        size={24}
        color={checked ? theme.colors.primaryStrong : theme.colors.textSecondary}
      />
      <Typography variant="bodyBold" style={{ flex: 1 }}>
        {label}
      </Typography>
    </Pressable>
  );
}

function MonthlyPanel({
  totalAmount,
  purchaseCount,
  supplierCount,
}: Readonly<{ totalAmount: number; purchaseCount: number; supplierCount: number }>) {
  const { width } = useWindowDimensions();
  const colors = useBrandScreenPalette();
  const compact = width <= 350;
  const illustrationWidth = supplierHeroIllustrationWidth(width);
  const purchaseWord = purchaseCount === 1 ? "compra" : "compras";
  const supplierWord = supplierCount === 1 ? "fornecedor" : "fornecedores";
  return (
    <View
      style={{
        minHeight: compact ? 206 : 224,
        borderRadius: radii.xl,
        backgroundColor: colors.wineFill,
        overflow: "hidden",
        position: "relative",
        padding: spacing.xl,
      }}
    >
      <View style={{ width: compact ? "70%" : "64%", zIndex: 2, gap: spacing.sm }}>
        <Typography variant="body" color={colors.onWine}>
          Compras do mês
        </Typography>
        <Typography
          color={colors.onWine}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          style={{
            fontFamily: fonts.extraBold,
            fontSize: compact ? 24 : 34,
            lineHeight: compact ? 32 : 43,
          }}
        >
          {formatCurrency(totalAmount)}
        </Typography>
        <Typography variant="body" color={colors.onWine}>
          {purchaseCount === 0
            ? "Nenhuma compra neste mês"
            : `${purchaseCount} ${purchaseWord} em ${supplierCount} ${supplierWord}`}
        </Typography>
        <View
          style={{
            alignSelf: "flex-start",
            marginTop: spacing.sm,
            borderRadius: radii.full,
            backgroundColor: "rgba(255,255,255,0.15)",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <AppIcon name="information-circle-outline" size={18} color={colors.onWine} />
          <Typography
            variant="caption"
            color={colors.onWine}
            style={{ fontFamily: fonts.semiBold }}
          >
            Sem planejamento
          </Typography>
        </View>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: illustrationWidth,
          height: illustrationWidth,
          right: compact ? -8 : spacing.sm,
          bottom: -2,
          zIndex: 1,
        }}
      >
        <Image
          source={suppliersHero}
          resizeMode="contain"
          accessible={false}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
}

export function SupplierList(props: Readonly<SupplierListProps>) {
  const { theme } = useTheme();
  const suppliersEmpty = useBrandIllustration("suppliersEmpty");
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(760, width);
  const query = useSuppliersOverview();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SupplierCategoryFilter>("all");
  const [advanced, setAdvanced] = useState<Set<SupplierAdvancedFilter>>(() => new Set());
  const [sort, setSort] = useState<SupplierSort>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const allItems = query.data?.items ?? [];
  const counts = useMemo(() => supplierCategoryCounts(allItems), [allItems]);
  const items = useMemo(
    () => filterAndSortSuppliers(allItems, { search, category, advanced, sort }),
    [advanced, allItems, category, search, sort],
  );
  const hasQuery = !!search.trim() || category !== "all" || advanced.size > 0;

  function toggleAdvanced(key: SupplierAdvancedFilter) {
    setAdvanced((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setAdvanced(new Set());
  }

  function openSort() {
    showAlert({
      title: "Ordenar fornecedores",
      buttons: [
        ...Object.entries(SORT_LABELS).map(([key, label]) => ({
          text: label,
          onPress: () => setSort(key as SupplierSort),
        })),
        { text: "Cancelar", style: "cancel" as const },
      ],
    });
  }

  if (query.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignSelf: "center",
          width: "100%",
          maxWidth: 760,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            height: 224,
            borderRadius: radii.xl,
            backgroundColor: theme.colors.surface,
          }}
        />
        <View
          style={{
            height: 52,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surface,
          }}
        />
        <SkeletonList rows={4} variant="supplier" />
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl }}>
        <EmptyState
          title="Não foi possível carregar os fornecedores"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button
              title="Tentar novamente"
              onPress={() => {
                void query.refetch();
              }}
            />
          }
        />
      </View>
    );
  }

  const header = (
    <View style={{ gap: spacing.lg }}>
      <MonthlyPanel
        totalAmount={query.data?.month.totalAmount ?? 0}
        purchaseCount={query.data?.month.purchaseCount ?? 0}
        supplierCount={query.data?.month.supplierCount ?? 0}
      />

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View
          style={{
            flex: 1,
            minHeight: 52,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <AppIcon name="search-outline" size={22} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar fornecedor, produto ou categoria..."
            placeholderTextColor={theme.colors.textSecondary}
            accessibilityLabel="Buscar fornecedor, produto ou categoria"
            style={{
              flex: 1,
              minWidth: 0,
              color: theme.colors.text,
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              paddingVertical: 0,
            }}
          />
          {search ? (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              hitSlop={8}
            >
              <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros avançados"
          accessibilityState={{ expanded: filtersOpen }}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: advanced.size ? theme.colors.primaryStrong : theme.colors.border,
            backgroundColor: advanced.size
              ? theme.colors.primaryBg
              : theme.colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.68 : 1,
          })}
        >
          <AppIcon
            name="options-outline"
            size={22}
            color={
              advanced.size ? theme.colors.primaryStrong : theme.colors.textSecondary
            }
          />
        </Pressable>
      </View>

      <FilterChipRow>
        {CATEGORY_FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            count={counts[filter.key]}
            selected={category === filter.key}
            onPress={() => setCategory(filter.key)}
          />
        ))}
      </FilterChipRow>

      <View
        style={{
          flexDirection: width <= 350 ? "column" : "row",
          alignItems: width <= 350 ? "stretch" : "center",
          gap: width <= 350 ? 0 : spacing.md,
        }}
      >
        <Typography variant="h2" style={{ flex: 1 }}>
          Seus fornecedores
        </Typography>
        <Pressable
          onPress={openSort}
          accessibilityRole="button"
          accessibilityLabel={`Ordenação: ${SORT_LABELS[sort]}`}
          style={({ pressed }) => ({
            minHeight: 44,
            alignSelf: width <= 350 ? "flex-start" : undefined,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
            {SORT_LABELS[sort]}
          </Typography>
          <AppIcon name="chevron-down" size={18} color={theme.colors.primaryStrong} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={{ width: "100%" }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: pageWidth,
          alignSelf: "center",
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: 132,
          gap: spacing.md,
        }}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: spacing.md, overflow: "visible" }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={theme.colors.primaryStrong}
            colors={[theme.colors.primaryStrong]}
          />
        }
        renderItem={({ item }) => (
          <SupplierCard
            supplier={item}
            onPress={() => props.onSupplierPress(item)}
            onEdit={() => props.onEditPress(item)}
            onArchive={() => props.onArchivePress(item)}
            onDelete={() => props.onDeletePress(item)}
            onReorder={() => props.onReorderPress(item)}
            onWhatsApp={() => props.onWhatsAppPress(item)}
            onToggleFollowUp={() => props.onToggleFollowUp(item)}
            onToggleRestock={() => props.onToggleRestock(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing["3xl"] }}>
            <EmptyState
              icon={
                hasQuery ? undefined : (
                  <Image
                    source={suppliersEmpty}
                    resizeMode="contain"
                    accessible={false}
                    style={{ width: 220, height: 220 }}
                  />
                )
              }
              title={
                hasQuery ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"
              }
              description={
                hasQuery
                  ? "Ajuste a busca ou limpe os filtros para ver outros fornecedores."
                  : "Cadastre quem abastece o seu negócio para organizar suas compras."
              }
              action={
                hasQuery ? (
                  <Button title="Limpar busca e filtros" onPress={clearFilters} />
                ) : (
                  <Button title="Adicionar fornecedor" onPress={props.onAddPress} />
                )
              }
            />
          </View>
        }
      />

      <StandardModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtrar fornecedores"
        footer={
          <View style={{ flex: 1, flexDirection: "row", gap: spacing.sm }}>
            <Button
              title="Limpar todos"
              variant="outline"
              onPress={() => setAdvanced(new Set())}
              style={{ flex: 1 }}
            />
            <Button
              title="Ver resultados"
              onPress={() => setFiltersOpen(false)}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View style={{ gap: spacing.xs }}>
          {ADVANCED_FILTERS.map((filter) => (
            <FilterCheckbox
              key={filter.key}
              label={filter.label}
              checked={advanced.has(filter.key)}
              onPress={() => toggleAdvanced(filter.key)}
            />
          ))}
        </View>
      </StandardModal>
    </>
  );
}
