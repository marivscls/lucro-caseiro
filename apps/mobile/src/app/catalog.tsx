import type { CatalogSettings, Product, Service } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  IconButton,
  Typography,
  fonts,
  iconSizes,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { MobileFloatingTabBar } from "../shared/components/mobile-floating-tab-bar";
import * as Clipboard from "expo-clipboard";
import { Asset } from "expo-asset";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  Switch,
  View,
  useWindowDimensions,
} from "react-native";
import type { TextStyle, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { trackAnalyticsAction } from "../features/analytics/tracker";
import { publicCatalogUrl } from "../features/catalog/api";
import { CatalogCustomizer } from "../features/catalog/components/catalog-customizer";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { useCatalogSettings, useUpdateCatalogSettings } from "../features/catalog/hooks";
import { useProfile } from "../features/subscription/hooks";
import { useAuth } from "../shared/hooks/use-auth";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ApiError } from "../shared/utils/api-client";
import { openWhatsAppShare } from "../shared/utils/whatsapp";
import { showToast } from "../shared/components/toast";
import { alertError } from "../shared/utils/alerts";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { useBrandIllustration } from "../shared/brand-illustrations";
import { useBrandScreenPalette } from "../shared/brand-palette";
import { pageGutter } from "../shared/layout/desktop-density";
import { ScreenHeader } from "../shared/components/screen-header";
import { useAllProducts, useUpdateProduct } from "../features/products/hooks";
import { useServices, useUpdateService } from "../features/services/hooks";
import { formatCurrency } from "../shared/utils/format";

type CatalogContentTab = "products" | "services";

const CATALOG_HERO_ASPECT_RATIO = 1139 / 998;
const CATALOG_CONTENT_MAX_WIDTH = 960;
const CATALOG_HERO_STYLE_ID = "catalog-hero-layout";
const CATALOG_HERO_WEB_CSS = `
[data-testid="catalog-page"] {
  overflow-x: clip;
}

@media (min-width: 601px) and (max-width: 1023px) {
  [data-testid="catalog-scroll-content"] {
    margin-top: -40px;
    padding-top: 40px;
  }
}
`;
const CatalogSwitch = Switch as React.ComponentType<
  React.ComponentProps<typeof Switch> & Readonly<{ activeThumbColor?: string }>
>;

function useCatalogHeroWebStyles(): void {
  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return undefined;
    let style = document.getElementById(CATALOG_HERO_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = CATALOG_HERO_STYLE_ID;
      document.head.append(style);
    }
    style.textContent = CATALOG_HERO_WEB_CSS;
    return undefined;
  }, []);
}

function catalogHeroNativeArtFrame(viewportWidth: number): Readonly<{
  width: number;
  top: number;
  right: number;
}> {
  let frame = { width: 300, top: -16, right: -12 };
  if (viewportWidth >= 390) frame = { width: 330, top: -20, right: -10 };
  if (viewportWidth >= 480) frame = { width: 355, top: -26, right: -5 };
  if (viewportWidth >= 601) frame = { width: 420, top: -40, right: 12 };
  if (viewportWidth >= 1024) frame = { width: 470, top: -42, right: 14 };
  return frame;
}

