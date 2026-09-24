import { spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { useDesktopColumns } from "../layout/desktop-page";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import { fieldMetrics } from "./form-field";

/** Espaço entre seções de um formulário. */
export const formSectionGap = spacing["3xl"];

/** Corpo do formulário: seções empilhadas com o mesmo ritmo em todas as telas. */
export function FormBody({
  children,
  style,
}: Readonly<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>) {
  return <View style={[{ gap: formSectionGap }, style]}>{children}</View>;
}

/**
 * Campos em colunas quando há largura (mede o próprio espaço, então funciona em
 * modal estreito, tela larga e celular). Abaixo de `minColumnWidth` × colunas,
 * vira uma coluna. Filhos com `span="full"` ocupam a linha inteira.
 */
export function FormGrid({
  children,
  columns = 2,
  minColumnWidth = 220,
  style,
}: Readonly<{
  children: React.ReactNode;
  columns?: 2 | 3;
  minColumnWidth?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const columnGap = spacing.lg;
  const grid = useDesktopColumns(minColumnWidth, columnGap, columns);
  const items = React.Children.toArray(children).filter(Boolean);
  if (grid.columns === 1 || grid.width === 0) {
    return (
      <View onLayout={grid.onLayout} style={[{ gap: fieldMetrics.fieldGap }, style]}>
        {items}
      </View>
    );
  }
  return (
    <View
      onLayout={grid.onLayout}
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          columnGap,
          rowGap: fieldMetrics.fieldGap,
        },
        style,
      ]}
    >
      {items.map((child, index) => {
        const full =
          React.isValidElement<{ span?: string }>(child) && child.props.span === "full";
        return (
          <View
            key={React.isValidElement(child) && child.key ? child.key : index}
            style={{ width: full ? "100%" : grid.itemWidth, minWidth: 0 }}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

function actionSlotStyle(
  isDesktop: boolean,
  column: boolean,
  last: boolean,
  count: number,
): ViewStyle | undefined {
  if (isDesktop) return { minWidth: 160 };
  if (column) return undefined;
  // A ação principal (última) fica um pouco mais larga no celular.
  return { flex: last && count > 1 ? 1.4 : 1 };
}

/**
 * Ações do formulário. Celular: botões dividem a largura (principal por último,
 * à direita). Computador: alinhados à direita, com a largura do texto (mín. 160).
 */
export function FormActions({
  children,
  divider = false,
  stack = false,
  style,
}: Readonly<{
  children: React.ReactNode;
  divider?: boolean;
  /** Celular: um botão por linha (quando os rótulos são longos). */
  stack?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  const items = React.Children.toArray(children).filter(Boolean);
  const column = !isDesktop && stack;
  return (
    <View
      style={[
        {
          // Cresce na largura do rodapé sem colapsar a altura quando fica no corpo.
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: "auto",
          flexDirection: column ? "column-reverse" : "row",
          // No computador, várias ações quebram linha em vez de estourar a janela.
          flexWrap: isDesktop ? "wrap" : "nowrap",
          justifyContent: isDesktop ? "flex-end" : undefined,
          alignItems: isDesktop ? "center" : "stretch",
          gap: spacing.md,
        },
        divider
          ? {
              paddingTop: spacing["2xl"],
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }
          : null,
        style,
      ]}
    >
      {items.map((child, index) => (
        <View
          key={React.isValidElement(child) && child.key ? child.key : index}
          style={actionSlotStyle(
            isDesktop,
            column,
            index === items.length - 1,
            items.length,
          )}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
