/**
 * Peças de listas do desktop (web >= 1024px) usadas por Vendas, Clientes,
 * Fiado e Orçamentos. Só apresentação: estado e regras ficam nas rotas.
 * Complementam `shared/layout/desktop-page.tsx` (congelado nesta fase);
 * candidatas a promoção para lá depois.
 */
import {
  Button,
  CenteredTextInput,
  fonts,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { createContext, useContext, useState, type ReactNode } from "react";
import {
  Image,
  Pressable,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";

type HoverState = { pressed: boolean; hovered?: boolean };

const HeaderHeightContext = createContext<(height: number) => void>(() => undefined);

/**
 * Bloco do cabeçalho da página. Quando a faixa de orientação aparece abaixo do
 * `ScreenHeader`, garante 24px até o conteúdo (a faixa não traz margem).
 * Envolva o `ScreenHeader` de `renderHeader` em `DesktopMeasuredHeader`.
 */
export function DesktopHeaderBlock({ children }: Readonly<{ children: ReactNode }>) {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [padding, setPadding] = useState(0);
  const hasStrip = headerHeight > 0 && blockHeight - padding - headerHeight > 8;
  const nextPadding = hasStrip ? spacing["2xl"] : 0;
  if (nextPadding !== padding) setPadding(nextPadding);
  return (
    <HeaderHeightContext.Provider value={setHeaderHeight}>
      <View
        onLayout={(event) => setBlockHeight(event.nativeEvent.layout.height)}
        style={{ paddingBottom: nextPadding }}
      >
        {children}
      </View>
    </HeaderHeightContext.Provider>
  );
}

/** Mede o `ScreenHeader` dentro de `DesktopHeaderBlock`. */
export function DesktopMeasuredHeader({ children }: Readonly<{ children: ReactNode }>) {
  const report = useContext(HeaderHeightContext);
  return (
    <View onLayout={(event) => report(event.nativeEvent.layout.height)}>{children}</View>
  );
}

/** Campo de busca da barra de ferramentas: 52px, texto de 16px, limpar. */
export function DesktopSearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  style,
}: Readonly<{
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          flexGrow: 1,
          flexBasis: 280,
          minWidth: 260,
          minHeight: 52,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: spacing.lg,
          gap: spacing.md,
        },
        style,
      ]}
    >
      <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
      <CenteredTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        returnKeyType="search"
        style={{
          flex: 1,
          minWidth: 0,
          height: 50,
          padding: 0,
          color: theme.colors.text,
          fontFamily: fonts.regular,
          fontSize: 16,
        }}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      ) : (
        <View style={{ width: spacing.sm }} />
      )}
    </View>
  );
}

export type DesktopSegmentOption<T extends string> = Readonly<{
  key: T;
  label: string;
  count?: number;
}>;

/**
 * Controle segmentado (filtros de status): opções de 44px com texto de 16px e
 * contagem ao lado, no lugar dos chips de 13px. Mesma altura da busca.
 */
