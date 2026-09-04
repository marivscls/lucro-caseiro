/* eslint-disable sonarjs/no-nested-conditional */
import type { Product, Service, StorefrontCustomization } from "@lucro-caseiro/contracts";
import { Card, Typography, fonts } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Image, Modal, Platform, Pressable, ScrollView, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  coverFocalNativeTranslate,
  coverFocalObjectPosition,
  displayCatalogItemName,
  resolveCatalogItemAction,
  type EditorStatus,
} from "../catalog-customizer";

const INK = "#24181E";
const WHITE = "#FFFFFF";
const WARM_GRAY = "#6D6266";
const SOFT_ROSE = "#F5E5E8";

type PreviewData = Readonly<{
  customization: StorefrontCustomization;
  products: Product[];
  services: Service[];
  coverUrl?: string | null;
}>;

function visibleItems(products: Product[], services: Service[]) {
  return {
    products: products.filter((item) => item.isActive && item.publicEnabled),
    services: services.filter((item) => item.active && item.publicEnabled),
  };
}

function PreviewStatus({
  status,
  final = false,
}: Readonly<{ status: EditorStatus; final?: boolean }>) {
  const colors = useBrandScreenPalette();
  let label = "Atualizado";
  let background: string = colors.lime;
  let foreground: string = colors.onLime;
  let icon: AppIconName = "checkmark";
  if (status === "loading") {
    label = "Carregando...";
    background = colors.surface;
    foreground = colors.warmGray;
    icon = "time-outline";
  }
  if (status === "dirty") {
    label = "Alterações não salvas";
    background = colors.softRose;
    foreground = colors.wine;
    icon = "pencil-outline";
  }
  if (status === "saving") label = "Salvando...";
  if (status === "publishing") label = "Publicando...";
  if (status === "error") {
    label = "Erro ao salvar";
    background = colors.softRose;
    foreground = colors.rose;
    icon = "alert-circle-outline";
  }
  if (final && status !== "dirty" && status !== "error" && status !== "loading") {
    label = "Pronta";
  }
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        backgroundColor: background,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <AppIcon name={icon} size={12} color={foreground} importantForAccessibility="no" />
      <Typography style={{ color: foreground, fontFamily: fonts.semiBold, fontSize: 11 }}>
        {label}
      </Typography>
    </View>
  );
}

export function StorefrontQuickInfo({
  customization,
}: Readonly<{ customization: StorefrontCustomization }>) {
  const iconNames: Record<string, AppIconName> = {
    sparkles: "sparkles-outline",
    delivery: "cube-outline",
    whatsapp: "logo-whatsapp",
    calendar: "calendar-outline",
    store: "storefront-outline",
  };
  const items = customization.hero.quickInfo
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order);
  if (items.length === 0) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        borderTopWidth: 1,
        borderTopColor: "rgba(74,35,50,0.10)",
        paddingTop: 10,
        gap: 10,
      }}
    >
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            flex: 1,
            minWidth: 96,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
          }}
        >
          <AppIcon
            name={iconNames[item.icon] ?? "sparkles-outline"}
            size={16}
            color={customization.identity.primaryColor}
            importantForAccessibility="no"
          />
          <Typography style={{ color: INK, fontSize: 11, flex: 1, lineHeight: 15 }}>
            {item.label}
          </Typography>
        </View>
      ))}
    </View>
  );
}

type CoverFocal = NonNullable<StorefrontCustomization["hero"]["coverFocal"]>;

function CoverFocalImage({
  uri,
  accessibilityLabel,
  focal,
  frame,
  fill = false,
}: Readonly<{
  uri: string;
  accessibilityLabel: string;
  focal: CoverFocal;
  frame: Readonly<{ width: number; height: number }>;
  fill?: boolean;
}>) {
  const position = coverFocalObjectPosition(focal);
  const pan = coverFocalNativeTranslate(focal, frame);
  const box = fill
    ? { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 }
    : { width: "100%" as const, height: "100%" as const };
  if (Platform.OS === "web") {
    return React.createElement("img", {
      src: uri,
      alt: accessibilityLabel,
      style: {
        position: fill ? "absolute" : "relative",
        top: fill ? 0 : undefined,
        right: fill ? 0 : undefined,
        bottom: fill ? 0 : undefined,
        left: fill ? 0 : undefined,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: position,
        transform: `scale(${focal.scale})`,
        transformOrigin: position,
        display: "block",
      },
    });
  }
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={accessibilityLabel}
      resizeMode="cover"
      style={{
        ...box,
        transform: [
          { translateX: pan.translateX },
          { translateY: pan.translateY },
          { scale: focal.scale },
        ],
      }}
    />
  );
}