function CatalogHero({
  enabled,
  illustration,
}: Readonly<{
  enabled: boolean;
  illustration: ReturnType<typeof useBrandIllustration>;
}>) {
  const { width: viewportWidth } = useWindowDimensions();
  const colors = useBrandScreenPalette();
  useCatalogHeroWebStyles();
  const isWideHero = viewportWidth >= 768;
  const isVeryCompact = viewportWidth < 360;
  const nativeArtFrame = catalogHeroNativeArtFrame(viewportWidth);
  const illustrationUri = Asset.fromModule(illustration).uri;
  let heroHeight = 350;
  if (isWideHero) heroHeight = 367;
  let titleSize = viewportWidth < 430 ? 20 : 23;
  if (isVeryCompact) titleSize = 18;
  if (isWideHero) titleSize = 38;
  // The wrapper includes its left padding in its measured width on web.
  let textWidth: number | "50%" | "52%" = "50%";
  if (viewportWidth >= 430) textWidth = "52%";
  if (isWideHero) textWidth = 403;
  const descriptionWidth = isWideHero ? "100%" : "75%";
  let copyGap: number = spacing.md;
  if (isVeryCompact) copyGap = 7;
  if (isWideHero) copyGap = 22;
  let descriptionFontSize = 15;
  let descriptionLineHeight = 21;
  if (isVeryCompact) {
    descriptionFontSize = 13;
    descriptionLineHeight = 18;
  }
  if (isWideHero) {
    descriptionFontSize = 21;
    descriptionLineHeight = 34;
  }
  const copyLeft = isWideHero ? 43 : 24;
  const copyTop = isWideHero ? 50 : 48;
  const statusHeight = isWideHero ? 42 : 32;
  const statusFontSize = isWideHero ? 16 : 13;

  return (
    <View
      testID="catalog-hero-wrapper"
      style={{
        position: "relative",
        minHeight: heroHeight,
        borderRadius: 28,
        overflow: "visible",
        isolation: "isolate",
      }}
    >
      <View
        testID="catalog-hero-background"
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          borderRadius: 28,
          backgroundColor: colors.wineFill,
        }}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Path
            d="M -7 55 C 17 9, 40 8, 61 37 S 91 34, 108 25"
            fill="none"
            stroke={colors.rose}
            strokeWidth={0.34}
            opacity={0.42}
          />
        </Svg>
      </View>

      <View
        testID="catalog-hero-copy"
        style={{
          position: "relative",
          zIndex: 3,
          width: textWidth,
          gap: copyGap,
          paddingLeft: copyLeft,
          paddingTop: copyTop,
        }}
      >
        <Typography
          numberOfLines={2}
          color={colors.onWine}
          style={{
            fontFamily: fonts.extraBold,
            fontSize: titleSize,
            lineHeight: titleSize * 1.07,
          }}
        >
          {"Seu negócio,\nem uma vitrine só."}
        </Typography>
        <Typography
          color="#F7EEF0"
          style={{
            fontSize: descriptionFontSize,
            lineHeight: descriptionLineHeight,
            width: descriptionWidth,
          }}
        >
          Produtos e serviços organizados para seus clientes escolherem.
        </Typography>
        <View
          accessibilityRole="text"
          style={{
            alignSelf: "flex-start",
            minHeight: statusHeight,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            borderRadius: radii.full,
            paddingHorizontal: isWideHero ? spacing.lg : spacing.md,
            backgroundColor: enabled ? colors.lime : colors.softRose,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: radii.full,
              backgroundColor: enabled ? colors.rose : colors.warmGray,
            }}
          />
          <Typography
            style={{
              color: enabled ? colors.onLime : colors.wine,
              fontFamily: fonts.bold,
              fontSize: statusFontSize,
              lineHeight: isWideHero ? 22 : 18,
            }}
          >
            {enabled ? "Catálogo no ar" : "Catálogo desativado"}
          </Typography>
        </View>
      </View>

      <View
        testID="catalog-hero-art-anchor"
        pointerEvents="none"
        accessible={false}
        aria-hidden
        style={{
          position: "absolute",
          width: nativeArtFrame.width,
          top: nativeArtFrame.top,
          right: nativeArtFrame.right,
          zIndex: 2,
        }}
      >
        {Platform.OS === "web" ? (
          <img
            data-testid="catalog-hero-illustration"
            src={illustrationUri}
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              maxWidth: "none",
              objectFit: "contain",
              transform: "none",
            }}
          />
        ) : (
          <Image
            testID="catalog-hero-illustration"
            source={illustration}
            resizeMode="contain"
            accessible={false}
            accessibilityIgnoresInvertColors
            style={{ width: "100%", aspectRatio: CATALOG_HERO_ASPECT_RATIO }}
          />
        )}
      </View>
    </View>
  );
}

function SummaryMetric({
  icon,
  value,
  label,
  highlighted = false,
  compact = false,
  spacious = false,
}: Readonly<{
  icon: AppIconName;
  value: number | null;
  label: string;
  highlighted?: boolean;
  compact?: boolean;
  spacious?: boolean;
}>) {
  let metricGap = 7;
  let metricIconSize = 36;
  let valueFontSize = 18;
  let valueLineHeight = 24;
  let labelFontSize = 11;
  let labelLineHeight = 15;
  let metricGlyphSize: number = iconSizes.inline;
  if (compact) {
    metricGap = 3;
    metricIconSize = 32;
  }
  if (spacious) {
    metricGap = 10;
    metricIconSize = 46;
    valueFontSize = 22;
    valueLineHeight = 28;
    labelFontSize = 14;
    labelLineHeight = 19;
    metricGlyphSize = 24;
  }
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: compact ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: metricGap,
      }}
    >
      <View
        style={{
          width: metricIconSize,
          height: metricIconSize,
          borderRadius: radii.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.softRose,
        }}
      >
        <AppIcon name={icon} size={metricGlyphSize} color={colors.rose} />
      </View>
      <View
        style={{ minWidth: 0, alignItems: compact ? "center" : "flex-start", gap: 1 }}
      >
        <Typography
          style={{
            color: colors.ink,
            fontFamily: fonts.bold,
            fontSize: valueFontSize,
            lineHeight: valueLineHeight,
          }}
        >
          {value ?? "—"}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          {highlighted ? (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: radii.full,
                backgroundColor: colors.lime,
              }}
            />
          ) : null}
          <Typography
            numberOfLines={1}
            style={{
              color: colors.warmGray,
              fontSize: labelFontSize,
              lineHeight: labelLineHeight,
            }}
          >
            {label}
          </Typography>
        </View>
      </View>
    </View>
  );
}

function serviceCatalogDescription(service: Service): string {
  if (!service.active) return "Pausado — reative na tela Serviços";
  const price =
    service.defaultPrice == null
      ? "Preço sob consulta"
      : formatCurrency(service.defaultPrice);
  return `${service.durationMinutes} min · ${price}`;
}