export function DesktopSegmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Readonly<{
  options: readonly DesktopSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0,
        minHeight: 52,
        padding: 3,
        gap: 2,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pal.surface,
      }}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={
              option.count === undefined
                ? option.label
                : `${option.label}, ${option.count}`
            }
            style={({ pressed, hovered }: HoverState) => ({
              minHeight: 44,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.md,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor:
                selected || hovered ? theme.colors.surfaceElevated : "transparent",
              borderWidth: 1,
              borderColor: selected ? theme.colors.border : "transparent",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              variant={selected ? "desktopBodyStrong" : "desktopBody"}
              color={selected ? pal.wine : theme.colors.text}
              numberOfLines={1}
            >
              {option.label}
            </Typography>
            {option.count === undefined ? null : (
              <Typography
                variant="desktopMeta"
                color={selected ? pal.wine : theme.colors.textSecondary}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {option.count}
              </Typography>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Abas da página (ex.: Vendas / Encomendas): 16px, sublinhado vinho de 3px. */
export function DesktopViewTabs<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Readonly<{
  options: readonly DesktopSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: "row",
        gap: spacing["2xl"],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: -1,
              borderBottomWidth: 3,
              borderBottomColor: selected ? pal.wine : "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              variant="desktopBodyStrong"
              color={selected ? pal.wine : theme.colors.textSecondary}
              style={{ fontSize: 17 }}
            >
              {option.label}
            </Typography>
            {option.count === undefined ? null : (
              <View
                style={{
                  minWidth: 26,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.full,
                  alignItems: "center",
                  backgroundColor: selected ? pal.softRose : pal.surface,
                }}
              >
                <Typography
                  variant="desktopMeta"
                  color={selected ? pal.wine : theme.colors.textSecondary}
                >
                  {option.count}
                </Typography>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Botão de escolha da barra (ex.: ordenação): 52px, rótulo + valor + seta. */
export function DesktopSelectButton({
  label,
  value,
  onPress,
}: Readonly<{ label: string; value: string; onPress: () => void }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed, hovered }: HoverState) => ({
        minHeight: 52,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: hovered ? theme.colors.textSecondary : theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flexShrink: 0,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Typography variant="desktopBody" numberOfLines={1}>
        {label}
      </Typography>
      <Typography variant="desktopBodyStrong" color={pal.wine} numberOfLines={1}>
        {value}
      </Typography>
      <AppIcon name="chevron-down" size={18} color={pal.wine} />
    </Pressable>
  );
}

/** Linha da barra de ferramentas: busca que cresce + filtros; quebra em 1024. */
export function DesktopToolbar({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Estado vazio do desktop: cartão tracejado na coluna, título de 18px e texto
 * de 16px, com ação de largura do texto e ilustração opcional.
 */
export function DesktopEmptyCard({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = "add",
  secondary = false,
  art,
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: AppIconName;
  /** Ação de contorno (ex.: "Limpar filtros") em vez da principal. */
  secondary?: boolean;
  art?: ImageSourcePropType;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        minHeight: 240,
        borderRadius: radii.lg,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        paddingVertical: spacing["4xl"],
        paddingHorizontal: spacing["3xl"],
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
      }}
    >
      {art ? (
        <Image
          source={art}
          resizeMode="contain"
          accessible={false}
          style={{ width: 120, height: 96 }}
        />
      ) : null}
      <View style={{ alignItems: "center", gap: spacing.sm, maxWidth: 520 }}>
        <Typography
          variant="desktopCardTitle"
          accessibilityRole="header"
          style={{ textAlign: "center" }}
        >
          {title}
        </Typography>
        <Typography variant="desktopBody" style={{ textAlign: "center" }}>
          {description}
        </Typography>
      </View>
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant={secondary ? "outline" : "primary"}
          onPress={onAction}
          style={{ minWidth: 200, minHeight: 48 }}
          icon={
            secondary ? undefined : (
              <AppIcon name={actionIcon} size={20} color={theme.colors.textOnPrimary} />
            )
          }
        />
      ) : null}
    </View>
  );
}

/** Rodapé da tabela: total de registros e páginas com botões de 44px. */
export function DesktopPager({
  page,
  totalPages,
  total,
  noun,
  onPageChange,
}: Readonly<{
  page: number;
  totalPages: number;
  total: number;
  noun: readonly [singular: string, plural: string];
  onPageChange: (page: number) => void;
}>) {
  const countLabel = `${total} ${total === 1 ? noun[0] : noun[1]}`;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.lg,
        minHeight: 48,
      }}
    >
      <Typography variant="desktopMeta" style={{ fontSize: 15 }}>
        {totalPages > 1 ? `${countLabel} · página ${page} de ${totalPages}` : countLabel}
      </Typography>
      {totalPages > 1 ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <DesktopRowButton
            icon="chevron-back"
            label="Anterior"
            accessibilityLabel="Página anterior"
            disabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
          />
          <DesktopRowButton
            icon="chevron-forward"
            iconAfter
            label="Próxima"
            accessibilityLabel="Próxima página"
            disabled={page >= totalPages}
            onPress={() => onPageChange(page + 1)}
          />
        </View>
      ) : null}
    </View>
  );
}

export type DesktopTone = "positive" | "attention" | "negative" | "neutral" | "brand";

/** Selo de situação (Pago, Pendente, Vencido…): 14px, fundo suave do tom. */
export function DesktopStatusPill({
  label,
  tone,
  align = "start",
}: Readonly<{ label: string; tone: DesktopTone; align?: "start" | "end" }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const palette: Record<DesktopTone, { bg: string; fg: string }> = {
    positive: { bg: theme.colors.successBg, fg: theme.colors.success },
    attention: { bg: theme.colors.yellowBg, fg: theme.colors.yellow },
    negative: { bg: theme.colors.alertBg, fg: theme.colors.alert },
    neutral: { bg: pal.surface, fg: theme.colors.textSecondary },
    brand: { bg: pal.softRose, fg: pal.wine },
  };
  const colors = palette[tone];
  return (
    <View
      style={{
        alignSelf: align === "end" ? "flex-end" : "flex-start",
        minHeight: 28,
        paddingHorizontal: spacing.md,
        borderRadius: radii.full,
        justifyContent: "center",
        backgroundColor: colors.bg,
      }}
    >
      <Typography
        variant="desktopMeta"
        color={colors.fg}
        numberOfLines={1}
        style={{ fontFamily: fonts.semiBold }}
      >
        {label}
      </Typography>
    </View>
  );
}

function rowButtonBorder(
  filled: boolean,
  hovered: boolean | undefined,
  tint: string,
  fill: string,
  border: string,
): string {
  if (filled) return fill;
  return hovered ? tint : border;
}

function rowButtonOpacity(disabled: boolean, pressed: boolean): number {
  if (disabled) return 0.4;
  return pressed ? 0.8 : 1;
}

/** Botão de contorno de 44px com ícone + texto de 16px (ações de linha). */
export function DesktopRowButton({
  icon,
  label,
  onPress,
  accessibilityLabel,
  color,
  iconAfter = false,
  disabled = false,
  filled = false,
  grow = false,
}: Readonly<{
  icon: AppIconName;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  color?: string;
  iconAfter?: boolean;
  disabled?: boolean;
  filled?: boolean;
  /** Ocupa o espaço livre da linha (ações de rodapé de cartão). */
  grow?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const tint = color ?? pal.wine;
  const fg = filled ? pal.onWine : tint;
  const iconNode = <AppIcon name={icon} size={18} color={fg} />;
  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed, hovered }: HoverState) => ({
        minHeight: 44,
        flexGrow: grow ? 1 : 0,
        flexBasis: grow ? 0 : "auto",
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: rowButtonBorder(
          filled,
          hovered,
          tint,
          pal.wineFill,
          theme.colors.border,
        ),
        backgroundColor: filled ? pal.wineFill : theme.colors.surfaceElevated,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        opacity: rowButtonOpacity(disabled, pressed),
      })}
    >
      {iconAfter ? null : iconNode}
      <Typography variant="desktopBodyStrong" color={fg} numberOfLines={1}>
        {label}
      </Typography>
      {iconAfter ? iconNode : null}
    </Pressable>
  );
}

