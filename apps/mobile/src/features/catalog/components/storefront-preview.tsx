/* eslint-disable sonarjs/no-nested-conditional */
import type { Product, Service, StorefrontCustomization } from "@lucro-caseiro/contracts";
import { Card, Typography, fonts, radii } from "@lucro-caseiro/ui";
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  displayCatalogItemName,
  resolveCatalogItemAction,
  resolveFeaturedVisual,
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

function readableText(background: string): string {
  const hex = background.replace("#", "");
  if (hex.length !== 6) return INK;
  const [r, g, b] = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? INK : WHITE;
}

function offeringEyebrow(
  mode: StorefrontCustomization["identity"]["offeringMode"],
): string {
  if (mode === "products") return "CATÁLOGO DE PRODUTOS";
  if (mode === "services") return "CATÁLOGO DE SERVIÇOS";
  return "PRODUTOS E SERVIÇOS";
}

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

function FeaturedVisuals({
  customization,
}: Readonly<{ customization: StorefrontCustomization }>) {
  const items = customization.hero.featuredItems;
  if (items.length === 0) {
    return (
      <View
        style={{
          minHeight: 64,
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.lg,
          backgroundColor: "rgba(182,95,114,0.08)",
          paddingVertical: 12,
          paddingHorizontal: 10,
        }}
      >
        <AppIcon
          name="image-outline"
          size={22}
          color={customization.identity.actionColor}
          importantForAccessibility="no"
        />
        <Typography style={{ color: WARM_GRAY, fontSize: 11, marginTop: 4 }}>
          Até 3 destaques
        </Typography>
      </View>
    );
  }
  return (
    <View
      style={{
        minHeight: 88,
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {items.map((item, index) => {
        const transform = item.transforms.find((entry) => entry.breakpoint === "mobile");
        const visual = resolveFeaturedVisual(item, customization.hero.removeBackground);
        const source = visual.source;
        const cutout = visual.cutout;
        if (!source) {
          return (
            <View
              key={item.id}
              style={{
                width: `${Math.max(28, 74 / items.length)}%`,
                height: 88,
                borderRadius: 14,
                backgroundColor: SOFT_ROSE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name={item.kind === "service" ? "calendar-outline" : "bag-handle-outline"}
                size={22}
                color={customization.identity.actionColor}
                importantForAccessibility="no"
              />
            </View>
          );
        }
        return (
          <Image
            key={item.id}
            source={{ uri: source }}
            accessibilityLabel={item.altText}
            resizeMode={cutout ? "contain" : "cover"}
            style={{
              width: `${Math.max(28, 74 / items.length)}%`,
              height: 96 - index * 6,
              borderRadius: cutout ? 0 : 14,
              backgroundColor: cutout ? "transparent" : undefined,
              transform: [{ scale: transform?.scale ?? 1 }],
            }}
          />
        );
      })}
    </View>
  );
}

export function StorefrontHero({
  customization,
  coverUrl = null,
}: Readonly<{ customization: StorefrontCustomization; coverUrl?: string | null }>) {
  const { identity, hero } = customization;
  const compact = hero.style === "compact";
  const editorial = hero.style === "editorial";
  const actionText = readableText(identity.actionColor);
  const coverSource = coverUrl;
  const hasCover = Boolean(coverSource);
  const focal = hero.coverFocal ?? { x: 0.5, y: 0.5, scale: 1 };

  return (
    <View
      style={{
        backgroundColor: hasCover ? WHITE : identity.backgroundColor,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(74,35,50,0.10)",
        overflow: "hidden",
      }}
    >
      <View style={{ minHeight: compact ? 168 : editorial ? 220 : 200 }}>
        {hasCover ? (
          <Image
            source={{ uri: coverSource! }}
            accessibilityLabel="Capa da vitrine"
            resizeMode="cover"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              transform: [{ scale: focal.scale }],
            }}
          />
        ) : null}
        {hasCover ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(250,248,246,0.42)",
            }}
          />
        ) : null}
        <View
          style={{
            flexDirection: editorial ? "row" : "column",
            gap: compact ? 10 : 14,
            padding: compact ? 14 : 16,
            zIndex: 1,
          }}
        >
          <View style={{ flex: editorial ? 1.15 : undefined, gap: 7 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {identity.logoUrl ? (
                <Image
                  source={{ uri: identity.logoUrl }}
                  accessibilityLabel={`Logo de ${identity.displayName}`}
                  style={{
                    width: compact ? 40 : 48,
                    height: compact ? 40 : 48,
                    borderRadius: 14,
                    backgroundColor: WHITE,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: compact ? 40 : 48,
                    height: compact ? 40 : 48,
                    borderRadius: 14,
                    backgroundColor: WHITE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon
                    name="storefront-outline"
                    size={22}
                    color={identity.primaryColor}
                    importantForAccessibility="no"
                  />
                </View>
              )}
              <Typography
                style={{
                  color: identity.actionColor,
                  fontFamily: fonts.extraBold,
                  fontSize: 10,
                  letterSpacing: 1.2,
                }}
              >
                {offeringEyebrow(identity.offeringMode)}
              </Typography>
            </View>
            <Typography
              style={{
                color: identity.primaryColor,
                fontFamily: fonts.extraBold,
                fontSize: compact ? 20 : editorial ? 26 : 24,
                lineHeight: compact ? 24 : 30,
                letterSpacing: -0.4,
              }}
              numberOfLines={2}
            >
              {identity.displayName}
            </Typography>
            {hero.introduction ? (
              <Typography
                style={{ color: WARM_GRAY, fontSize: 12, lineHeight: 17 }}
                numberOfLines={3}
              >
                {hero.introduction}
              </Typography>
            ) : null}
            {hero.shortSignature ? (
              <Typography
                style={{
                  color: identity.actionColor,
                  fontFamily: fonts.semiBold,
                  fontSize: 12,
                }}
              >
                {hero.shortSignature}
              </Typography>
            ) : null}
            {hero.action.type !== "none" && hero.action.label ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 12,
                  backgroundColor: identity.actionColor,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Typography
                  style={{ color: actionText, fontFamily: fonts.bold, fontSize: 12 }}
                >
                  {hero.action.label}
                </Typography>
                <AppIcon
                  name="chevron-forward"
                  size={14}
                  color={actionText}
                  importantForAccessibility="no"
                />
              </View>
            ) : null}
          </View>
          {!hasCover && (!compact || hero.featuredItems.length > 0) ? (
            <FeaturedVisuals customization={customization} />
          ) : null}
        </View>
      </View>
      {hero.showPromotionalBar && hero.promotionalText ? (
        <View
          style={{
            backgroundColor: `${identity.actionColor}18`,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Typography
            style={{
              color: identity.primaryColor,
              textAlign: "center",
              fontFamily: fonts.semiBold,
              fontSize: 12,
            }}
          >
            {hero.promotionalText}
          </Typography>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
        <StorefrontQuickInfo customization={customization} />
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
          backgroundColor: customization.identity.actionColor,
          paddingHorizontal: 13,
          paddingVertical: 7,
        }}
      >
        <Typography
          style={{
            color: readableText(customization.identity.actionColor),
            fontFamily: fonts.semiBold,
            fontSize: 12,
          }}
        >
          Todos
        </Typography>
      </View>
      {categories.slice(0, 8).map((category) => (
        <View
          key={category}
          style={{
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(74,35,50,0.12)",
            backgroundColor: WHITE,
            paddingHorizontal: 13,
            paddingVertical: 7,
          }}
        >
          <Typography style={{ color: INK, fontSize: 12 }}>{category}</Typography>
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

export function StorefrontItemCard({
  item,
  kind,
  customization,
}: Readonly<{
  item: Product | Service;
  kind: "product" | "service";
  customization: StorefrontCustomization;
}>) {
  const product = kind === "product" ? (item as Product) : null;
  const service = kind === "service" ? (item as Service) : null;
  const action = resolveCatalogItemAction(`${kind}:${item.id}`, kind, customization);
  const compact = customization.organization.cards.style === "compact";
  const price = product?.salePrice ?? service?.defaultPrice ?? null;
  const name = displayCatalogItemName(item.name);
  const photoUrl = product?.photoUrl ?? null;
  return (
    <View
      style={{
        width: compact ? 168 : 188,
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
          style={{ width: "100%", height: compact ? 86 : 108 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: compact ? 72 : 88,
            backgroundColor: SOFT_ROSE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon
            name={kind === "product" ? "bag-handle-outline" : "calendar-outline"}
            size={26}
            color={customization.identity.actionColor}
            importantForAccessibility="no"
          />
        </View>
      )}
      <View style={{ padding: 10, gap: 5 }}>
        <Typography
          style={{
            color: customization.identity.actionColor,
            fontFamily: fonts.bold,
            fontSize: 10,
            letterSpacing: 0.4,
          }}
        >
          {kind === "product" ? "Produto" : "Serviço"}
        </Typography>
        <Typography
          style={{ color: INK, fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 }}
          numberOfLines={2}
        >
          {name}
        </Typography>
        {customization.organization.cards.showDetails && item.description ? (
          <Typography
            style={{ color: WARM_GRAY, fontSize: 11, lineHeight: 15 }}
            numberOfLines={2}
          >
            {item.description}
          </Typography>
        ) : null}
        {kind === "service" && service ? (
          <Typography style={{ color: WARM_GRAY, fontSize: 11 }}>
            {service.durationMinutes} min
            {service.locationMode === "online" ? " • Online" : " • Presencial"}
          </Typography>
        ) : null}
        {customization.organization.cards.showPrice ? (
          <Typography
            style={{
              color: customization.identity.primaryColor,
              fontFamily: fonts.bold,
              fontSize: 13,
            }}
          >
            {price == null
              ? customization.organization.cards.missingPriceBehavior === "hidden"
                ? " "
                : customization.organization.cards.missingPriceBehavior === "custom"
                  ? customization.organization.cards.missingPriceText
                  : "Consultar"
              : new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(price)}
          </Typography>
        ) : null}
        {customization.organization.cards.showAvailability && product ? (
          <Typography style={{ color: WARM_GRAY, fontSize: 10 }}>
            {product.stockQuantity != null && product.stockQuantity <= 0
              ? "Indisponível"
              : "Disponível"}
          </Typography>
        ) : null}
        {customization.organization.actions.mode !== "hidden" &&
        action.type !== "none" ? (
          <View
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: customization.identity.actionColor,
              paddingVertical: 6,
              alignItems: "center",
            }}
          >
            <Typography
              style={{
                color: customization.identity.actionColor,
                fontFamily: fonts.semiBold,
                fontSize: 11,
              }}
            >
              {actionLabel(action)}
            </Typography>
          </View>
        ) : null}
      </View>
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
        borderRadius: 14,
        backgroundColor: customization.identity.actionColor,
        paddingVertical: 11,
        paddingHorizontal: 14,
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
        size={16}
        color={WHITE}
        importantForAccessibility="no"
      />
      <Typography
        style={{
          color: WHITE,
          fontFamily: fonts.bold,
          fontSize: 12,
        }}
      >
        {customization.organization.contact.defaultActionLabel}
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
  const colors = useBrandScreenPalette();
  const productCount = visibleProducts.length;
  const serviceCount = visibleServices.length;
  return (
    <PreviewShell title="PRÉVIA DA VITRINE" status={status}>
      <StorefrontHero customization={customization} coverUrl={coverUrl} />
      <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
        {customization.identity.offeringMode === "products"
          ? `${productCount} ${productCount === 1 ? "produto" : "produtos"}`
          : customization.identity.offeringMode === "services"
            ? `${serviceCount} ${serviceCount === 1 ? "serviço" : "serviços"}`
            : `${productCount} produtos • ${serviceCount} serviços`}
      </Typography>
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

export function StorefrontContentPreview({
  customization,
  products,
  services,
  status,
  embedded = false,
}: PreviewData & Readonly<{ status: EditorStatus; embedded?: boolean }>) {
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
    ? visibleProducts.slice(0, 2)
    : [];
  const previewServices = customization.organization.content.showServices
    ? visibleServices.slice(0, 1)
    : [];
  const body = (
    <>
      {customization.organization.discovery.showSearch ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: "rgba(74,35,50,0.12)",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              backgroundColor: WHITE,
            }}
          >
            <AppIcon
              name="search-outline"
              size={16}
              color={WARM_GRAY}
              importantForAccessibility="no"
            />
            <Typography style={{ color: WARM_GRAY, fontSize: 12 }}>
              O que você procura?
            </Typography>
          </View>
          {customization.organization.discovery.allowFilters ? (
            <View
              style={{
                minWidth: 42,
                minHeight: 42,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: "rgba(74,35,50,0.12)",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: WHITE,
              }}
              accessibilityLabel="Filtros"
            >
              <AppIcon
                name="options-outline"
                size={16}
                color={INK}
                importantForAccessibility="no"
              />
            </View>
          ) : null}
        </View>
      ) : null}
      <StorefrontCategoryNavigation
        categories={categories}
        customization={customization}
      />
      {customization.identity.offeringMode === "both" &&
      customization.organization.content.showProducts &&
      customization.organization.content.showServices ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            {
              label: `Produtos (${visibleProducts.length})`,
              active: true,
              icon: "bag-handle-outline" as const,
            },
            {
              label: `Serviços (${visibleServices.length})`,
              active: false,
              icon: "calendar-outline" as const,
            },
          ].map((tab) => (
            <View
              key={tab.label}
              style={{
                flex: 1,
                minHeight: 40,
                borderRadius: 12,
                borderWidth: tab.active ? 1.5 : 1,
                borderColor: tab.active
                  ? customization.identity.actionColor
                  : "rgba(74,35,50,0.12)",
                backgroundColor: tab.active ? SOFT_ROSE : WHITE,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <AppIcon
                name={tab.icon}
                size={14}
                color={customization.identity.primaryColor}
                importantForAccessibility="no"
              />
              <Typography
                style={{
                  color: customization.identity.primaryColor,
                  fontFamily: fonts.semiBold,
                  fontSize: 11,
                }}
              >
                {tab.label}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {previewProducts.map((item) => (
          <StorefrontItemCard
            key={`product:${item.id}`}
            item={item}
            kind="product"
            customization={customization}
          />
        ))}
        {previewServices.map((item) => (
          <StorefrontItemCard
            key={`service:${item.id}`}
            item={item}
            kind="service"
            customization={customization}
          />
        ))}
        {previewProducts.length + previewServices.length === 0 ? (
          <View
            style={{
              width: 220,
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
        ) : null}
      </ScrollView>
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
}: PreviewData & Readonly<{ status: EditorStatus }>) {
  const { products: visibleProducts, services: visibleServices } = visibleItems(
    products,
    services,
  );
  return (
    <PreviewShell title="PRÉVIA FINAL" status={status} final>
      <StorefrontHero customization={customization} coverUrl={coverUrl} />
      <Typography style={{ color: WARM_GRAY, fontSize: 12, marginTop: -4 }}>
        {visibleProducts.length} produtos • {visibleServices.length} serviços
      </Typography>
      <StorefrontContentPreview
        customization={customization}
        products={products}
        services={services}
        status="saved"
        embedded
      />
      <StorefrontContactAction customization={customization} />
    </PreviewShell>
  );
}

export function CoverAdjuster({
  coverUrl,
  focal,
  onChange,
}: Readonly<{
  coverUrl: string;
  focal: NonNullable<StorefrontCustomization["hero"]["coverFocal"]>;
  onChange: (focal: NonNullable<StorefrontCustomization["hero"]["coverFocal"]>) => void;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          height: 140,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: colors.surface,
        }}
      >
        <Image
          source={{ uri: coverUrl }}
          accessibilityLabel="Ajuste da capa"
          resizeMode="cover"
          style={{
            width: "100%",
            height: "100%",
            transform: [{ scale: focal.scale }],
          }}
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(
          [
            [
              "←",
              "Mover capa para a esquerda",
              { x: focal.x - 0.05, y: focal.y, scale: focal.scale },
            ],
            [
              "→",
              "Mover capa para a direita",
              { x: focal.x + 0.05, y: focal.y, scale: focal.scale },
            ],
            [
              "↑",
              "Mover capa para cima",
              { x: focal.x, y: focal.y - 0.05, scale: focal.scale },
            ],
            [
              "↓",
              "Mover capa para baixo",
              { x: focal.x, y: focal.y + 0.05, scale: focal.scale },
            ],
            [
              "−",
              "Diminuir zoom da capa",
              { x: focal.x, y: focal.y, scale: focal.scale - 0.1 },
            ],
            [
              "+",
              "Aumentar zoom da capa",
              { x: focal.x, y: focal.y, scale: focal.scale + 0.1 },
            ],
          ] as const
        ).map(([label, accessibilityLabel, next]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() =>
              onChange({
                x: Math.min(1, Math.max(0, next.x)),
                y: Math.min(1, Math.max(0, next.y)),
                scale: Math.min(2.5, Math.max(1, next.scale)),
              })
            }
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
            <Typography style={{ color: colors.ink, fontFamily: fonts.bold }}>
              {label}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
