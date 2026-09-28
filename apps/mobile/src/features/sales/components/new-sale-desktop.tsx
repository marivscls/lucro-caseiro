/**
 * Peças da Nova venda no desktop (web >= 1024px). O estado, as regras e as
 * ações continuam em `app/tabs/new-sale.tsx`; aqui só a apresentação.
 */
import type { Product } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import { Image, Pressable, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { QuantityPulse } from "../../../shared/components/motion-feedback";
import { desktopCardStyle } from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName, productInitial } from "../../products/display";

function cardBorder(
  selected: boolean,
  hovered: boolean | undefined,
  accent: string,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (selected) return accent;
  return hovered ? theme.colors.textSecondary : theme.colors.border;
}

function Thumb({
  photoUrl,
  name,
  size,
}: Readonly<{ photoUrl: string | null; name: string; size: number }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.md,
        overflow: "hidden",
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <Typography variant="desktopCardTitle" color={theme.colors.textSecondary}>
          {productInitial(name)}
        </Typography>
      )}
    </View>
  );
}

/** Título + descrição da etapa atual (aparece uma única vez na tela). */
export function DesktopSaleStepHeading({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Typography variant="desktopSection" accessibilityRole="header">
        {title}
      </Typography>
      <Typography variant="desktopBody">{description}</Typography>
    </View>
  );
}

/** Linha "Seus produtos · 6" + link à direita. */
export function DesktopListHeading({
  title,
  count,
  linkLabel,
  onLink,
}: Readonly<{ title: string; count?: string; linkLabel: string; onLink: () => void }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <View
        style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}
      >
        <Typography variant="desktopCardTitle">{title}</Typography>
        {count ? <Typography variant="desktopMeta">{count}</Typography> : null}
      </View>
      <Pressable
        onPress={onLink}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Typography variant="desktopBodyStrong" color={theme.colors.primaryStrong}>
          {linkLabel}
        </Typography>
        <AppIcon name="chevron-forward" size={18} color={theme.colors.primaryStrong} />
      </Pressable>
    </View>
  );
}

/** Cartão de produto da grade: foto, nome, preço, estoque e quantidade. */
export function DesktopProductCard({
  product,
  quantity,
  quantityLabel,
  stockLabel,
  onAdd,
  onRemove,
}: Readonly<{
  product: Product;
  quantity: number;
  quantityLabel: string;
  stockLabel: string | null;
  onAdd: () => void;
  onRemove: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const name = displayProductName(product.name);
  const selected = quantity > 0;
  const lowStock =
    stockLabel !== null && (stockLabel.includes("baixo") || stockLabel === "Sem estoque");

  return (
    <Pressable
      onPress={onAdd}
      onLongPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Produto ${name}`}
      accessibilityHint="Toque para adicionar à venda"
      accessibilityState={{ selected }}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        desktopCardStyle(theme, { padding: spacing.lg, selected, accent: pal.wine }),
        {
          height: "100%",
          gap: spacing.sm,
          borderColor: cardBorder(selected, hovered, pal.wine, theme),
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <Thumb photoUrl={product.photoUrl} name={product.name} size={56} />
        <View style={{ flex: 1 }} />
        {selected ? <AppIcon name="checkmark-circle" size={22} color={pal.wine} /> : null}
      </View>
      <Typography
        variant="desktopBodyStrong"
        numberOfLines={2}
        style={{ minHeight: 48, marginTop: spacing.xs }}
      >
        {name}
      </Typography>
      <View style={{ gap: 2 }}>
        <Typography variant="desktopCardTitle" style={{ fontVariant: ["tabular-nums"] }}>
          {formatCurrency(product.salePrice)}
          {product.saleUnit === "kg" ? "/kg" : ""}
        </Typography>
        <Typography
          variant="desktopMeta"
          color={lowStock ? theme.colors.alert : undefined}
          numberOfLines={1}
        >
          {stockLabel && stockLabel !== "Sem controle de estoque" ? stockLabel : " "}
        </Typography>
      </View>
      <View style={{ flex: 1 }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: spacing.md,
        }}
      >
        {selected ? (
          <>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Diminuir quantidade de ${name}`}
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.surface,
              }}
            >
              <AppIcon name="remove" size={20} color={theme.colors.text} />
            </Pressable>
            <QuantityPulse
              value={quantity}
              style={{ flex: 1, minWidth: 0, alignItems: "center" }}
            >
              <Typography
                variant="desktopCardTitle"
                color={pal.wine}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {quantityLabel}
              </Typography>
            </QuantityPulse>
          </>
        ) : (
          <Typography variant="desktopBody" style={{ flex: 1 }}>
            Adicionar
          </Typography>
        )}
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Adicionar ${name}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected ? pal.wine : theme.colors.surface,
          }}
        >
          <AppIcon name="add" size={20} color={selected ? pal.onWine : pal.wine} />
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Linha selecionável grande (Venda avulsa, cliente, forma de pagamento). */
export function DesktopChoiceCard({
  title,
  description,
  leading,
  trailing,
  selected = false,
  onPress,
  accessibilityRole = "button",
  accessibilityLabel,
}: Readonly<{
  title: string;
  description?: string | null;
  leading: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onPress: () => void;
  accessibilityRole?: "button" | "radio";
  accessibilityLabel?: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={
        accessibilityRole === "radio" ? { checked: selected } : { selected }
      }
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        desktopCardStyle(theme, { padding: spacing.lg, selected, accent: pal.wine }),
        {
          minHeight: 76,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
          borderColor: cardBorder(selected, hovered, pal.wine, theme),
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="desktopBodyStrong" numberOfLines={1}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="desktopMeta" numberOfLines={2}>
            {description}
          </Typography>
        ) : null}
      </View>
      {trailing ?? (
        <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </Pressable>
  );
}

/** Círculo de 44px para ícone ou inicial à esquerda de um `DesktopChoiceCard`. */
export function DesktopChoiceIcon({
  icon,
  initial,
  active = false,
}: Readonly<{ icon?: AppIconName; initial?: string; active?: boolean }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radii.full,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size={22}
          color={active ? pal.wine : theme.colors.textSecondary}
        />
      ) : (
        <Typography variant="desktopBodyStrong" color={theme.colors.textSecondary}>
          {initial}
        </Typography>
      )}
    </View>
  );
}