/** Célula de texto de tabela (16px, uma linha). */
export function DesktopCellText({
  children,
  strong = false,
  color,
  align,
  lines = 1,
}: Readonly<{
  children: ReactNode;
  strong?: boolean;
  color?: string;
  align?: "left" | "right";
  lines?: number;
}>) {
  const { theme } = useTheme();
  return (
    <Typography
      variant={strong ? "desktopBodyStrong" : "desktopBody"}
      color={color ?? theme.colors.text}
      numberOfLines={lines}
      style={{
        textAlign: align,
        maxWidth: "100%",
        fontVariant: align === "right" ? ["tabular-nums"] : undefined,
      }}
    >
      {children}
    </Typography>
  );
}

export type DesktopStatItem = Readonly<{ label: string; value: string; color?: string }>;

/**
 * Faixa de indicadores que não corta valores: 4 colunas quando cada uma tem
 * ao menos 210px; senão 2 x 2 (1024px). Mesma tipografia de `DesktopStatRow`.
 */
export function DesktopStatGrid({
  items,
}: Readonly<{ items: readonly DesktopStatItem[] }>) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const columns = width > 0 && width / items.length < 210 ? 2 : items.length;
  const itemWidth = width > 0 ? width / columns : undefined;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width - 2)}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        overflow: "hidden",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
      }}
    >
      {items.map((item, index) => (
        <View
          key={item.label}
          style={{
            width: itemWidth,
            flexGrow: itemWidth ? 0 : 1,
            minWidth: 0,
            gap: spacing.xs,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing["2xl"],
            borderLeftWidth: index % columns === 0 ? 0 : 1,
            borderTopWidth: index >= columns ? 1 : 0,
            borderColor: theme.colors.border,
          }}
        >
          <Typography variant="desktopMetricLabel" numberOfLines={1}>
            {item.label}
          </Typography>
          <Typography variant="desktopMetric" color={item.color} numberOfLines={1}>
            {item.value}
          </Typography>
        </View>
      ))}
    </View>
  );
}

