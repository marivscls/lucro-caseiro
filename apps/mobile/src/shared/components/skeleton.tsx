import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from "react-native";

import { radii, spacing, useReducedMotion, useTheme } from "@lucro-caseiro/ui";

import { useDesktopLayout } from "../layout/use-desktop-layout";

/**
 * Placeholder de carregamento ("skeleton") com animação de pulso.
 * Substitui spinners em estados de loading de conteúdo de tela — NÃO usar em
 * botões de submit (esses mantêm ActivityIndicator/texto de estado).
 *
 * Use variantes realistas (`SkeletonList variant="product"|…`) que espelham a
 * estrutura do componente final. Evite o layout genérico de linhas soltas.
 */

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: Readonly<SkeletonProps>) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(0.65);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonTextProps {
  /** Número de linhas de texto. */
  lines?: number;
  /** Largura da última linha (ex.: "60%") para simular parágrafo real. */
  lastLineWidth?: DimensionValue;
  lineHeight?: number;
  style?: ViewStyle;
}

export function SkeletonText({
  lines = 2,
  lastLineWidth = "60%",
  lineHeight = 14,
  style,
}: Readonly<SkeletonTextProps>) {
  const widths = useMemo(
    () =>
      Array.from({ length: lines }, (_, i) => (i === lines - 1 ? lastLineWidth : "100%")),
    [lines, lastLineWidth],
  );
  return (
    <View style={[styles.textGroup, style]}>
      {widths.map((width, i) => (
        <Skeleton key={`line-${i}`} width={width} height={lineHeight} />
      ))}
    </View>
  );
}

interface SkeletonCardProps {
  /** Número de linhas de texto dentro do card. */
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: Readonly<SkeletonCardProps>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      <SkeletonText lines={lines} />
    </View>
  );
}