function CatalogItemVisibility({
  title,
  description,
  imageUrl,
  icon,
  enabled,
  disabled = false,
  pending,
  onChange,
}: Readonly<{
  title: string;
  description: string;
  imageUrl?: string | null;
  icon: AppIconName;
  enabled: boolean;
  disabled?: boolean;
  pending: boolean;
  onChange: (enabled: boolean) => void;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const { width: viewportWidth } = useWindowDimensions();
  const compact = viewportWidth < 350;
  const spacious = viewportWidth >= 768;
  let imageSize = 62;
  let statusWidth = 64;
  let visibilityFontSize = 12;
  if (compact) imageSize = 52;
  if (compact) {
    statusWidth = 54;
    visibilityFontSize = 11;
  }
  if (spacious) {
    imageSize = 90;
    statusWidth = 90;
    visibilityFontSize = 14;
  }
  let visibilityLabel = enabled ? "Publicado" : "Oculto";
  if (pending) visibilityLabel = "Salvando...";
  return (
    <Card
      variant="elevated"
      padding={compact || spacious ? "sm" : "md"}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
      }}
    >
      <View
        style={{
          minHeight: spacious ? 90 : 68,
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 6 : spacing.sm,
        }}
      >
        <View
          pointerEvents="none"
          accessible={false}
          style={{
            width: compact ? 12 : 16,
            flexDirection: "row",
            justifyContent: "center",
            opacity: 0.7,
          }}
        >
          <AppIcon name="ellipsis-vertical" size={18} color={colors.warmGray} />
          <AppIcon
            name="ellipsis-vertical"
            size={18}
            color={colors.warmGray}
            style={{ marginLeft: -11 }}
          />
        </View>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            resizeMode="cover"
            accessible={false}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
            }}
          />
        ) : (
          <View
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <AppIcon name={icon} size={23} color={theme.colors.primaryStrong} />
          </View>
        )}
        <View
          pointerEvents="none"
          accessible={false}
          style={{
            width: 3,
            height: imageSize - 8,
            borderRadius: radii.full,
            backgroundColor: colors.rose,
            opacity: 0.8,
          }}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Typography
            variant="bodyBold"
            numberOfLines={2}
            style={spacious ? { fontSize: 18, lineHeight: 24 } : undefined}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            numberOfLines={2}
            style={spacious ? { fontSize: 15, lineHeight: 21 } : undefined}
          >
            {description}
          </Typography>
        </View>
        <View style={{ minWidth: statusWidth, alignItems: "center", gap: 2 }}>
          <View style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}>
            <CatalogSwitch
              value={enabled}
              disabled={disabled || pending}
              onValueChange={onChange}
              trackColor={{ false: colors.border, true: colors.rose }}
              thumbColor={colors.onWine}
              activeThumbColor={colors.onWine}
              ios_backgroundColor={colors.border}
              aria-checked={enabled}
              accessibilityRole="switch"
              accessibilityState={{ checked: enabled, disabled: disabled || pending }}
              accessibilityLabel={`${enabled ? "Ocultar" : "Exibir"} ${title} no catálogo`}
            />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: radii.full,
                backgroundColor: enabled ? colors.lime : colors.muted,
              }}
            />
            <Typography
              numberOfLines={1}
              style={{
                color: colors.warmGray,
                fontSize: visibilityFontSize,
              }}
            >
              {visibilityLabel}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}