export type DesktopHeroStat = Readonly<{ label: string; value: string; hint?: string }>;

/**
 * Painel vinho do desktop: valor principal de 40px, indicadores de 28px ao
 * lado (separados por filete) e a arte da tela à direita.
 */
export function DesktopWineHero({
  label,
  value,
  meta,
  stats = [],
  art,
}: Readonly<{
  label: string;
  value: string;
  meta?: string;
  stats?: readonly DesktopHeroStat[];
  art?: ImageSourcePropType;
}>) {
  const pal = useBrandScreenPalette();
  const [width, setWidth] = useState(0);
  // Em 1024px a arte sai para os indicadores caberem inteiros.
  const showArt = !!art && width >= 880;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        borderRadius: radii.lg,
        backgroundColor: pal.wineFill,
        overflow: "hidden",
        paddingVertical: spacing["3xl"],
        paddingHorizontal: spacing["3xl"],
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing["3xl"],
        minHeight: 176,
      }}
    >
      <View style={{ flexShrink: 0, gap: spacing.xs }}>
        <Typography variant="desktopMetricLabel" color={pal.onWineMuted}>
          {label}
        </Typography>
        <Typography
          variant="desktopTotal"
          color={pal.onWine}
          numberOfLines={1}
          style={{ fontSize: 40, lineHeight: 48 }}
        >
          {value}
        </Typography>
        {meta ? (
          <Typography variant="desktopBody" color={pal.onWineMuted}>
            {meta}
          </Typography>
        ) : null}
      </View>
      {stats.length > 0 ? (
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row" }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                minWidth: 0,
                gap: spacing.xs,
                paddingLeft: spacing["2xl"],
                paddingBottom: spacing.xs,
                borderLeftWidth: 1,
                borderLeftColor: pal.wineDivider,
              }}
            >
              <Typography
                variant="desktopMetricLabel"
                color={pal.onWineMuted}
                numberOfLines={1}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="desktopMetric"
                color={pal.onWine}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {stat.value}
              </Typography>
              {stat.hint ? (
                <Typography
                  variant="desktopMeta"
                  color={pal.onWineMuted}
                  numberOfLines={1}
                >
                  {stat.hint}
                </Typography>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {showArt ? (
        <Image
          source={art}
          resizeMode="contain"
          accessible={false}
          style={{ width: 132, height: 112, flexShrink: 0, alignSelf: "center" }}
        />
      ) : null}
    </View>
  );
}

/** Cabeçalho de lista: título de 22px + contagem e ação opcional à direita. */
export function DesktopListHeader({
  title,
  count,
  right,
}: Readonly<{ title: string; count?: string; right?: ReactNode }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "baseline",
          gap: spacing.md,
        }}
      >
        <Typography variant="desktopSection" accessibilityRole="header">
          {title}
        </Typography>
        {count ? <Typography variant="desktopMeta">{count}</Typography> : null}
      </View>
      {right}
    </View>
  );
}