/** Duas (ou N) tiles de resumo lado a lado — packaging / finance. */
export function SkeletonSummaryStrip({
  tiles = 2,
  style,
}: Readonly<{ tiles?: number; style?: ViewStyle }>) {
  const { theme } = useTheme();
  return (
    <View style={[styles.summaryStrip, style]}>
      {Array.from({ length: tiles }, (_, i) => (
        <View
          key={`tile-${i}`}
          style={[
            styles.summaryTile,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Skeleton width={28} height={28} borderRadius={radii.md} />
          <Skeleton width="55%" height={12} />
          <Skeleton width="70%" height={20} />
        </View>
      ))}
    </View>
  );
}

/** Linha de tabela desktop (fornecedores / vendas). */
export function SkeletonTable({
  rows = 6,
  columns = 4,
  style,
}: Readonly<{ rows?: number; columns?: number; style?: ViewStyle }>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.table,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      <View style={[styles.tableRow, styles.tableHeader]}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton
            key={`th-${i}`}
            width={i === 0 ? "28%" : "18%"}
            height={12}
            style={{ flexGrow: i === 0 ? 1.2 : 1 }}
          />
        ))}
      </View>
      {Array.from({ length: rows }, (_, r) => (
        <View key={`tr-${r}`} style={styles.tableRow}>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton
              key={`td-${r}-${c}`}
              width={c === columns - 1 ? 44 : "70%"}
              height={c === columns - 1 ? 28 : 14}
              borderRadius={c === columns - 1 ? radii.full : radii.sm}
              style={{ flexGrow: c === 0 ? 1.2 : 1 }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export type SkeletonListVariant =
  | "product"
  | "sale"
  | "client"
  | "material"
  | "recipe"
  | "supplier"
  | "purchase"
  | "order"
  | "fiado"
  | "quote"
  | "label"
  | "amount"
  | "picker"
  | "plain";

interface SkeletonListProps {
  rows?: number;
  /** Espelha a estrutura real do componente (card/linha/tabela). */
  variant?: SkeletonListVariant;
  style?: ViewStyle;
}

function EntityShell({
  children,
  style,
}: Readonly<{ children: React.ReactNode; style?: ViewStyle }>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.entityCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function ProductRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={64} height={64} borderRadius={12} />
        <View style={styles.entityBody}>
          <Skeleton width="72%" height={16} />
          <Skeleton width="40%" height={12} />
          <View style={styles.inlineRow}>
            <Skeleton width={88} height={16} />
            <Skeleton width={64} height={22} borderRadius={radii.full} />
          </View>
        </View>
      </View>
    </EntityShell>
  );
}

function SaleRow() {
  return (
    <EntityShell style={{ minHeight: 96, borderRadius: radii.xl }}>
      <View style={styles.entityRow}>
        <Skeleton width={62} height={62} borderRadius={radii.xl} />
        <View style={styles.entityBody}>
          <Skeleton width="65%" height={15} />
          <Skeleton width="45%" height={12} />
          <Skeleton width="55%" height={12} />
        </View>
        <View style={styles.trailingCol}>
          <Skeleton width={72} height={16} />
          <Skeleton width={64} height={28} borderRadius={radii.full} />
        </View>
      </View>
    </EntityShell>
  );
}

function ClientRow() {
  return (
    <View style={styles.clientRow}>
      <Skeleton width={44} height={44} borderRadius={radii.full} />
      <View style={styles.entityBody}>
        <Skeleton width="55%" height={15} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={18} height={18} borderRadius={radii.sm} />
    </View>
  );
}

function MaterialRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={52} height={52} borderRadius={radii.md} />
        <View style={styles.entityBody}>
          <View style={styles.inlineRow}>
            <Skeleton width="55%" height={15} />
            <Skeleton width={70} height={22} borderRadius={radii.full} />
          </View>
          <Skeleton width="35%" height={14} />
        </View>
      </View>
      <View style={styles.materialFooter}>
        <Skeleton width={96} height={14} />
        <View style={styles.inlineRow}>
          <Skeleton width={36} height={36} borderRadius={radii.full} />
          <Skeleton width={36} height={20} />
          <Skeleton width={36} height={36} borderRadius={radii.full} />
        </View>
      </View>
    </EntityShell>
  );
}

function RecipeRow() {
  return (
    <EntityShell style={{ minHeight: 96, borderRadius: radii.lg }}>
      <View style={styles.entityRow}>
        <Skeleton width={64} height={64} borderRadius={radii.full} />
        <View style={styles.entityBody}>
          <Skeleton width={56} height={18} borderRadius={radii.full} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="85%" height={12} />
        </View>
        <View style={styles.trailingCol}>
          <Skeleton width={48} height={12} />
          <Skeleton width={20} height={20} />
        </View>
      </View>
    </EntityShell>
  );
}

function SupplierRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={48} height={48} borderRadius={radii.full} />
        <View style={styles.entityBody}>
          <Skeleton width="60%" height={15} />
          <Skeleton width="45%" height={12} />
        </View>
        <Skeleton width={18} height={18} borderRadius={radii.sm} />
      </View>
    </EntityShell>
  );
}

function PurchaseRow() {
  const { theme } = useTheme();
  return (
    <EntityShell
      style={{ backgroundColor: theme.colors.surfaceElevated, borderWidth: 0 }}
    >
      <View style={styles.entityBody}>
        <View style={styles.inlineRow}>
          <Skeleton width="58%" height={16} />
          <Skeleton width={72} height={16} />
        </View>
        <View style={styles.inlineRow}>
          <Skeleton width="62%" height={12} />
          <Skeleton width={64} height={22} borderRadius={radii.sm} />
        </View>
        <Skeleton width="70%" height={12} />
        <View style={styles.inlineRow}>
          <Skeleton width={148} height={44} borderRadius={radii.md} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Skeleton width={44} height={44} borderRadius={radii.full} />
            <Skeleton width={44} height={44} borderRadius={radii.full} />
          </View>
        </View>
      </View>
    </EntityShell>
  );
}

function OrderRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={52} height={52} borderRadius={radii.md} />
        <View style={styles.entityBody}>
          <Skeleton width="65%" height={15} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="50%" height={12} />
        </View>
        <View style={styles.trailingCol}>
          <Skeleton width={64} height={22} borderRadius={radii.full} />
          <Skeleton width={72} height={14} />
        </View>
      </View>
    </EntityShell>
  );
}

function FiadoRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={48} height={48} borderRadius={radii.full} />
        <View style={styles.entityBody}>
          <Skeleton width="55%" height={15} />
          <Skeleton width="35%" height={12} />
        </View>
        <Skeleton width={80} height={28} borderRadius={radii.full} />
      </View>
    </EntityShell>
  );
}

function QuoteRow() {
  return (
    <EntityShell>
      <View style={styles.entityBody}>
        <View style={styles.inlineRow}>
          <Skeleton width="55%" height={15} />
          <Skeleton width={72} height={22} borderRadius={radii.full} />
        </View>
        <Skeleton width="60%" height={12} />
        <Skeleton width={88} height={16} />
      </View>
    </EntityShell>
  );
}

function LabelRow() {
  return (
    <EntityShell>
      <View style={styles.entityBody}>
        <Skeleton width="50%" height={15} />
        <Skeleton width="65%" height={12} />
        <Skeleton width="35%" height={12} />
      </View>
    </EntityShell>
  );
}

function AmountRow() {
  return (
    <EntityShell>
      <View style={styles.entityRow}>
        <Skeleton width={40} height={40} borderRadius={radii.md} />
        <View style={styles.entityBody}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={72} height={16} />
      </View>
    </EntityShell>
  );
}

function PickerRow() {
  return (
    <View style={styles.clientRow}>
      <Skeleton width={48} height={48} borderRadius={radii.md} />
      <View style={styles.entityBody}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={56} height={16} />
    </View>
  );
}

function PlainRow({ withAvatar }: Readonly<{ withAvatar: boolean }>) {
  return (
    <View style={styles.listRow}>
      {withAvatar ? <Skeleton width={44} height={44} borderRadius={radii.md} /> : null}
      <View style={styles.listRowText}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={12} />
      </View>
    </View>
  );
}

function renderVariantRow(variant: SkeletonListVariant) {
  switch (variant) {
    case "product":
      return <ProductRow />;
    case "sale":
      return <SaleRow />;
    case "client":
      return <ClientRow />;
    case "material":
      return <MaterialRow />;
    case "recipe":
      return <RecipeRow />;
    case "supplier":
      return <SupplierRow />;
    case "purchase":
      return <PurchaseRow />;
    case "order":
      return <OrderRow />;
    case "fiado":
      return <FiadoRow />;
    case "quote":
      return <QuoteRow />;
    case "label":
      return <LabelRow />;
    case "amount":
      return <AmountRow />;
    case "picker":
      return <PickerRow />;
    case "plain":
    default:
      return <PlainRow withAvatar />;
  }
}

export function SkeletonList({
  rows = 4,
  variant = "plain",
  style,
}: Readonly<SkeletonListProps>) {
  const isDesktop = useDesktopLayout();
  const useGrid = variant === "product" && isDesktop;

  if (useGrid) {
    return (
      <View style={[styles.productGrid, style]}>
        {Array.from({ length: rows }, (_, i) => (
          <View key={`skel-${variant}-${i}`} style={styles.productGridItem}>
            {renderVariantRow(variant)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <React.Fragment key={`skel-${variant}-${i}`}>
          {renderVariantRow(variant)}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Dashboard financeiro: tiles de resumo + lançamentos. */
export function SkeletonFinanceDashboard({ style }: Readonly<{ style?: ViewStyle }>) {
  return (
    <View style={[styles.financeDash, style]}>
      <SkeletonSummaryStrip tiles={2} />
      <Skeleton width="40%" height={14} />
      <SkeletonList rows={4} variant="amount" />
    </View>
  );
}

/** Home: hero + dois cards de atalho. */
export function SkeletonHome({ style }: Readonly<{ style?: ViewStyle }>) {
  return (
    <View style={[styles.financeDash, style]}>
      <Skeleton height={140} borderRadius={radii.xl} />
      <SkeletonSummaryStrip tiles={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  textGroup: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  listRowText: {
    flex: 1,
    gap: spacing.sm,
  },
  entityCard: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  entityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  entityBody: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  trailingCol: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  materialFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryTile: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 96,
  },
  table: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  tableHeader: {
    opacity: 0.7,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  productGridItem: {
    width: "31%",
    flexGrow: 1,
    minWidth: 220,
  },
  financeDash: {
    gap: spacing.lg,
  },
});
