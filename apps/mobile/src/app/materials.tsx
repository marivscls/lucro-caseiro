import type { Material } from "@lucro-caseiro/contracts";
import {
  CenteredTextInput,
  Button,
  EmptyState,
  fontSizes,
  fonts,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  type ImageStyle,
  useWindowDimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import pantryIllustration from "../assets/insumos-despensa.png";
import { MaterialCard } from "../features/materials/components/material-card";
import { MaterialForm } from "../features/materials/components/material-form";
import {
  getStockStatus,
  materialCategory,
  materialStockValue,
  type StockStatus,
} from "../features/materials/domain";
import { useAllMaterials } from "../features/materials/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { AppIcon } from "../shared/components/app-icon";
import { FAB } from "../shared/components/fab";
import { ScreenCreateBar } from "../shared/components/screen-create-bar";
import { FeatureRouteGuard } from "../shared/components/feature-route-guard";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { displayIngredientName } from "../shared/ingredient-image/resolve";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

type StockFilter = "all" | "low" | "attention";
type SortOption = "name" | "stock" | "proximity" | "value";

const SORT_OPTIONS: ReadonlyArray<{ key: SortOption; label: string }> = [
  { key: "name", label: "Nome" },
  { key: "stock", label: "Menor estoque primeiro" },
  { key: "proximity", label: "Mais próximos do mínimo" },
  { key: "value", label: "Maior valor em estoque" },
];

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function stockProximity(material: Material): number {
  const minimum = material.stockAlertThreshold;
  if (minimum == null || minimum <= 0) return Number.POSITIVE_INFINITY;
  return material.stockQuantity / minimum;
}

function SummaryMetric({
  count,
  label,
  status,
  compact = false,
}: Readonly<{
  count: number;
  label: string;
  status: StockStatus;
  compact?: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  let icon: "checkmark" | "alert-circle" | "warning" = "warning";
  let background: string = palette.rose;
  if (status === "ok") {
    icon = "checkmark";
    background = palette.lime;
  } else if (status === "attention") {
    icon = "alert-circle";
    background = palette.softRose;
  }
  let foreground = palette.wine;
  if (status === "low") foreground = palette.onWine;
  else if (status === "ok") foreground = palette.onLime;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        gap: spacing.xs,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radii.full,
            backgroundColor: background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon
            name={icon}
            size={compact ? 14 : 16}
            color={foreground}
            strokeWidth={2}
          />
        </View>
        <Typography
          variant="h3"
          color={palette.onWine}
          numberOfLines={1}
          style={{
            fontSize: compact ? 18 : 20,
            lineHeight: 26,
            fontVariant: ["tabular-nums"],
          }}
        >
          {count}
        </Typography>
      </View>
      <Typography
        variant="caption"
        color={palette.onWine}
        numberOfLines={1}
        style={{ fontSize: compact ? 11 : 12, lineHeight: 18, opacity: 0.8 }}
      >
        {label}
      </Typography>
    </View>
  );
}

function PantrySummary({ items }: Readonly<{ items: Material[] }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  let imageWidth = narrow ? 120 : 148;
  if (width >= 1024) imageWidth = 160;
  const counts = items.reduce(
    (acc, material) => {
      acc[getStockStatus(material)] += 1;
      return acc;
    },
    { ok: 0, attention: 0, low: 0 },
  );
  const totalValue = items.reduce(
    (total, material) => total + materialStockValue(material),
    0,
  );

  return (
    <View
      style={{
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        borderRadius: radii["2xl"],
        backgroundColor: palette.wineFill,
      }}
    >
      <View
        style={{
          minHeight: width >= 1024 ? 180 : 158,
          justifyContent: "center",
          padding: narrow ? spacing.lg : spacing.xl,
          paddingRight: imageWidth - spacing.sm,
        }}
      >
        <View
          style={{
            minWidth: 0,
            zIndex: 2,
            gap: spacing.xs,
          }}
        >
          <Typography variant="caption" color={palette.onWine} style={{ opacity: 0.8 }}>
            Valor em estoque
          </Typography>
          <View
            style={{
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="moneyHero"
              color={palette.onWine}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              style={{
                fontSize: narrow ? 28 : 32,
                lineHeight: 42,
                letterSpacing: -1,
                fontVariant: ["tabular-nums"],
              }}
            >
              {moneyFormatter.format(totalValue)}
            </Typography>
          </View>
          <Typography
            variant="body"
            color={palette.onWine}
            style={{ fontSize: 12, lineHeight: 18, opacity: 0.8, marginTop: spacing.xs }}
          >
            {items.length}{" "}
            {items.length === 1 ? "material cadastrado" : "materiais cadastrados"}
          </Typography>
        </View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -spacing.sm,
            bottom: -spacing.md,
            width: imageWidth,
            height: imageWidth * (1328 / 1184),
          }}
        >
          <Image
            source={pantryIllustration}
            resizeMode="contain"
            accessibilityLabel="Sacola com farinha, leite e chocolate"
            accessibilityIgnoresInvertColors
            style={{ width: "100%", height: "100%" } as ImageStyle}
          />
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          paddingHorizontal: narrow ? spacing.lg : spacing.xl,
          paddingVertical: spacing.md,
          borderTopWidth: 1,
          borderTopColor: "rgba(255, 255, 255, 0.12)",
          backgroundColor: palette.wineFill,
        }}
      >
        <SummaryMetric count={counts.ok} label="em dia" status="ok" compact={narrow} />
        <SummaryMetric
          count={counts.attention}
          label="atenção"
          status="attention"
          compact={narrow}
        />
        <SummaryMetric count={counts.low} label="baixo" status="low" compact={narrow} />
      </View>
    </View>
  );
}

