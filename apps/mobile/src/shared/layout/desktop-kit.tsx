/**
 * Peças de apresentação do desktop (web >= 1024px) repetidas entre telas:
 * estado vazio tracejado, selo de 14px, busca da barra de ferramentas e
 * controle segmentado. Complementam `desktop-page.tsx`; só apresentação.
 *
 * Diferente das primitivas de `desktop-page.tsx`, estas peças sempre
 * renderizam: use-as apenas nos ramos de desktop das telas.
 */
import {
  Button,
  CenteredTextInput,
  fonts,
  radii,
  spacing,
  Typography,
  useTheme,
  type SemanticVariant,
} from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import {
  Image,
  Pressable,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useBrandScreenPalette } from "../brand-palette";
import { AppIcon, type AppIconName } from "../components/app-icon";
import { desktopActionButton, desktopCardStyle } from "./desktop-page";

type HoverState = { pressed: boolean; hovered?: boolean };

export type DesktopEmptyAction = Readonly<{
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  /** Ícone antes do texto (só na ação principal). */
  icon?: AppIconName;
}>;

/**
 * Arranjos do estado vazio:
 * - `row`: ícone em círculo rosado, texto e ação à direita (listas com grade).
 * - `stack`: cartão branco com ícone, texto e ação alinhados à esquerda.
 * - `center`: texto centralizado e ações abaixo (seções dentro de uma coluna).
 * - `tall`: cartão branco de 240px, com ilustração opcional (listas de Vendas).
 */
export type DesktopEmptyLayout = "row" | "stack" | "center" | "tall";

const EMPTY_BORDER: ViewStyle = {
  borderWidth: 1.5,
  borderStyle: "dashed",
  borderRadius: radii.lg,
};

/**
 * Estado vazio do desktop: cartão tracejado na coluna, título de 18px e texto
 * de 16px, com ação de largura do texto. `action` cobre o caso comum; use
 * `children` para duas ações ou ações próprias.
 */
export function DesktopEmptyCard({
  title,
  description,
  layout = "row",
  icon,
  art,
  action,
  children,
}: Readonly<{
  title: string;
  description: string;
  layout?: DesktopEmptyLayout;
  icon?: AppIconName;
  art?: ImageSourcePropType;
  action?: DesktopEmptyAction;
  children?: ReactNode;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const tall = layout === "tall";
  const button = action ? (
    <Button
      title={action.label}
      variant={action.variant ?? "primary"}
      onPress={action.onPress}
      style={tall ? { minWidth: 200, minHeight: 48 } : desktopActionButton}
      icon={
        action.icon && (action.variant ?? "primary") === "primary" ? (
          <AppIcon name={action.icon} size={20} color={theme.colors.textOnPrimary} />
        ) : undefined
      }
    />
  ) : null;
  const actions =
    button || children ? (
      <>
        {button}
        {children}
      </>
    ) : null;

  if (layout === "row") {
    return (
      <View
        style={[
          EMPTY_BORDER,
          {
            borderColor: theme.colors.border,
            paddingVertical: spacing["3xl"],
            paddingHorizontal: spacing["2xl"],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xl,
          },
        ]}
      >
        {icon ? (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: pal.softRose,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={icon} size={26} color={pal.wine} />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="desktopCardTitle">{title}</Typography>
          <Typography variant="desktopBody">{description}</Typography>
        </View>
        {actions}
      </View>
    );
  }

  if (layout === "stack") {
    return (
      <View
        style={[
          desktopCardStyle(theme),
          { borderStyle: "dashed", alignItems: "flex-start", gap: spacing.lg },
        ]}
      >
        {icon ? (
          <AppIcon name={icon} size={28} color={theme.colors.textSecondary} />
        ) : null}
        <View style={{ gap: spacing.xs, maxWidth: 640 }}>
          <Typography variant="desktopCardTitle">{title}</Typography>
          <Typography variant="desktopBody">{description}</Typography>
        </View>
        {actions}
      </View>
    );
  }

  return (
    <View
      style={[
        EMPTY_BORDER,
        { borderColor: theme.colors.border, alignItems: "center" },
        tall
          ? {
              minHeight: 240,
              backgroundColor: theme.colors.surfaceElevated,
              paddingVertical: spacing["4xl"],
              paddingHorizontal: spacing["3xl"],
              justifyContent: "center",
              gap: spacing.lg,
            }
          : {
              paddingVertical: spacing["3xl"],
              paddingHorizontal: spacing["2xl"],
              gap: spacing.sm,
            },
      ]}
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
      {actions ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: spacing.md,
            marginTop: tall ? 0 : spacing.md,
          }}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );
}

export type DesktopTagVariant = SemanticVariant;

/**
 * Selo de tipo/situação com texto de 14px (o `Badge` do celular usa 12px).
 * Mesmas cores do `Badge`; `strong` usa o peso do `Badge`.
 */
export function DesktopTag({
  label,
  variant = "neutral",
  strong = false,
  style,
}: Readonly<{
  label: string;
  variant?: DesktopTagVariant;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const { theme } = useTheme();
  const colors: Record<DesktopTagVariant, { bg: string; fg: string }> = {
    success: { bg: theme.colors.successBg, fg: theme.colors.success },
    warning: { bg: theme.colors.yellowBg, fg: theme.colors.yellow },
    danger: { bg: theme.colors.alertBg, fg: theme.colors.alert },
    info: { bg: theme.colors.blueBg, fg: theme.colors.blue },
    neutral: { bg: theme.colors.surface, fg: theme.colors.textSecondary },
    premium: { bg: theme.colors.premiumBg, fg: theme.colors.premium },
    lavender: { bg: theme.colors.lavenderBg, fg: theme.colors.lavender },
    primary: { bg: theme.colors.primaryBg, fg: theme.colors.primaryStrong },
  };
  const c = colors[variant];
  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.sm,
          backgroundColor: c.bg,
        },
        style,
      ]}
    >
      <Typography
        variant="desktopMeta"
        color={c.fg}
        numberOfLines={1}
        style={strong ? { fontFamily: fonts.bold } : undefined}
      >
        {label}
      </Typography>
    </View>
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
        autoCorrect={false}
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
  accessibilityLabel?: string;
}>;

/**
 * Controle segmentado (período, situação, tipo): opções de 44px com texto de
 * 16px e contagem ao lado, no lugar dos chips de 13px. Mesma altura da busca.
 */
export function DesktopSegmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
}: Readonly<{
  options: readonly DesktopSegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
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
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.key === value;
        const defaultLabel =
          option.count === undefined ? option.label : `${option.label}, ${option.count}`;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? defaultLabel}
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

/** Linha da barra de ferramentas: busca que cresce + filtros; quebra em 1024. */
export function DesktopToolbar({
  children,
  style,
}: Readonly<{ children: ReactNode; style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[
        { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md },
        style,
      ]}
    >
      {children}
    </View>
  );
}
