/**
 * Primitivas de layout do desktop (web >= 1024px).
 *
 * Contrato único: no celular TODAS renderizam os filhos sem nenhum wrapper
 * (fragmento), então embrulhar a marcação mobile existente é seguro. No
 * desktop elas aplicam o padrão descrito em `desktop-screen-checklist.md`.
 */
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState, type ReactNode } from "react";
import {
  Pressable,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { AppIcon, type AppIconName } from "../components/app-icon";
import { desktopLayout, desktopWidths } from "./desktop-density";
import { useDesktopLayout } from "./use-desktop-layout";

type Theme = ReturnType<typeof useTheme>["theme"];

export type DesktopPageWidth = "page" | "form" | "reading";

const PAGE_WIDTHS: Record<DesktopPageWidth, number> = {
  page: desktopWidths.page,
  form: desktopWidths.form,
  reading: desktopWidths.reading,
};

/**
 * Estilo do conteúdo rolável de uma página no desktop: largura da página,
 * blocos a 32px e respiro no fim. Use no `contentContainerStyle`.
 */
export function desktopPageContent(
  isDesktop: boolean,
  width: DesktopPageWidth = "page",
): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: PAGE_WIDTHS[width],
    gap: desktopLayout.blockGap,
    paddingBottom: desktopLayout.pageBottom,
  };
}

/** Superfície de cartão do desktop: branco, borda hairline, raio 16. */
export function desktopCardStyle(
  theme: Theme,
  options: Readonly<{ padding?: number; selected?: boolean; accent?: string }> = {},
): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: options.selected
      ? (options.accent ?? theme.colors.primaryStrong)
      : theme.colors.border,
    borderWidth: options.selected ? 2 : 1,
    // A borda de seleção mais grossa não pode empurrar o conteúdo.
    padding: (options.padding ?? spacing["2xl"]) - (options.selected ? 1 : 0),
    borderRadius: radii.lg,
  };
}

/** Largura medida + colunas que cabem. Base de `DesktopGrid` e `DesktopFormGrid`. */
export function desktopColumns(
  width: number,
  minColumnWidth: number,
  gap: number,
  maxColumns: number,
): { columns: number; itemWidth: number } {
  const fit = Math.floor((width + gap) / (minColumnWidth + gap));
  const columns = Math.max(1, Math.min(maxColumns, fit));
  const itemWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;
  return { columns, itemWidth: Math.floor(itemWidth * 100) / 100 };
}

export function useDesktopColumns(
  minColumnWidth: number,
  gap: number = spacing.lg,
  maxColumns = 4,
) {
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((current) => (Math.abs(current - next) < 1 ? current : next));
  };
  return { ...desktopColumns(width, minColumnWidth, gap, maxColumns), width, onLayout };
}

/**
 * Página sem rolagem própria (ex.: a rolagem fica nas colunas). Para páginas
 * com ScrollView, prefira `desktopPageContent` no contentContainerStyle.
 */
export function DesktopPage({
  children,
  width = "page",
  style,
}: Readonly<{ children: ReactNode; width?: DesktopPageWidth; style?: ViewStyle }>) {
  const isDesktop = useDesktopLayout();
  if (!isDesktop) return <>{children}</>;
  return (
    <View style={[{ flex: 1, minHeight: 0 }, desktopPageContent(true, width), style]}>
      {children}
    </View>
  );
}

/**
 * Largura da lateral: `preferred` (360) em telas largas, até 280 quando a
 * área útil é estreita (1024px), para a coluna principal não sumir.
 */
export function desktopAsideWidth(
  rowWidth: number,
  preferred: number = desktopLayout.asideWidth,
): number {
  if (rowWidth <= 0) return preferred;
  return Math.round(Math.min(preferred, Math.max(280, rowWidth * 0.32)));
}

/**
 * Duas colunas: principal flexível + lateral (280 a 360px) que fica visível ao
 * rolar. No celular renderiza `children` e depois `aside` (passe `null` quando
 * a lateral só existe no desktop).
 */