export function CoverAdjuster({
  coverUrl,
  focal,
  onChange,
}: Readonly<{
  coverUrl: string;
  focal: CoverFocal;
  onChange: (focal: CoverFocal) => void;
}>) {
  const colors = useBrandScreenPalette();
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const centered = { x: 0.5, y: 0.5, scale: 1 };
  const apply = (next: CoverFocal) =>
    onChange({
      x: Math.min(1, Math.max(0, next.x)),
      y: Math.min(1, Math.max(0, next.y)),
      scale: Math.min(2.5, Math.max(1, next.scale)),
    });
  const controls = [
    {
      key: "left",
      icon: "chevron-back" as const,
      label: "Mover capa para a esquerda",
      next: { x: focal.x - 0.08, y: focal.y, scale: focal.scale },
    },
    {
      key: "right",
      icon: "chevron-forward" as const,
      label: "Mover capa para a direita",
      next: { x: focal.x + 0.08, y: focal.y, scale: focal.scale },
    },
    {
      key: "up",
      icon: "arrow-up" as const,
      label: "Mover capa para cima",
      next: { x: focal.x, y: focal.y - 0.08, scale: focal.scale },
    },
    {
      key: "down",
      icon: "arrow-down" as const,
      label: "Mover capa para baixo",
      next: { x: focal.x, y: focal.y + 0.08, scale: focal.scale },
    },
    {
      key: "zoom-out",
      icon: "remove" as const,
      label: "Diminuir zoom da capa",
      next: { x: focal.x, y: focal.y, scale: focal.scale - 0.1 },
    },
    {
      key: "zoom-in",
      icon: "add-outline" as const,
      label: "Aumentar zoom da capa",
      next: { x: focal.x, y: focal.y, scale: focal.scale + 0.1 },
    },
  ];
  return (
    <View style={{ gap: 10 }}>
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setFrame((current) =>
            current.width === width && current.height === height
              ? current
              : { width, height },
          );
        }}
        style={{
          height: 140,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.surface,
        }}
      >
        <CoverFocalImage
          uri={coverUrl}
          accessibilityLabel="Ajuste da capa"
          focal={focal}
          frame={frame}
          fill
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {controls.map((control) => (
          <Pressable
            key={control.key}
            accessibilityRole="button"
            accessibilityLabel={control.label}
            onPress={() => apply(control.next)}
            style={{
              minWidth: 44,
              minHeight: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.white,
            }}
          >
            <AppIcon name={control.icon} size={18} color={colors.ink} />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Centralizar a capa"
          onPress={() => apply(centered)}
          style={{
            minHeight: 44,
            paddingHorizontal: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.white,
          }}
        >
          <Typography
            style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
          >
            Centralizar
          </Typography>
        </Pressable>
      </View>
      <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
        Use as setas para descer, subir ou centralizar o recorte. Se a foto não se mexer,
        aumente um pouco o zoom.
      </Typography>
    </View>
  );
}

export function StorefrontHero({
  customization,
  coverUrl = null,
  productCount,
  serviceCount,
}: Readonly<{
  customization: StorefrontCustomization;
  coverUrl?: string | null;
  productCount?: number;
  serviceCount?: number;
}>) {
  const { identity, hero } = customization;
  const compact = hero.style === "compact";
  const coverSource = coverUrl;
  const hasCover = Boolean(coverSource);
  const focal = hero.coverFocal ?? { x: 0.5, y: 0.5, scale: 1 };
  const [coverFrame, setCoverFrame] = useState({ width: 0, height: 0 });
  const coverHeight = compact ? 168 : 196;
  const productsLabel =
    productCount == null
      ? null
      : `${productCount} ${productCount === 1 ? "produto" : "produtos"}`;
  const servicesLabel =
    serviceCount == null
      ? null
      : `${serviceCount} ${serviceCount === 1 ? "serviço" : "serviços"}`;
  const counts = [productsLabel, servicesLabel].filter(Boolean).join(" • ");

  return (
    <View>
      {hero.showPromotionalBar && hero.promotionalText ? (
        <View
          style={{
            minHeight: 34,
            backgroundColor: identity.primaryColor,
            paddingHorizontal: 16,
            paddingVertical: 7,
            alignItems: "center",
            justifyContent: "center",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <Typography
            style={{
              color: WHITE,
              textAlign: "center",
              fontFamily: fonts.bold,
              fontSize: 12,
            }}
          >
            {hero.promotionalText}
          </Typography>
        </View>
      ) : null}
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCoverFrame((current) =>
            current.width === width && current.height === height
              ? current
              : { width, height },
          );
        }}
        style={{
          height: coverHeight,
          overflow: "hidden",
          backgroundColor: identity.primaryColor,
          borderTopLeftRadius: hero.showPromotionalBar && hero.promotionalText ? 0 : 20,
          borderTopRightRadius: hero.showPromotionalBar && hero.promotionalText ? 0 : 20,
        }}
      >
        {hasCover ? (
          <CoverFocalImage
            uri={coverSource!}
            accessibilityLabel="Capa da vitrine"
            focal={focal}
            frame={coverFrame}
            fill
          />
        ) : null}
      </View>
      <View
        style={{
          marginTop: -48,
          marginHorizontal: 16,
          paddingHorizontal: 18,
          paddingBottom: 18,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "rgba(74,35,50,0.08)",
          backgroundColor: WHITE,
          alignItems: "center",
          zIndex: 2,
        }}
      >
        {identity.logoUrl ? (
          <Image
            source={{ uri: identity.logoUrl }}
            accessibilityLabel={`Logo de ${identity.displayName}`}
            style={{
              width: 72,
              height: 72,
              marginTop: -36,
              borderRadius: 36,
              borderWidth: 3,
              borderColor: WHITE,
              backgroundColor: WHITE,
            }}
          />
        ) : (
          <View
            style={{
              width: 72,
              height: 72,
              marginTop: -36,
              borderRadius: 36,
              borderWidth: 3,
              borderColor: WHITE,
              backgroundColor: WHITE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name="storefront-outline"
              size={26}
              color={identity.actionColor}
              importantForAccessibility="no"
            />
          </View>
        )}
        <Typography
          style={{
            color: identity.primaryColor,
            fontFamily: fonts.extraBold,
            fontSize: compact ? 20 : 22,
            lineHeight: compact ? 24 : 28,
            letterSpacing: -0.4,
            textAlign: "center",
            marginTop: 8,
          }}
          numberOfLines={2}
        >
          {identity.displayName}
        </Typography>
        {hero.introduction ? (
          <Typography
            style={{
              color: identity.textColor,
              fontSize: 13,
              lineHeight: 18,
              textAlign: "center",
              marginTop: 6,
            }}
            numberOfLines={3}
          >
            {hero.introduction}
          </Typography>
        ) : null}
        {hero.shortSignature ? (
          <Typography
            style={{
              color: identity.textColor,
              fontFamily: fonts.semiBold,
              fontSize: 12,
              marginTop: 6,
            }}
          >
            {hero.shortSignature}
          </Typography>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          {counts ? (
            <Typography
              style={{ color: WARM_GRAY, fontSize: 12, fontFamily: fonts.bold }}
            >
              {counts}
            </Typography>
          ) : null}
          <View
            style={{
              backgroundColor: "#DCE86A",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Typography style={{ color: INK, fontFamily: fonts.bold, fontSize: 11 }}>
              Aceitando encomendas
            </Typography>
          </View>
        </View>
        {hero.action.type !== "none" && hero.action.label ? (
          <View
            style={{
              width: "100%",
              minHeight: 48,
              marginTop: 14,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: identity.actionColor,
              backgroundColor: WHITE,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <AppIcon
              name="logo-whatsapp"
              size={18}
              color={identity.actionColor}
              importantForAccessibility="no"
            />
            <Typography
              numberOfLines={1}
              style={{
                color: identity.actionColor,
                fontFamily: fonts.bold,
                fontSize: 15,
              }}
            >
              {hero.action.label}
            </Typography>
          </View>
        ) : null}
        <View style={{ width: "100%", marginTop: 8 }}>
          <StorefrontQuickInfo customization={customization} />
        </View>
      </View>
    </View>
  );
}

export function StorefrontCategoryNavigation({
  categories,
  customization,
}: Readonly<{ categories: string[]; customization: StorefrontCustomization }>) {
  if (!customization.organization.discovery.showCategories || categories.length === 0)
    return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      <View
        style={{
          borderRadius: 999,
          backgroundColor: customization.identity.primaryColor,
          paddingHorizontal: 13,
          paddingVertical: 7,
        }}
      >
        <Typography
          style={{
            color: WHITE,
            fontFamily: fonts.semiBold,
            fontSize: 12,
          }}
        >
          Todos
        </Typography>
      </View>
      {categories.slice(0, 8).map((category, index) => (
        <View
          key={`category-${index}-${category}`}
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#F5E5E8",
            backgroundColor: WHITE,
            paddingHorizontal: 13,
            paddingVertical: 7,
          }}
        >
          <Typography
            style={{
              color: customization.identity.primaryColor,
              fontSize: 12,
              fontFamily: fonts.bold,
            }}
          >
            {category}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
}

function actionLabel(action: ReturnType<typeof resolveCatalogItemAction>): string {
  if (action.label) return action.label;
  const labels: Record<string, string> = {
    order: "Pedir",
    preorder: "Encomendar",
    quote: "Orçamento",
    schedule: "Agendar",
    details: "Ver detalhes",
    contact: "Contato",
    externalLink: "Abrir link",
  };
  return labels[action.type] ?? "";
}

function serviceLocationLabel(mode: Service["locationMode"]): string {
  if (mode === "online") return "Online";
  if (mode === "client") return "No endereço do cliente";
  if (mode === "flexible") return "Local a combinar";
  return "Presencial";
}

function formatStorefrontPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
}

function productPriceCaption(product: Product): string {
  const prefix = (product.variations?.length ?? 0) > 1 ? "a partir de " : "";
  return `${prefix}${formatStorefrontPrice(product.salePrice)}`;
}

function servicePriceCaption(
  service: Service,
  customization: StorefrontCustomization,
): string {
  const prices = [
    service.defaultPrice,
    ...service.variations.map((item) => item.price),
    ...service.packages.map((item) => item.price),
  ].filter((value): value is number => value != null);
  if (prices.length === 0) {
    if (customization.organization.cards.missingPriceBehavior === "hidden") return " ";
    if (customization.organization.cards.missingPriceBehavior === "custom") {
      return customization.organization.cards.missingPriceText;
    }
    return "Consultar";
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const prefix = min !== max ? "a partir de " : "";
  return `${prefix}${formatStorefrontPrice(min)}`;
}

function PlaceholderMark({
  kind,
  color,
}: Readonly<{ kind: "product" | "service"; color: string }>) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: WHITE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppIcon
        name={kind === "product" ? "bag-handle-outline" : "calendar-outline"}
        size={22}
        color={color}
        importantForAccessibility="no"
      />
    </View>
  );
}

function MetaBit({
  iconName,
  label,
  color,
}: Readonly<{ iconName: AppIconName; label: string; color: string }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, minWidth: 0 }}>
      <AppIcon name={iconName} size={13} color={color} importantForAccessibility="no" />
      <Typography
        numberOfLines={1}
        style={{ color: WARM_GRAY, fontSize: 11, flexShrink: 1 }}
      >
        {label}
      </Typography>
    </View>
  );
}

function PriceCaption({
  caption,
  color,
  size,
}: Readonly<{ caption: string; color: string; size: number }>) {
  const prefix = "a partir de ";
  const from = caption.toLocaleLowerCase("pt-BR").startsWith(prefix);
  const amount = from ? caption.slice(prefix.length) : caption;
  return (
    <View style={{ gap: 1 }}>
      {from ? (
        <Typography
          style={{
            color,
            fontFamily: fonts.semiBold,
            fontSize: Math.max(10, size - 2),
          }}
        >
          a partir de
        </Typography>
      ) : null}
      <Typography
        numberOfLines={1}
        style={{ color, fontFamily: fonts.bold, fontSize: size }}
      >
        {amount}
      </Typography>
    </View>
  );
}

function EmptyCatalogSlot() {
  return (
    <View
      style={{
        width: "100%",
        minHeight: 72,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#F5F3F1",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <AppIcon
        name="storefront-outline"
        size={20}
        color={WARM_GRAY}
        importantForAccessibility="no"
      />
      <Typography style={{ color: WARM_GRAY, fontSize: 12 }}>
        Seu conteúdo aparecerá aqui.
      </Typography>
    </View>
  );
}

function itemCardDensity(fill: boolean, compact: boolean) {
  if (fill) return "tile" as const;
  if (compact) return "highlight" as const;
  return "full" as const;
}

export function StorefrontItemCard({
  item,
  kind,
  customization,
  fill = false,
  compact = false,
  cardWidth,
}: Readonly<{
  item: Product | Service;
  kind: "product" | "service";
  customization: StorefrontCustomization;
  fill?: boolean;
  compact?: boolean;
  cardWidth?: number;
}>) {
  const product = kind === "product" ? (item as Product) : null;
  const service = kind === "service" ? (item as Service) : null;
  const action = resolveCatalogItemAction(`${kind}:${item.id}`, kind, customization);
  const name = displayCatalogItemName(item.name);
  const photoUrl = product?.photoUrl ?? null;
  const available =
    product == null || product.stockQuantity == null || product.stockQuantity > 0;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isDetailsAction = action.type === "details";
  const detailsCopy =
    item.description?.trim() || "Este item ainda não tem uma descrição.";
  const priceCaption = product
    ? productPriceCaption(product)
    : service
      ? servicePriceCaption(service, customization)
      : "";
  const detailsMeta = service
    ? `${service.durationMinutes} min · ${serviceLocationLabel(service.locationMode)}`
    : customization.organization.cards.showAvailability
      ? available
        ? "Disponível"
        : "Indisponível"
      : "";
  const density = itemCardDensity(fill, compact);
  const ctaLabel = actionLabel(action);
  const showDescription =
    density === "full" &&
    !isDetailsAction &&
    customization.organization.cards.showDetails &&
    Boolean(item.description);
  const showCta =
    density !== "highlight" &&
    customization.organization.actions.mode !== "hidden" &&
    action.type !== "none";
  const showAvailability =
    customization.organization.cards.showAvailability && Boolean(product);
  const showServiceMeta = density !== "highlight" && Boolean(service);
  const showFooter =
    density !== "highlight" && (showServiceMeta || showAvailability || showCta);
  const ctaStyle = {
    alignSelf: "flex-start" as const,
    minHeight: 32,
    borderRadius: 999,
    backgroundColor: customization.identity.actionColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
  const ctaLabelStyle = {
    color: WHITE,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    textAlign: "center" as const,
  };
  const imageStyle = { width: "100%" as const, aspectRatio: 1 };
  return (
    <View
      style={{
        width: fill ? "100%" : (cardWidth ?? 136),
        flexGrow: 0,
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(74,35,50,0.10)",
        backgroundColor: WHITE,
      }}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          accessibilityLabel={name}
          style={imageStyle}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            ...imageStyle,
            backgroundColor: SOFT_ROSE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlaceholderMark kind={kind} color={customization.identity.actionColor} />
        </View>
      )}
      <View
        style={{
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: 10,
          gap: density === "highlight" ? 3 : 4,
          minWidth: 0,
        }}
      >
        <Typography
          numberOfLines={1}
          style={{
            color: customization.identity.actionColor,
            fontFamily: fonts.bold,
            fontSize: 10,
            letterSpacing: 0.4,
          }}
        >
          {kind === "product" ? product?.category || "Produto" : "Serviço"}
        </Typography>
        <Typography
          style={{
            color: INK,
            fontFamily: fonts.bold,
            fontSize: density === "highlight" ? 12 : 13,
            lineHeight: density === "highlight" ? 16 : 17,
          }}
          numberOfLines={2}
        >
          {name}
        </Typography>
        {showDescription ? (
          <Typography
            style={{ color: WARM_GRAY, fontSize: 11, lineHeight: 15 }}
            numberOfLines={2}
          >
            {item.description}
          </Typography>
        ) : null}
        {customization.organization.cards.showPrice ? (
          <PriceCaption
            caption={priceCaption}
            color={customization.identity.primaryColor}
            size={density === "highlight" ? 12 : 13}
          />
        ) : null}
        {density === "highlight" && showAvailability ? (
          <MetaBit
            iconName={available ? "checkmark-circle-outline" : "close-circle-outline"}
            label={available ? "Disponível" : "Indisponível"}
            color={WARM_GRAY}
          />
        ) : null}
        {showFooter ? (
          <View
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: "rgba(74,35,50,0.10)",
              gap: 8,
            }}
          >
            {showServiceMeta && service ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <MetaBit
                  iconName="time-outline"
                  label={`${service.durationMinutes} min`}
                  color={WARM_GRAY}
                />
                <MetaBit
                  iconName="location-outline"
                  label={serviceLocationLabel(service.locationMode)}
                  color={WARM_GRAY}
                />
              </View>
            ) : null}
            {showAvailability ? (
              <MetaBit
                iconName={available ? "checkmark-circle-outline" : "close-circle-outline"}
                label={available ? "Disponível" : "Indisponível"}
                color={WARM_GRAY}
              />
            ) : null}
            {showCta ? (
              isDetailsAction ? (
                <Pressable
                  onPress={() => setDetailsOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={ctaLabel}
                  style={ctaStyle}
                >
                  <Typography style={ctaLabelStyle}>{ctaLabel}</Typography>
                </Pressable>
              ) : (
                <View style={ctaStyle}>
                  <Typography style={ctaLabelStyle}>{ctaLabel}</Typography>
                </View>
              )
            ) : null}
          </View>
        ) : null}
      </View>
      {isDetailsAction && detailsOpen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setDetailsOpen(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 16,
              backgroundColor: "rgba(36,24,30,0.45)",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={() => setDetailsOpen(false)}
              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            />
            <View
              style={{
                maxHeight: "90%",
                borderRadius: 16,
                backgroundColor: WHITE,
                padding: 22,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    style={{
                      color: WARM_GRAY,
                      fontSize: 12,
                      fontFamily: fonts.semiBold,
                    }}
                  >
                    Detalhes
                  </Typography>
                  <Typography
                    style={{
                      color: INK,
                      fontFamily: fonts.bold,
                      fontSize: 18,
                      lineHeight: 24,
                    }}
                  >
                    {name}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => setDetailsOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    borderWidth: 1,
                    borderColor: "rgba(74,35,50,0.16)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name="close-outline" size={18} color={INK} />
                </Pressable>
              </View>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  accessibilityLabel={name}
                  style={{ width: "100%", aspectRatio: 1, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : null}
              {customization.organization.cards.showPrice && priceCaption.trim() ? (
                <Typography
                  style={{
                    color: customization.identity.primaryColor,
                    fontFamily: fonts.bold,
                    fontSize: 16,
                  }}
                >
                  {priceCaption}
                </Typography>
              ) : null}
              {detailsMeta ? (
                <Typography style={{ color: WARM_GRAY, fontSize: 13 }}>
                  {detailsMeta}
                </Typography>
              ) : null}
              <Typography style={{ color: WARM_GRAY, fontSize: 14, lineHeight: 20 }}>
                {detailsCopy}
              </Typography>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

export function StorefrontContactAction({
  customization,
}: Readonly<{ customization: StorefrontCustomization }>) {
  if (!customization.organization.contact.floatingEnabled) return null;
  return (
    <View
      style={{
        minHeight: 48,
        borderRadius: 999,
        backgroundColor: customization.identity.actionColor,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
      }}
    >
      <AppIcon
        name={
          customization.organization.contact.channel === "whatsapp"
            ? "logo-whatsapp"
            : "chatbubble-ellipses-outline"
        }
        size={20}
        color={WHITE}
        importantForAccessibility="no"
      />
      <Typography
        style={{
          color: WHITE,
          fontFamily: fonts.bold,
          fontSize: 16,
        }}
      >
        {customization.organization.contact.channel === "whatsapp"
          ? "Contato"
          : customization.organization.contact.defaultActionLabel}
      </Typography>
    </View>
  );
}

function PreviewShell({
  title,
  status,
  final,
  children,
}: React.PropsWithChildren<
  Readonly<{ title: string; status: EditorStatus; final?: boolean }>
>) {
  const colors = useBrandScreenPalette();
  return (
    <Card
      padding="md"
      style={{
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Typography
          style={{
            color: colors.wine,
            fontFamily: fonts.extraBold,
            fontSize: 11,
            letterSpacing: 0.8,
          }}
        >
          {title}
        </Typography>
        <PreviewStatus status={status} final={final} />
      </View>
      {children}
    </Card>
  );
}

export function StorefrontIdentityPreview({
  customization,
  products,
  services,
  status,
  coverUrl,
}: PreviewData & Readonly<{ status: EditorStatus }>) {
  const { products: visibleProducts, services: visibleServices } = visibleItems(
    products,
    services,
  );
  const productCount = visibleProducts.length;
  const serviceCount = visibleServices.length;
  return (
    <PreviewShell title="PRÉVIA DA VITRINE" status={status}>
      <StorefrontHero
        customization={customization}
        coverUrl={coverUrl}
        productCount={productCount}
        serviceCount={serviceCount}
      />
    </PreviewShell>
  );
}

export function StorefrontHeroPreview({
  customization,
  status,
  coverUrl,
}: Readonly<{
  customization: StorefrontCustomization;
  status: EditorStatus;
  coverUrl?: string | null;
}>) {
  return (
    <PreviewShell title="PRÉVIA DO TOPO" status={status}>
      <StorefrontHero customization={customization} coverUrl={coverUrl} />
    </PreviewShell>
  );
}

function HighlightsRail({
  items,
  customization,
}: Readonly<{
  items: Array<{ item: Product | Service; kind: "product" | "service" }>;
  customization: StorefrontCustomization;
}>) {
  const [railWidth, setRailWidth] = useState(0);
  const gap = 8;
  const visibleSlots = Math.min(3, Math.max(1, items.length));
  const cardWidth =
    railWidth > 0
      ? Math.floor((railWidth - gap * (visibleSlots - 1)) / visibleSlots)
      : 104;
  return (
    <View
      style={{ width: "100%" }}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next > 0 && next !== railWidth) setRailWidth(next);
      }}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + gap}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ gap }}
      >
        {items.slice(0, 6).map(({ item, kind }) => (
          <StorefrontItemCard
            key={`highlight-${kind}:${item.id}`}
            item={item}
            kind={kind}
            customization={customization}
            compact
            cardWidth={cardWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function StorefrontContentPreview({
  customization,
  products,
  services,
  status,
  embedded = false,
  listing = false,
}: PreviewData &
  Readonly<{ status: EditorStatus; embedded?: boolean; listing?: boolean }>) {
  const { products: visibleProducts, services: visibleServices } = visibleItems(
    products,
    services,
  );
  const orderedCategories = customization.organization.discovery.categoryOrder;
  const rawCategories = [
    ...new Set(visibleProducts.map((item) => item.category).filter(Boolean)),
  ];
  const categories = (
    orderedCategories.length
      ? [
          ...orderedCategories.filter((item) => rawCategories.includes(item)),
          ...rawCategories.filter((item) => !orderedCategories.includes(item)),
        ]
      : rawCategories
  ).filter(
    (category) =>
      customization.organization.discovery.visibleCategoryIds.length === 0 ||
      customization.organization.discovery.visibleCategoryIds.includes(category),
  );
  const previewProducts = customization.organization.content.showProducts
    ? listing
      ? visibleProducts
      : visibleProducts.slice(0, 2)
    : [];
  const previewServices = customization.organization.content.showServices
    ? listing
      ? visibleServices
      : visibleServices.slice(0, 1)
    : [];
  const [listingKind, setListingKind] = useState<"products" | "services">(() =>
    previewProducts.length > 0 ? "products" : "services",
  );
  const kindItems =
    listingKind === "services"
      ? previewServices.map((item) => ({ item, kind: "service" as const }))
      : previewProducts.map((item) => ({ item, kind: "product" as const }));
  const showTypeTabs =
    customization.identity.offeringMode === "both" &&
    customization.organization.content.showProducts &&
    customization.organization.content.showServices &&
    visibleProducts.length > 0 &&
    visibleServices.length > 0;
  const body = (
    <>
      <View
        style={{
          minHeight: 48,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#F5E5E8",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          backgroundColor: WHITE,
        }}
      >
        <AppIcon
          name="search-outline"
          size={16}
          color={WARM_GRAY}
          importantForAccessibility="no"
        />
        <Typography style={{ color: WARM_GRAY, fontSize: 14 }}>
          Buscar no catálogo
        </Typography>
      </View>
      {listingKind === "products" ? (
        <StorefrontCategoryNavigation
          categories={categories}
          customization={customization}
        />
      ) : null}
      {showTypeTabs ? (
        <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              {
                kind: "products" as const,
                label: `Produtos (${visibleProducts.length})`,
                icon: "bag-handle-outline" as const,
              },
              {
                kind: "services" as const,
                label: `Serviços (${visibleServices.length})`,
                icon: "calendar-outline" as const,
              },
            ] as const
          ).map((tab) => {
            const active = listingKind === tab.kind;
            const color = active ? WHITE : customization.identity.primaryColor;
            return (
              <Pressable
                key={tab.kind}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                onPress={() => setListingKind(tab.kind)}
                style={{
                  flex: 1,
                  minHeight: 32,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active
                    ? customization.identity.primaryColor
                    : "rgba(74,35,50,0.18)",
                  backgroundColor: active ? customization.identity.primaryColor : WHITE,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  paddingHorizontal: 10,
                }}
              >
                <AppIcon
                  name={tab.icon}
                  size={13}
                  color={color}
                  importantForAccessibility="no"
                />
                <Typography
                  style={{
                    color,
                    fontFamily: fonts.semiBold,
                    fontSize: 11,
                  }}
                >
                  {tab.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {kindItems.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Typography
            style={{
              color: customization.identity.primaryColor,
              fontFamily: fonts.extraBold,
              fontSize: 16,
            }}
          >
            Destaques
          </Typography>
          <HighlightsRail items={kindItems} customization={customization} />
        </View>
      ) : null}
      {listing ? (
        <View style={{ gap: 10 }}>
          <Typography
            style={{
              color: customization.identity.primaryColor,
              fontFamily: fonts.extraBold,
              fontSize: 16,
            }}
          >
            Escolha o que deseja
          </Typography>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 12,
            }}
          >
            {kindItems.map(({ item, kind }) => (
              <View key={`${kind}:${item.id}`} style={{ width: "48%" }}>
                <StorefrontItemCard
                  item={item}
                  kind={kind}
                  customization={customization}
                  fill
                />
              </View>
            ))}
            {kindItems.length === 0 ? <EmptyCatalogSlot /> : null}
          </View>
        </View>
      ) : kindItems.length === 0 ? (
        <EmptyCatalogSlot />
      ) : null}
    </>
  );
  if (embedded) return <View style={{ gap: 10 }}>{body}</View>;
  return (
    <PreviewShell title="PRÉVIA DO CONTEÚDO" status={status}>
      {body}
    </PreviewShell>
  );
}

export function StorefrontCardsPreview({
  customization,
  products,
  services,
  status,
}: PreviewData & Readonly<{ status: EditorStatus }>) {
  const colors = useBrandScreenPalette();
  const { products: visibleProducts, services: visibleServices } = visibleItems(
    products,
    services,
  );
  const items: Array<{ item: Product | Service; kind: "product" | "service" }> = [
    ...visibleProducts.slice(0, 2).map((item) => ({ item, kind: "product" as const })),
    ...visibleServices.slice(0, 1).map((item) => ({ item, kind: "service" as const })),
  ].slice(0, 3);
  return (
    <PreviewShell title="PRÉVIA DOS CARDS" status={status}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {items.map(({ item, kind }) => (
          <StorefrontItemCard
            key={`${kind}:${item.id}`}
            item={item}
            kind={kind}
            customization={customization}
          />
        ))}
        {items.length === 0 ? (
          <Typography style={{ color: colors.warmGray, paddingVertical: 16 }}>
            Cadastre itens para visualizar os cards.
          </Typography>
        ) : null}
      </ScrollView>
    </PreviewShell>
  );
}

export function StorefrontFinalPreview({
  customization,
  products,
  services,
  status,
  coverUrl,
  chrome = true,
}: PreviewData & Readonly<{ status: EditorStatus; chrome?: boolean }>) {
  const { products: visibleProducts, services: visibleServices } = visibleItems(
    products,
    services,
  );
  const body = (
    <>
      <StorefrontHero
        customization={customization}
        coverUrl={coverUrl}
        productCount={visibleProducts.length}
        serviceCount={visibleServices.length}
      />
      <StorefrontContentPreview
        customization={customization}
        products={products}
        services={services}
        status="saved"
        embedded
        listing
      />
      <StorefrontContactAction customization={customization} />
    </>
  );
  if (!chrome) return <View style={{ gap: 12 }}>{body}</View>;
  return (
    <PreviewShell title="PRÉVIA FINAL" status={status} final>
      {body}
    </PreviewShell>
  );
}