function ReplenishmentAlert({ items }: Readonly<{ items: Material[] }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const lowItems = useMemo(
    () =>
      items
        .filter((material) => getStockStatus(material) === "low")
        .sort((a, b) => stockProximity(a) - stockProximity(b)),
    [items],
  );
  const priority = lowItems[0];
  if (!priority) return null;
  const priorityName = displayIngredientName(priority.name);

  const title =
    priority.stockQuantity <= 0
      ? `${priorityName} está sem estoque`
      : `${priorityName} chegou ao mínimo`;

  return (
    <Pressable
      onPress={() => router.push("/buy-materials")}
      accessibilityRole="button"
      accessibilityLabel="Ver lista de compras de materiais"
      style={({ pressed }) => ({
        minHeight: 96,
        flexShrink: 0,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.softRose,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: radii.full,
          backgroundColor: palette.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name="warning-outline" size={20} color={palette.wine} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="bodyBold" color={palette.ink} style={{ fontSize: 14 }}>
          {title}
        </Typography>
        <Typography variant="caption" color={palette.muted} style={{ fontSize: 12 }}>
          {lowItems.length} {lowItems.length === 1 ? "item precisa" : "itens precisam"} de
          reposição
        </Typography>
        <Typography
          variant="bodyBold"
          color={palette.wine}
          numberOfLines={1}
          style={{ fontSize: 12, marginTop: spacing.xs }}
        >
          Ver lista de compras
        </Typography>
      </View>
      <AppIcon name="chevron-forward" size={20} color={palette.wine} />
    </Pressable>
  );
}

function ModalChoice({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: selected ? palette.rose : palette.border,
        backgroundColor: selected ? palette.softRose : palette.white,
        paddingHorizontal: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <AppIcon
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={20}
        color={selected ? palette.rose : palette.muted}
      />
      <Typography variant="body" color={palette.ink} style={{ flex: 1 }}>
        {label}
      </Typography>
    </Pressable>
  );
}

function PantrySkeleton() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View style={{ gap: spacing.lg }}>
      <Skeleton height={234} borderRadius={radii["2xl"]} />
      <Skeleton height={106} borderRadius={radii.xl} />
      <Skeleton height={58} borderRadius={radii.xl} />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Skeleton width={106} height={44} borderRadius={radii.full} />
        <Skeleton width={132} height={44} borderRadius={radii.full} />
      </View>
      <View
        style={{
          borderRadius: radii.xl,
          overflow: "hidden",
          backgroundColor: palette.white,
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={`material-skeleton-${index}`}
            style={{
              minHeight: 112,
              padding: spacing.lg,
              borderBottomWidth: index < 3 ? 1 : 0,
              borderBottomColor: palette.border,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <Skeleton width={52} height={52} borderRadius={radii.full} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton width="66%" height={15} />
              <Skeleton width="44%" height={12} />
              <Skeleton width="80%" height={7} borderRadius={radii.full} />
            </View>
            <Skeleton width={96} height={44} borderRadius={radii.md} />
          </View>
        ))}
      </View>
    </View>
  );
}

function MaterialsScreenContent() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const searchRef = useRef<TextInput>(null);
  const { data, isLoading, error, refetch } = useAllMaterials();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("name");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const items = data?.items ?? [];
  const selected = items.find((material) => material.id === selectedId) ?? null;
  const categories = useMemo(
    () =>
      [...new Set(items.map(materialCategory))].sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [items],
  );
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return items
      .filter((material) => {
        const materialStatus = getStockStatus(material);
        const materialCategoryLabel = materialCategory(material);
        if (stockFilter !== "all" && materialStatus !== stockFilter) return false;
        if (category && materialCategoryLabel !== category) return false;
        if (!query) return true;
        return [
          displayIngredientName(material.name),
          material.unit,
          materialCategoryLabel,
        ].some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
      })
      .sort((a, b) => {
        if (sort === "stock") return a.stockQuantity - b.stockQuantity;
        if (sort === "proximity") return stockProximity(a) - stockProximity(b);
        if (sort === "value") return materialStockValue(b) - materialStockValue(a);
        return displayIngredientName(a.name).localeCompare(
          displayIngredientName(b.name),
          "pt-BR",
        );
      });
  }, [category, items, search, sort, stockFilter]);

  function clearFilters() {
    setSearch("");
    setStockFilter("all");
    setCategory(null);
  }

  const contentStyle = {
    ...pageGutter(isDesktop),
    ...desktopStretch(isDesktop, desktopWidths.data),
  };
  const compactHeader = !isDesktop && width < 360;
  const headerStyle = {
    ...pageGutter(isDesktop, compactHeader ? spacing.md : spacing.xl),
    ...desktopStretch(isDesktop, desktopWidths.data),
  };
  function renderBody() {
    if (isLoading) return <PantrySkeleton />;
    if (error) {
      return (
        <EmptyState
          title="Não foi possível carregar seus materiais"
          description="Verifique sua conexão e tente novamente."
          action={<Button title="Tentar novamente" onPress={() => void refetch()} />}
        />
      );
    }
    if (items.length === 0) {
      return (
        <>
          <PantrySummary items={items} />
          <EmptyState
            title="Seu estoque está vazio"
            description="Cadastre o primeiro material para acompanhar quantidade, custo e reposição."
            action={
              <Button
                title="Adicionar primeiro material"
                onPress={() => setShowCreate(true)}
              />
            }
          />
        </>
      );
    }

    return (
      <>
        <PantrySummary items={items} />
        <ReplenishmentAlert items={items} />

        <View
          style={{
            minHeight: 56,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.white,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
          }}
        >
          <AppIcon name="search-outline" size={23} color={palette.muted} />
          <CenteredTextInput
            ref={searchRef}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar material"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            accessibilityLabel="Buscar material por nome, categoria ou unidade"
            style={{
              flex: 1,
              minWidth: 0,
              color: palette.ink,
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
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="close" size={20} color={palette.muted} />
            </Pressable>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Typography variant="h3" color={palette.ink}>
            Seus materiais
          </Typography>
          <Pressable
            onPress={() => setShowSort(true)}
            accessibilityRole="button"
            accessibilityLabel="Ordenar materiais"
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Typography variant="bodyBold" color={palette.rose} style={{ fontSize: 13 }}>
              Ordenar
            </Typography>
            <AppIcon name="chevron-down" size={18} color={palette.rose} />
          </Pressable>
        </View>

        {visible.length === 0 ? (
          <View
            style={{
              minHeight: 190,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.white,
              padding: spacing.xl,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.md,
            }}
          >
            <AppIcon name="search-outline" size={34} color={palette.rose} />
            <Typography variant="h3" color={palette.ink} style={{ textAlign: "center" }}>
              Nenhum material encontrado
            </Typography>
            <Typography
              variant="body"
              color={palette.muted}
              style={{ textAlign: "center" }}
            >
              Limpe a busca ou ajuste os filtros para ver outros itens.
            </Typography>
            <Button
              title="Limpar busca e filtros"
              variant="secondary"
              onPress={clearFilters}
            />
          </View>
        ) : (
          <View
            style={{
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.white,
              overflow: "hidden",
            }}
          >
            {visible.map((material, index) => (
              <MaterialCard
                key={material.id}
                material={material}
                showDivider={index < visible.length - 1}
                onPress={() => setSelectedId(material.id)}
              />
            ))}
          </View>
        )}
      </>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        guidance={{
          area: "materials",
          onStart: () => setShowCreate(true),
          hasRecords: (data?.items.length ?? 0) > 0,
          loading: isLoading || !!error,
          suspended: showCreate,
        }}
        title="Materiais"
        subtitle={isDesktop ? "Saiba o que tem, o que falta e o que repor." : undefined}
        onBack={() => router.replace("/tabs/more")}
        backLabel="Ir para Mais opções"
        hideBack={isDesktop}
        style={{ ...headerStyle, paddingBottom: isDesktop ? spacing.md : 0 }}
        titleStyle={{ color: palette.ink }}
        subtitleStyle={{ color: palette.muted }}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Pressable
              onPress={() => searchRef.current?.focus()}
              accessibilityRole="button"
              accessibilityLabel="Ir para busca"
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="search" size={24} color={palette.ink} />
            </Pressable>
            <Pressable
              onPress={() => setShowFilters(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros"
              accessibilityState={{ selected: stockFilter !== "all" || category != null }}
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.full,
                backgroundColor:
                  stockFilter !== "all" || category ? palette.softRose : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="options-outline" size={24} color={palette.rose} />
            </Pressable>
            {isDesktop ? (
              <FAB
                icon="add"
                header
                accessibilityLabel="Novo material"
                onPress={() => setShowCreate(true)}
              />
            ) : null}
          </View>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          ...contentStyle,
          flexGrow: 1,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.lg,
        }}
      >
        {!isDesktop ? (
          <Typography variant="caption" color={palette.muted}>
            Saiba o que tem, o que falta e o que repor.
          </Typography>
        ) : null}
        {renderBody()}
      </ScrollView>

      {!isLoading && !error && items.length > 0 ? (
        <ScreenCreateBar title="+ Novo material" onPress={() => setShowCreate(true)} />
      ) : null}

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

      <StandardModal
        visible={showSort}
        onClose={() => setShowSort(false)}
        title="Ordenar materiais"
      >
        {SORT_OPTIONS.map((option) => (
          <ModalChoice
            key={option.key}
            label={option.label}
            selected={sort === option.key}
            onPress={() => {
              setSort(option.key);
              setShowSort(false);
            }}
          />
        ))}
      </StandardModal>

      <StandardModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrar estoque"
        footer={
          <Button
            title="Limpar filtros"
            variant="secondary"
            onPress={clearFilters}
            style={{ flex: 1 }}
          />
        }
      >
        <Typography variant="bodyBold" color={palette.ink}>
          Estado do estoque
        </Typography>
        <ModalChoice
          label="Todos"
          selected={stockFilter === "all"}
          onPress={() => setStockFilter("all")}
        />
        <ModalChoice
          label="Estoque baixo"
          selected={stockFilter === "low"}
          onPress={() => setStockFilter("low")}
        />
        <ModalChoice
          label="Atenção"
          selected={stockFilter === "attention"}
          onPress={() => setStockFilter("attention")}
        />
        <Typography
          variant="bodyBold"
          color={palette.ink}
          style={{ marginTop: spacing.sm }}
        >
          Categoria
        </Typography>
        <ModalChoice
          label="Todas as categorias"
          selected={category == null}
          onPress={() => setCategory(null)}
        />
        {categories.map((option) => (
          <ModalChoice
            key={option}
            label={option}
            selected={category === option}
            onPress={() => setCategory(option)}
          />
        ))}
        <Button title="Ver resultados" onPress={() => setShowFilters(false)} />
      </StandardModal>
    </SafeAreaView>
  );
}

function MaterialsRoute() {
  const pathname = usePathname();
  if (pathname === "/materials") return <Redirect href="/tabs/materials" />;
  return <MaterialsScreenContent />;
}

export default function MaterialsScreen() {
  return (
    <FeatureRouteGuard feature="materiais">
      <MaterialsRoute />
    </FeatureRouteGuard>
  );
}