function CatalogContentManager({
  settings,
  businessName,
  onShare,
  onPreview,
  onMore,
  onCopy,
  onCustomize,
  onActivate,
}: Readonly<{
  settings: CatalogSettings;
  businessName: string;
  onShare: () => void;
  onPreview: () => void;
  onMore: () => void;
  onCopy: () => void;
  onCustomize: () => void;
  onActivate: () => void;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const spaciousLayout = viewportWidth >= 768;
  const referencePwaLayout = spaciousLayout && viewportWidth < 1024;
  let contentSectionInset = 4;
  if (referencePwaLayout) contentSectionInset = 19;
  if (viewportWidth >= 1024) contentSectionInset = 0;
  const listGap = spaciousLayout ? 10 : spacing.sm;
  const identityLogoSize = spaciousLayout ? 72 : 58;
  const identityPreviewSize = spaciousLayout ? 68 : 42;
  let summaryCardPadding: number = spacing.lg;
  if (viewportWidth < 350) summaryCardPadding = 14;
  const summaryCardPaddingVertical = spaciousLayout ? 30 : summaryCardPadding;
  const summaryCardPaddingHorizontal = spaciousLayout ? 32 : summaryCardPadding;
  const [tab, setTab] = useState<CatalogContentTab>("products");
  const [organizing, setOrganizing] = useState(false);
  const [pending, setPending] = useState<{
    type: CatalogContentTab;
    id: string;
    enabled: boolean;
  } | null>(null);
  const productsQuery = useAllProducts();
  const servicesQuery = useServices();
  const updateProduct = useUpdateProduct();
  const updateService = useUpdateService();
  const products = productsQuery.data ?? [];
  const services = servicesQuery.data ?? [];
  const visibleProducts = products.filter((product) => product.publicEnabled).length;
  const visibleServices = services.filter(
    (service) => service.active && service.publicEnabled,
  ).length;
  const isProductsTab = tab === "products";
  const sectionLabel = isProductsTab ? "produtos" : "serviços";

  function resolvedVisibility(
    type: CatalogContentTab,
    id: string,
    current: boolean,
  ): boolean {
    return pending?.type === type && pending.id === id ? pending.enabled : current;
  }

  async function setProductVisibility(product: Product, enabled: boolean) {
    setPending({ type: "products", id: product.id, enabled });
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: { publicEnabled: enabled },
      });
      await productsQuery.refetch();
    } catch {
      alertError("Não foi possível atualizar esse produto no catálogo.");
    } finally {
      setPending(null);
    }
  }

  async function setServiceVisibility(service: Service, enabled: boolean) {
    setPending({ type: "services", id: service.id, enabled });
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: { publicEnabled: enabled },
      });
      await servicesQuery.refetch();
    } catch {
      alertError("Não foi possível atualizar esse serviço no catálogo.");
    } finally {
      setPending(null);
    }
  }

  const query = tab === "products" ? productsQuery : servicesQuery;
  const itemsAreEmpty =
    tab === "products" ? products.length === 0 : services.length === 0;
  const emptyMessage =
    tab === "products"
      ? "Cadastre produtos para escolher quais aparecem na vitrine."
      : "Cadastre serviços para escolher quais aparecem na vitrine.";

  let content: React.ReactNode;
  if (query.isLoading) {
    content = (
      <View style={{ gap: listGap }}>
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </View>
    );
  } else if (query.error) {
    content = (
      <Card style={{ gap: spacing.md }}>
        <Typography variant="bodyBold">Não foi possível carregar o conteúdo</Typography>
        <Button
          title="Tentar novamente"
          variant="secondary"
          onPress={() => void query.refetch()}
        />
      </Card>
    );
  } else if (itemsAreEmpty) {
    content = (
      <Card>
        <Typography variant="body" color={theme.colors.textSecondary}>
          {emptyMessage}
        </Typography>
      </Card>
    );
  } else if (tab === "products") {
    const displayedProducts = organizing ? products : products.slice(0, 3);
    content = (
      <View style={{ gap: listGap }}>
        {displayedProducts.map((product) => (
          <CatalogItemVisibility
            key={product.id}
            title={product.name}
            description={`${product.category} · ${formatCurrency(product.salePrice)}`}
            imageUrl={product.photoUrl}
            icon="cube-outline"
            enabled={resolvedVisibility("products", product.id, product.publicEnabled)}
            pending={pending?.type === "products" && pending.id === product.id}
            onChange={(enabled) => void setProductVisibility(product, enabled)}
          />
        ))}
      </View>
    );
  } else {
    const displayedServices = organizing ? services : services.slice(0, 3);
    content = (
      <View style={{ gap: spacing.sm }}>
        {displayedServices.map((service) => (
          <CatalogItemVisibility
            key={service.id}
            title={service.name}
            description={serviceCatalogDescription(service)}
            icon="briefcase-outline"
            enabled={resolvedVisibility(
              "services",
              service.id,
              service.active && service.publicEnabled,
            )}
            disabled={!service.active}
            pending={pending?.type === "services" && pending.id === service.id}
            onChange={(enabled) => void setServiceVisibility(service, enabled)}
          />
        ))}
      </View>
    );
  }

  const catalogUrl = publicCatalogUrl(settings.slug);
  const loadingCounts = productsQuery.isLoading || servicesQuery.isLoading;
  const publishedCount = visibleProducts + visibleServices;
  const secondaryActionsStacked = viewportWidth < 350;
  const compactSummary = viewportWidth < 350;
  const identityImages = products
    .map((product) => product.photoUrl)
    .filter((photoUrl): photoUrl is string => Boolean(photoUrl))
    .slice(0, 3);
  let identitySlotCount = 3;
  if (viewportWidth < 430) identitySlotCount = 2;
  if (viewportWidth < 360) identitySlotCount = 1;
  let sectionTitleStyle: TextStyle | undefined;
  if (compactSummary) sectionTitleStyle = { fontSize: 20, lineHeight: 25 };
  if (spaciousLayout) {
    sectionTitleStyle = { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 34 };
  }
  let organizeButtonStyle: ViewStyle | undefined;
  if (compactSummary) organizeButtonStyle = { alignSelf: "flex-end" };
  if (spaciousLayout) organizeButtonStyle = { minHeight: 52 };

  return (
    <View
      style={{ gap: spaciousLayout ? spacing["2xl"] : spacing["3xl"], marginTop: -58 }}
    >
      <View
        testID="catalog-link-card"
        style={{ marginHorizontal: 12, position: "relative", zIndex: 5 }}
      >
        <Card
          variant="elevated"
          shadow="md"
          style={{
            borderRadius: 28,
            paddingVertical: summaryCardPaddingVertical,
            paddingHorizontal: summaryCardPaddingHorizontal,
            gap: spaciousLayout ? 24 : spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.white,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "stretch" }}>
            <SummaryMetric
              icon="bag-handle-outline"
              value={loadingCounts ? null : products.length}
              label="produtos"
              compact={compactSummary}
              spacious={spaciousLayout}
            />
            <View style={{ width: 1, backgroundColor: theme.colors.border }} />
            <SummaryMetric
              icon="notifications-outline"
              value={loadingCounts ? null : services.length}
              label="serviços"
              compact={compactSummary}
              spacious={spaciousLayout}
            />
            <View style={{ width: 1, backgroundColor: theme.colors.border }} />
            <SummaryMetric
              icon="star"
              value={loadingCounts ? null : publishedCount}
              label="publicados"
              highlighted
              compact={compactSummary}
              spacious={spaciousLayout}
            />
          </View>

          <View style={{ gap: spaciousLayout ? spacing.md : spacing.sm }}>
            <Typography
              style={{
                color: colors.wine,
                fontFamily: fonts.bold,
                fontSize: spaciousLayout ? 16 : 13,
                lineHeight: spaciousLayout ? 22 : 18,
              }}
            >
              LINK DA VITRINE
            </Typography>
            <View
              style={{
                minHeight: spaciousLayout ? 64 : 52,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: radii.lg,
                backgroundColor: theme.colors.background,
                paddingLeft: spacing.md,
                paddingRight: spacing.xs,
              }}
            >
              <AppIcon
                name="link-outline"
                size={spaciousLayout ? 24 : 20}
                color={theme.colors.primaryStrong}
              />
              <Typography
                numberOfLines={1}
                color={theme.colors.textSecondary}
                style={{ flex: 1, fontSize: spaciousLayout ? 18 : 13 }}
              >
                {catalogUrl.replace(/^https?:\/\//, "")}
              </Typography>
              <IconButton
                size={44}
                onPress={onCopy}
                accessibilityLabel="Copiar link da vitrine"
                icon={
                  <AppIcon
                    name="clipboard-outline"
                    size={20}
                    color={theme.colors.primaryStrong}
                  />
                }
              />
            </View>
          </View>

          <Button
            title={settings.enabled ? "Compartilhar catálogo" : "Ativar catálogo"}
            size="lg"
            icon={
              <AppIcon
                name={settings.enabled ? "share-outline" : "rocket-outline"}
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={settings.enabled ? onShare : onActivate}
            accessibilityLabel={
              settings.enabled ? "Compartilhar catálogo" : "Ativar catálogo"
            }
            style={{
              width: "100%",
              minHeight: spaciousLayout ? 56 : undefined,
              backgroundColor: colors.rose,
            }}
          />
          <View
            style={{
              flexDirection: secondaryActionsStacked ? "column" : "row",
              gap: spacing.sm,
            }}
          >
            <Button
              title="Ver como cliente"
              variant="outline"
              disabled={!settings.enabled}
              icon={
                <AppIcon
                  name="eye-outline"
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={onPreview}
              style={{
                flex: secondaryActionsStacked ? undefined : 1,
                minHeight: spaciousLayout ? 56 : undefined,
              }}
            />
            <Button
              title="Mais opções"
              variant="outline"
              icon={
                <AppIcon
                  name="ellipsis-horizontal"
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={onMore}
              style={{
                flex: secondaryActionsStacked ? undefined : 1,
                minHeight: spaciousLayout ? 56 : undefined,
              }}
            />
          </View>
        </Card>
      </View>

      <View style={{ gap: spacing.md, paddingHorizontal: contentSectionInset }}>
        <View style={{ gap: spacing.xs }}>
          <View
            style={{
              flexDirection: compactSummary ? "column" : "row",
              alignItems: compactSummary ? "stretch" : "center",
              gap: compactSummary ? spacing.sm : spacing.md,
            }}
          >
            <Typography variant="h2" style={sectionTitleStyle}>
              O que aparece na vitrine
            </Typography>
            {!compactSummary ? <View style={{ flex: 1 }} /> : null}
            <Button
              title={organizing ? "Concluir" : "Organizar"}
              variant="outline"
              compact
              icon={
                <AppIcon
                  name="options-outline"
                  size={18}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={() => setOrganizing((current) => !current)}
              style={organizeButtonStyle}
            />
          </View>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={spaciousLayout ? { fontSize: 17, lineHeight: 24 } : undefined}
          >
            Escolha e organize o que seus clientes podem encontrar.
          </Typography>
        </View>

        <View
          accessibilityRole="tablist"
          style={{
            minHeight: spaciousLayout ? 52 : 48,
            flexDirection: "row",
            borderRadius: radii.lg,
            backgroundColor: colors.neutral,
            padding: 3,
          }}
        >
          {(["products", "services"] as const).map((itemTab) => {
            const selected = tab === itemTab;
            const label = itemTab === "products" ? "Produtos" : "Serviços";
            const count = itemTab === "products" ? products.length : services.length;
            return (
              <Pressable
                key={itemTab}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${label}, ${count}`}
                onPress={() => {
                  setTab(itemTab);
                  setOrganizing(false);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: spaciousLayout ? 46 : 42,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.86 : 1,
                  backgroundColor: selected ? colors.wineFill : "transparent",
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Typography
                    style={{
                      color: selected ? colors.onWine : colors.warmGray,
                      fontFamily: selected ? fonts.bold : fonts.semiBold,
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </Typography>
                  <View
                    style={{
                      minWidth: 22,
                      minHeight: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: radii.full,
                      paddingHorizontal: 6,
                      backgroundColor: selected
                        ? "rgba(255, 255, 255, 0.18)"
                        : colors.softRose,
                    }}
                  >
                    <Typography
                      style={{
                        color: selected ? colors.onWine : colors.wine,
                        fontFamily: fonts.bold,
                        fontSize: 11,
                        lineHeight: 15,
                      }}
                    >
                      {count}
                    </Typography>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {content}

        {!itemsAreEmpty ? (
          <Button
            title={`Ver todos os ${sectionLabel}`}
            variant="outline"
            icon={
              <AppIcon name="grid-outline" size={20} color={theme.colors.primaryStrong} />
            }
            onPress={() => router.push(isProductsTab ? "/products" : "/services")}
            style={{ width: "100%", minHeight: spaciousLayout ? 56 : undefined }}
          />
        ) : null}
      </View>

      <View style={{ gap: spacing.sm, paddingHorizontal: contentSectionInset }}>
        <View style={{ gap: spacing.xs }}>
          <Typography
            variant="h2"
            style={
              spaciousLayout
                ? { fontFamily: fonts.extraBold, fontSize: 28, lineHeight: 34 }
                : undefined
            }
          >
            Sua identidade
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={spaciousLayout ? { fontSize: 17, lineHeight: 24 } : undefined}
          >
            Deixe a vitrine com a cara do seu negócio.
          </Typography>
        </View>
        <Card
          variant="elevated"
          onPress={onCustomize}
          style={{
            padding: 0,
            overflow: "hidden",
            backgroundColor: theme.colors.surfaceElevated,
          }}
        >
          <View
            style={{
              minHeight: spaciousLayout ? 128 : 96,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              padding: spacing.lg,
            }}
          >
            {settings.logoUrl ? (
              <Image
                source={{ uri: settings.logoUrl }}
                resizeMode="cover"
                accessible={false}
                style={{
                  width: identityLogoSize,
                  height: identityLogoSize,
                  borderRadius: radii.full,
                }}
              />
            ) : (
              <View
                style={{
                  width: identityLogoSize,
                  height: identityLogoSize,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.softRose,
                }}
              >
                <AppIcon
                  name="storefront-outline"
                  size={28}
                  color={theme.colors.primaryStrong}
                />
              </View>
            )}
            <Typography
              variant="bodyBold"
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: spaciousLayout ? 22 : undefined,
                lineHeight: spaciousLayout ? 28 : undefined,
              }}
            >
              {businessName}
            </Typography>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {Array.from({ length: identitySlotCount }, (_, index) => index).map(
                (index) =>
                  identityImages[index] ? (
                    <Image
                      key={identityImages[index]}
                      source={{ uri: identityImages[index] }}
                      resizeMode="cover"
                      accessible={false}
                      style={{
                        width: identityPreviewSize,
                        height: identityPreviewSize,
                        borderRadius: 10,
                      }}
                    />
                  ) : (
                    <View
                      key={`identity-placeholder-${index}`}
                      style={{
                        width: identityPreviewSize,
                        height: identityPreviewSize,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <AppIcon
                        name="image-outline"
                        size={18}
                        color={theme.colors.primaryLight}
                      />
                    </View>
                  ),
              )}
            </View>
            <AppIcon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
          <View
            style={{
              minHeight: spaciousLayout ? 60 : 48,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <AppIcon
              name="color-palette-outline"
              size={spaciousLayout ? 24 : 20}
              color={theme.colors.primaryStrong}
            />
            <Typography
              variant="bodyBold"
              color={theme.colors.primaryStrong}
              style={spaciousLayout ? { fontSize: 20, lineHeight: 26 } : undefined}
            >
              Personalizar
            </Typography>
          </View>
        </Card>
      </View>
    </View>
  );
}

function CatalogForm({
  settings,
  moreMenuVisible,
  onOpenMoreMenu,
  onCloseMoreMenu,
}: Readonly<{
  settings: CatalogSettings;
  moreMenuVisible: boolean;
  onOpenMoreMenu: () => void;
  onCloseMoreMenu: () => void;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const { width: viewportWidth } = useWindowDimensions();
  const catalogStorefront = useBrandIllustration("catalogHero");
  const isDesktop = useDesktopLayout();
  const referencePwaLayout = viewportWidth >= 768 && !isDesktop;
  const update = useUpdateCatalogSettings();
  const router = useRouter();
  const editorParams = useLocalSearchParams<{ editor?: string }>();
  const [customizerVisible, setCustomizerVisible] = useState(
    () => editorParams.editor === "1",
  );
  React.useEffect(() => {
    setCustomizerVisible(editorParams.editor === "1");
  }, [editorParams.editor]);
  const { data: profile } = useProfile();
  const { data: customizerProducts = [] } = useAllProducts();
  const { data: customizerServices = [] } = useServices();
  const showPaywall = usePaywall((s) => s.show);
  const canShowFullCatalog =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "catalogPremium");
  const canCustomizeCatalog =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "catalogCustomization");

  const url = publicCatalogUrl(settings.slug);
  const shareMessage = `Oi! 😊 Dá uma olhada na minha vitrine. Você pode conhecer meus produtos e serviços e falar comigo por lá:\n\n${url}`;

  async function save(
    data: Parameters<typeof update.mutateAsync>[0],
  ): Promise<CatalogSettings | null> {
    try {
      return await update.mutateAsync(data);
    } catch (err) {
      // Personalização é do Essencial: LIMIT_EXCEEDED abre o paywall correto.
      if (err instanceof ApiError && err.code === "LIMIT_EXCEEDED") {
        showPaywall("catalog", "essential");
        return null;
      }
      const message =
        err instanceof ApiError && err.status === 400
          ? err.message
          : "Não foi possível salvar. Tente novamente.";
      alertError(message);
      return null;
    }
  }

  async function handleToggle(enabled: boolean) {
    await save({ enabled });
  }

  async function handleShare() {
    await Share.share({
      message: shareMessage,
    });
    void trackAnalyticsAction("catalog_shared", useAuth.getState().token);
  }

  async function handleWhatsAppShare() {
    if (await openWhatsAppShare(shareMessage)) {
      void trackAnalyticsAction("catalog_shared", useAuth.getState().token);
    }
  }

  async function handlePreview() {
    await Linking.openURL(url);
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(url);
    showToast("Link copiado!");
  }

  function openCustomizer() {
    setCustomizerVisible(true);
    router.setParams({ editor: "1", step: "identity" });
  }

  function closeCustomizer() {
    setCustomizerVisible(false);
    router.setParams({ editor: undefined, step: undefined, section: undefined });
  }

  const businessName = profile?.businessName ?? profile?.name ?? "Seu negócio";
  const customizer = (
    <CatalogCustomizer
      settings={settings}
      businessName={businessName}
      products={customizerProducts}
      services={customizerServices}
      canCustomize={canCustomizeCatalog}
      onRequireEssential={() => showPaywall("catalog", "essential")}
      onClose={closeCustomizer}
    />
  );
  if (customizerVisible && isDesktop) {
    return <View style={{ flex: 1, minHeight: 0 }}>{customizer}</View>;
  }
  const mobileBottomPadding = spacing["2xl"];
  let contentPaddingTop = 58;
  if (referencePwaLayout) contentPaddingTop = 0;
  if (isDesktop) contentPaddingTop = 64;
  let catalogContentWidth: number | "100%" = Math.max(0, viewportWidth - 32);
  if (referencePwaLayout) catalogContentWidth = Math.max(0, viewportWidth - 52);
  if (isDesktop) catalogContentWidth = "100%";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        testID="catalog-scroll-content"
        contentContainerStyle={{
          width: "100%",
          paddingTop: contentPaddingTop,
          paddingBottom: isDesktop ? spacing["4xl"] : mobileBottomPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          testID="catalog-page-content"
          style={{
            width: catalogContentWidth,
            maxWidth: isDesktop ? CATALOG_CONTENT_MAX_WIDTH : undefined,
            alignSelf: "center",
          }}
        >
          <CatalogHero enabled={settings.enabled} illustration={catalogStorefront} />
          <CatalogContentManager
            settings={settings}
            businessName={businessName}
            onShare={() => void handleShare()}
            onPreview={() => void handlePreview()}
            onMore={onOpenMoreMenu}
            onCopy={() => void handleCopy()}
            onCustomize={openCustomizer}
            onActivate={() => void handleToggle(true)}
          />

          {!canShowFullCatalog ? (
            <Card
              padding="lg"
              onPress={() => showPaywall("catalog", "essential")}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.premium,
                marginTop: spacing["2xl"],
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
                <AppIcon name="diamond-outline" size={24} color={theme.colors.premium} />
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">
                    Seu catálogo mostra até 3 produtos
                  </Typography>
                  <Typography variant="caption">
                    Mostre seu catálogo completo e personalize as cores no Essencial.
                  </Typography>
                </View>
                <AppIcon
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
            </Card>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      {customizerVisible ? (
        <Modal
          visible
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeCustomizer}
        >
          <View
            style={[
              { flex: 1, backgroundColor: colors.background },
              Platform.OS === "web"
                ? ({
                    position: "fixed",
                    inset: 0,
                    overflow: "hidden",
                  } as unknown as ViewStyle)
                : { overflow: "hidden" },
            ]}
          >
            {customizer}
            <MobileFloatingTabBar />
          </View>
        </Modal>
      ) : null}

      <Modal
        visible={moreMenuVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={onCloseMoreMenu}
      >
        <Pressable
          onPress={onCloseMoreMenu}
          accessibilityRole="button"
          accessibilityLabel="Fechar mais opções"
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: theme.colors.overlay,
          }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            accessibilityRole="none"
            style={{
              gap: spacing.md,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: theme.colors.surfaceElevated,
              padding: spacing["2xl"],
              paddingBottom: spacing["3xl"],
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Typography variant="h2">Mais opções</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Compartilhe ou altere a disponibilidade da vitrine.
                </Typography>
              </View>
              <IconButton
                size={44}
                onPress={onCloseMoreMenu}
                accessibilityLabel="Fechar mais opções"
                icon={
                  <AppIcon name="close" size={22} color={theme.colors.textSecondary} />
                }
              />
            </View>
            <Button
              title="Compartilhar no WhatsApp"
              variant="success"
              disabled={!settings.enabled}
              icon={
                <AppIcon
                  name="logo-whatsapp"
                  size={20}
                  color={theme.colors.textOnPrimary}
                />
              }
              onPress={() => {
                onCloseMoreMenu();
                void handleWhatsAppShare();
              }}
            />
            <Button
              title="Copiar link"
              variant="outline"
              icon={
                <AppIcon
                  name="clipboard-outline"
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={() => {
                onCloseMoreMenu();
                void handleCopy();
              }}
            />
            <Button
              title={settings.enabled ? "Desativar catálogo" : "Ativar catálogo"}
              variant="outline"
              icon={
                <AppIcon
                  name={settings.enabled ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              }
              onPress={() => {
                onCloseMoreMenu();
                void handleToggle(!settings.enabled);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function CatalogScreen() {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const editorParams = useLocalSearchParams<{ editor?: string }>();
  const editorOpen = editorParams.editor === "1";
  const referencePwaLayout = viewportWidth >= 768 && !isDesktop;
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const { data: settings, isLoading, refetch } = useCatalogSettings();
  const headerStyle: ViewStyle = {
    width: "100%",
    maxWidth: isDesktop ? CATALOG_CONTENT_MAX_WIDTH : undefined,
    alignSelf: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  };
  const headerTitleStyle: TextStyle = {
    color: colors.wine,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    lineHeight: 34,
  };
  const headerSubtitleStyle: TextStyle = {
    color: colors.warmGray,
    fontSize: 14,
    lineHeight: 20,
  };
  let headerMenuSize = 44;
  if (referencePwaLayout) {
    headerStyle.minHeight = 132;
    headerStyle.paddingHorizontal = 30;
    headerStyle.paddingTop = 20;
    headerStyle.paddingBottom = 20;
    headerTitleStyle.fontSize = 40;
    headerTitleStyle.lineHeight = 48;
    headerSubtitleStyle.fontSize = 20;
    headerSubtitleStyle.lineHeight = 28;
    headerMenuSize = 56;
  }

  let content: React.ReactNode;
  if (settings) {
    content = (
      <CatalogForm
        settings={settings}
        moreMenuVisible={moreMenuVisible}
        onOpenMoreMenu={() => setMoreMenuVisible(true)}
        onCloseMoreMenu={() => setMoreMenuVisible(false)}
      />
    );
  } else if (isLoading) {
    content = (
      <View
        style={{ ...pageGutter(isDesktop), paddingVertical: spacing.xl, gap: spacing.lg }}
      >
        <Skeleton width="40%" height={18} />
        <Skeleton height={120} borderRadius={radii.lg} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
        <Skeleton
          width={220}
          height={48}
          borderRadius={radii.md}
          style={{ alignSelf: "flex-end" }}
        />
      </View>
    );
  } else {
    content = (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          ...pageGutter(isDesktop),
          paddingVertical: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <AppIcon name="cloud-offline-outline" size={44} color={theme.colors.alert} />
        <Typography variant="body" style={{ textAlign: "center" }}>
          Não foi possível carregar o catálogo. Verifique sua conexão e tente de novo.
        </Typography>
        <Button title="Tentar de novo" onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <SafeAreaView
      testID="catalog-page"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {editorOpen ? null : (
        <ScreenHeader
          title="Catálogo"
          subtitle="Sua vitrine pronta para vender."
          hideBack={isDesktop}
          style={headerStyle}
          titleStyle={headerTitleStyle}
          subtitleStyle={headerSubtitleStyle}
          right={
            settings ? (
              <IconButton
                size={headerMenuSize}
                style={{
                  borderRadius: 14,
                  borderColor: colors.border,
                  backgroundColor: colors.white,
                }}
                onPress={() => setMoreMenuVisible(true)}
                accessibilityLabel="Mais opções do catálogo"
                icon={
                  <AppIcon name="ellipsis-vertical" size={22} color={theme.colors.text} />
                }
              />
            ) : null
          }
        />
      )}
      {content}
    </SafeAreaView>
  );
}