export function DesktopSplit({
  children,
  aside,
  asideWidth = desktopLayout.asideWidth,
  sticky = true,
  style,
  mainStyle,
  onMainLayout,
}: Readonly<{
  children: ReactNode;
  aside?: ReactNode;
  asideWidth?: number;
  sticky?: boolean;
  style?: StyleProp<ViewStyle>;
  mainStyle?: StyleProp<ViewStyle>;
  onMainLayout?: (event: LayoutChangeEvent) => void;
}>) {
  const isDesktop = useDesktopLayout();
  const [rowWidth, setRowWidth] = useState(0);
  if (!isDesktop) {
    return (
      <>
        {children}
        {aside}
      </>
    );
  }
  return (
    <View
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: rowWidth < 880 ? spacing["2xl"] : desktopLayout.columnGap,
          width: "100%",
        },
        style,
      ]}
    >
      <View
        onLayout={onMainLayout}
        style={[{ flex: 1, minWidth: 0, gap: desktopLayout.sectionGap }, mainStyle]}
      >
        {children}
      </View>
      {aside ? (
        <View
          style={{
            width: desktopAsideWidth(rowWidth, asideWidth),
            flexShrink: 0,
            gap: spacing.lg,
            ...(sticky
              ? {
                  // RN Web: a lateral acompanha a rolagem da página.
                  position: "sticky" as ViewStyle["position"],
                  top: spacing["2xl"],
                }
              : null),
          }}
        >
          {aside}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Grade de cartões que preenche a coluna: quantas colunas de `minColumnWidth`
 * couberem (até `maxColumns`). Cada filho recebe a largura calculada.
 */
export function DesktopGrid({
  children,
  minColumnWidth = 240,
  maxColumns = 4,
  gap = spacing.lg,
  style,
}: Readonly<{
  children: ReactNode;
  minColumnWidth?: number;
  maxColumns?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const isDesktop = useDesktopLayout();
  const grid = useDesktopColumns(minColumnWidth, gap, maxColumns);
  if (!isDesktop) return <>{children}</>;
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      onLayout={grid.onLayout}
      style={[{ flexDirection: "row", flexWrap: "wrap", gap, width: "100%" }, style]}
    >
      {grid.width > 0
        ? items.map((child, index) => (
            <View
              key={React.isValidElement(child) && child.key ? child.key : index}
              style={{ width: grid.itemWidth, minWidth: 0 }}
            >
              {child}
            </View>
          ))
        : null}
    </View>
  );
}

/**
 * Seção com título de 22px, descrição opcional e ação de texto à direita.
 * `card` envolve o conteúdo em uma superfície de cartão.
 */
export function DesktopSection({
  title,
  description,
  action,
  card = false,
  children,
  style,
}: Readonly<{
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void; accessibilityLabel?: string };
  card?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  if (!isDesktop) return <>{children}</>;
  return (
    <View style={[{ gap: spacing.lg }, card ? desktopCardStyle(theme) : null, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          {/* Fora de cartão 22px; dentro de cartão 18px. */}
          <Typography
            variant={card ? "desktopCardTitle" : "desktopSection"}
            accessibilityRole="header"
          >
            {title}
          </Typography>
          {description ? (
            <Typography variant="desktopBody">{description}</Typography>
          ) : null}
        </View>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel ?? action.label}
            style={({ pressed }) => ({
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography variant="desktopBodyStrong" color={theme.colors.primaryStrong}>
              {action.label}
            </Typography>
            <AppIcon
              name="chevron-forward"
              size={18}
              color={theme.colors.primaryStrong}
            />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Cartão do desktop (ver `desktopCardStyle`). */
export function DesktopCard({
  children,
  padding,
  selected,
  style,
}: Readonly<{
  children: ReactNode;
  padding?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  if (!isDesktop) return <>{children}</>;
  return (
    <View
      style={[desktopCardStyle(theme, { padding, selected }), { gap: spacing.lg }, style]}
    >
      {children}
    </View>
  );
}

/**
 * Campos de formulário em colunas (2 por padrão, 1 abaixo de 560px de largura
 * útil). Envolva campos longos em `DesktopField span="full"`.
 */
export function DesktopFormGrid({
  children,
  columns = 2,
  minColumnWidth = 260,
  style,
}: Readonly<{
  children: ReactNode;
  columns?: 2 | 3;
  minColumnWidth?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const isDesktop = useDesktopLayout();
  const gap = spacing["2xl"];
  const grid = useDesktopColumns(minColumnWidth, gap, columns);
  if (!isDesktop) return <>{children}</>;
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      onLayout={grid.onLayout}
      style={[
        { flexDirection: "row", flexWrap: "wrap", columnGap: gap, rowGap: spacing.lg },
        style,
      ]}
    >
      {grid.width > 0
        ? items.map((child, index) => {
            const full =
              React.isValidElement<{ span?: string }>(child) &&
              child.type === DesktopField &&
              child.props.span === "full";
            return (
              <View
                key={React.isValidElement(child) && child.key ? child.key : index}
                style={{ width: full ? "100%" : grid.itemWidth, minWidth: 0 }}
              >
                {child}
              </View>
            );
          })
        : null}
    </View>
  );
}

/** Célula de `DesktopFormGrid`; `span="full"` ocupa a linha inteira. */
export function DesktopField({
  children,
}: Readonly<{ children: ReactNode; span?: "one" | "full" }>) {
  return <>{children}</>;
}

/**
 * Ações de formulário/etapa alinhadas à direita, botões com largura do texto
 * (mínimo 160px). A ação principal vem por último.
 */
export function DesktopFormActions({
  children,
  divider = true,
  style,
}: Readonly<{ children: ReactNode; divider?: boolean; style?: StyleProp<ViewStyle> }>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  if (!isDesktop) return <>{children}</>;
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: spacing.md,
          paddingTop: divider ? spacing["2xl"] : 0,
          borderTopWidth: divider ? 1 : 0,
          borderTopColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Estilo dos botões dentro de `DesktopFormActions`. */
export const desktopActionButton: ViewStyle = { minWidth: 160, minHeight: 48 };

export type DesktopStat = Readonly<{
  label: string;
  value: string;
  /** Cor do valor (ex.: theme.colors.success para dinheiro recebido). */
  color?: string;
  hint?: string;
}>;

/** Faixa de indicadores: rótulo 15px acima, valor 28px, dica opcional 14px. */
export function DesktopStatRow({
  items,
  style,
}: Readonly<{ items: readonly DesktopStat[]; style?: StyleProp<ViewStyle> }>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  if (!isDesktop) return null;
  return (
    <View
      style={[
        desktopCardStyle(theme, { padding: 0 }),
        { flexDirection: "row", overflow: "hidden" },
        style,
      ]}
    >
      {items.map((item, index) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            minWidth: 0,
            gap: spacing.xs,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing["2xl"],
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: theme.colors.border,
          }}
        >
          <Typography variant="desktopMetricLabel" numberOfLines={1}>
            {item.label}
          </Typography>
          <Typography
            variant="desktopMetric"
            color={item.color}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.value}
          </Typography>
          {item.hint ? <Typography variant="desktopMeta">{item.hint}</Typography> : null}
        </View>
      ))}
    </View>
  );
}

export type DesktopTableColumn<T> = Readonly<{
  key: string;
  title: string;
  /** Proporção da coluna (padrão 1). Use `width` para colunas fixas. */
  flex?: number;
  width?: number;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}>;

/**
 * Tabela de dados: cabeçalho 14px, linhas de 56px com texto de 16px,
 * valores à direita. Renderiza nada no celular: use a lista mobile lá.
 */
export function DesktopTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowPress,
  rowAccessibilityLabel,
  empty,
}: Readonly<{
  columns: readonly DesktopTableColumn<T>[];
  rows: readonly T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
  rowAccessibilityLabel?: (row: T) => string;
  empty?: ReactNode;
}>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  if (!isDesktop) return null;
  const cellStyle = (column: DesktopTableColumn<T>): ViewStyle => ({
    flex: column.width ? undefined : (column.flex ?? 1),
    width: column.width,
    minWidth: 0,
    alignItems: column.align === "right" ? "flex-end" : "flex-start",
  });
  return (
    <View
      accessibilityRole="list"
      style={[desktopCardStyle(theme, { padding: 0 }), { overflow: "hidden" }]}
    >
      <View
        style={{
          flexDirection: "row",
          gap: spacing.lg,
          paddingHorizontal: spacing["2xl"],
          paddingVertical: spacing.md,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        {columns.map((column) => (
          <View key={column.key} style={cellStyle(column)}>
            <Typography variant="desktopMeta" numberOfLines={1}>
              {column.title}
            </Typography>
          </View>
        ))}
      </View>
      {rows.length === 0 ? empty : null}
      {rows.map((row, index) => (
        <Pressable
          key={keyExtractor(row)}
          disabled={!onRowPress}
          onPress={() => onRowPress?.(row)}
          accessibilityRole={onRowPress ? "button" : undefined}
          accessibilityLabel={rowAccessibilityLabel?.(row)}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            minHeight: 56,
            paddingHorizontal: spacing["2xl"],
            paddingVertical: spacing.md,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: theme.colors.border,
            backgroundColor:
              onRowPress && (pressed || hovered) ? theme.colors.surface : undefined,
          })}
        >
          {columns.map((column) => (
            <View key={column.key} style={cellStyle(column)}>
              {column.render(row)}
            </View>
          ))}
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Botão secundário da barra de ferramentas (ícone + texto, 52px), ao lado da
 * busca. Só para o desktop: no celular use os atalhos da própria tela.
 */
export function DesktopToolbarButton({
  icon,
  label,
  onPress,
}: Readonly<{ icon: AppIconName; label: string; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        minHeight: 52,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <AppIcon name={icon} size={20} color={theme.colors.text} />
      <Typography variant="desktopBodyStrong" numberOfLines={1}>
        {label}
      </Typography>
    </Pressable>
  );
}