export type DesktopSummaryItem = Readonly<{
  key: string;
  name: string;
  detail: string;
  subtotal: number;
}>;

const SUMMARY_VISIBLE_ITEMS = 6;

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.md }}>
      <Typography variant="desktopBody" style={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="desktopBodyStrong"
        numberOfLines={2}
        style={{ flex: 1, textAlign: "right" }}
      >
        {value}
      </Typography>
    </View>
  );
}

/**
 * Resumo lateral fixo: itens escolhidos, cliente, pagamento, desconto e total.
 * As ações da etapa entram como `children`, logo abaixo do cartão.
 */
export function DesktopSaleSummary({
  items,
  itemCountLabel,
  clientName,
  paymentLabel,
  discount,
  total,
  children,
}: Readonly<{
  items: readonly DesktopSummaryItem[];
  itemCountLabel: string;
  clientName: string;
  paymentLabel: string;
  discount: number;
  total: number;
  children: ReactNode;
}>) {
  const { theme } = useTheme();
  const visible = items.slice(0, SUMMARY_VISIBLE_ITEMS);
  const hidden = items.length - visible.length;

  return (
    <>
      <View
        accessibilityLabel="Resumo da venda"
        style={[desktopCardStyle(theme, { padding: 0 }), { overflow: "hidden" }]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: spacing.sm,
            paddingHorizontal: spacing["2xl"],
            paddingTop: spacing.xl,
            paddingBottom: spacing.md,
          }}
        >
          <Typography variant="desktopCardTitle" style={{ flex: 1 }}>
            Resumo da venda
          </Typography>
          <Typography variant="desktopMeta">{itemCountLabel}</Typography>
        </View>

        <View style={{ paddingHorizontal: spacing["2xl"], gap: spacing.md }}>
          {items.length === 0 ? (
            <Typography variant="desktopBody" style={{ paddingBottom: spacing.xs }}>
              Os produtos que você escolher aparecem aqui.
            </Typography>
          ) : null}
          {visible.map((item) => (
            <View
              key={item.key}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="desktopBodyStrong" numberOfLines={2}>
                  {item.name}
                </Typography>
                <Typography variant="desktopMeta" numberOfLines={1}>
                  {item.detail}
                </Typography>
              </View>
              <Typography
                variant="desktopBodyStrong"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCurrency(item.subtotal)}
              </Typography>
            </View>
          ))}
          {hidden > 0 ? (
            <Typography variant="desktopMeta">
              {hidden === 1 ? "+ 1 item" : `+ ${hidden} itens`}
            </Typography>
          ) : null}
        </View>

        <View
          style={{
            marginTop: spacing.lg,
            marginHorizontal: spacing["2xl"],
            paddingTop: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            gap: spacing.sm,
          }}
        >
          <SummaryRow label="Cliente" value={clientName} />
          <SummaryRow label="Pagamento" value={paymentLabel} />
          {discount > 0 ? (
            <SummaryRow label="Desconto" value={`− ${formatCurrency(discount)}`} />
          ) : null}
        </View>

        <View
          style={{
            marginTop: spacing.lg,
            paddingHorizontal: spacing["2xl"],
            paddingVertical: spacing.xl,
            backgroundColor: theme.colors.surface,
            gap: 2,
          }}
        >
          <Typography variant="desktopMetricLabel">Total</Typography>
          <Typography
            variant="desktopTotal"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCurrency(total)}
          </Typography>
        </View>
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </>
  );
}

/** Item da revisão: miniatura, nome, quantidade × preço e subtotal à direita. */
export function DesktopReviewItem({
  photoUrl,
  name,
  variation,
  detail,
  subtotal,
  first,
}: Readonly<{
  photoUrl: string | null;
  name: string;
  variation?: string;
  detail: string;
  subtotal: number;
  first: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.colors.border,
      }}
    >
      <Thumb photoUrl={photoUrl} name={name} size={48} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="desktopBodyStrong" numberOfLines={2}>
          {displayProductName(name)}
        </Typography>
        {variation ? <Typography variant="desktopMeta">{variation}</Typography> : null}
        <Typography variant="desktopMeta">{detail}</Typography>
      </View>
      <Typography variant="desktopBodyStrong" style={{ fontVariant: ["tabular-nums"] }}>
        {formatCurrency(subtotal)}
      </Typography>
    </View>
  );
}
