import type {
  CatalogAccentColorValue,
  CatalogSettings,
  Product,
  Service,
} from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import type { AppIconName } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Share,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trackAnalyticsAction } from "../features/analytics/tracker";
import { publicCatalogSectionUrl, publicCatalogUrl } from "../features/catalog/api";
import { ColorPickerModal } from "../shared/components/color-picker-modal";
import { HeroPreview } from "../features/catalog/components/hero-preview";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { useCatalogSettings, useUpdateCatalogSettings } from "../features/catalog/hooks";
import { useProfile } from "../features/subscription/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { useAuth } from "../shared/hooks/use-auth";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ApiError } from "../shared/utils/api-client";
import { openWhatsAppShare } from "../shared/utils/whatsapp";
import { showToast } from "../shared/components/toast";
import { uploadCatalogCover, uploadCatalogLogo } from "../shared/utils/upload-image";
import { alertError } from "../shared/utils/alerts";
import catalogStorefront from "../assets/catalog-hero.png";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import {
  desktopAction,
  desktopCompactField,
  desktopSplitLayout,
  desktopStretch,
  pageGutter,
} from "../shared/layout/desktop-density";
import { ScreenHeader } from "../shared/components/screen-header";
import { useBusinessCopy } from "../features/subscription/business-copy";
import { useAllProducts, useUpdateProduct } from "../features/products/hooks";
import { useServices, useUpdateService } from "../features/services/hooks";
import { formatCurrency } from "../shared/utils/format";

// Mesmas chaves/cores dos presets do backend (CATALOG_ACCENT_PRESETS).
const ACCENT_SWATCHES: { key: CatalogAccentColorValue; color: string; label: string }[] =
  [
    { key: "brown", color: "#8c5a45", label: "Marrom" },
    { key: "rose", color: "#B65F72", label: "Rosa" },
    { key: "green", color: "#447a55", label: "Verde" },
    { key: "lavender", color: "#7a64b0", label: "Lilás" },
    { key: "blue", color: "#3f74a0", label: "Azul" },
    { key: "amber", color: "#b3852f", label: "Dourado" },
  ];

const INTRO_BENEFITS: {
  icon: AppIconName;
  title: string;
  desc: string;
}[] = [
  {
    icon: "sparkles-outline",
    title: "Página linda e pronta",
    desc: "Seus produtos com foto, descrição e preço.",
  },
  {
    icon: "share-social-outline",
    title: "Um link só seu",
    desc: "Compartilhe no Instagram, no status e em grupos.",
  },
  {
    icon: "logo-whatsapp",
    title: "Pedidos no WhatsApp",
    desc: "O cliente escolhe e já chama você direto.",
  },
];

/** Estado inicial (catálogo desativado): foca em explicar o valor e ativar. */
function CatalogIntro({
  onActivate,
  pending,
}: Readonly<{ onActivate: () => void; pending: boolean }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  return (
    <View style={{ gap: spacing["5xl"] }}>
      <Card padding="lg">
        <View style={{ gap: spacing.lg }}>
          {INTRO_BENEFITS.map((b) => (
            <View
              key={b.title}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name={b.icon} size={22} color={theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">{b.title}</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {b.desc}
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </Card>
      <View style={{ gap: spacing.sm }}>
        <Button
          title="Ativar meu catálogo"
          size="lg"
          onPress={onActivate}
          loading={pending}
          icon={
            <AppIcon name="rocket-outline" size={20} color={theme.colors.textOnPrimary} />
          }
          accessibilityLabel="Ativar meu catálogo"
          style={{
            alignSelf: isDesktop ? undefined : "stretch",
            minHeight: 56,
            ...desktopAction(isDesktop, 240),
          }}
        />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center" }}
        >
          É grátis. Você personaliza tudo depois.
        </Typography>
      </View>
    </View>
  );
}

/** Teaser de personalização: mostra o que o Essencial libera sem expor controles. */
function AppearanceEssentialTeaser({ onUnlock }: Readonly<{ onUnlock: () => void }>) {
  const { theme } = useTheme();
  const perks = ["Foto de capa e logo", "Cores do seu jeito", "Frase de apresentação"];
  return (
    <View style={{ gap: spacing.md }}>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Deixe o catálogo com a sua cara:
      </Typography>
      {perks.map((perk) => (
        <View
          key={perk}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <AppIcon name="checkmark-circle" size={18} color={theme.colors.premium} />
          <Typography variant="body" style={{ flex: 1 }}>
            {perk}
          </Typography>
        </View>
      ))}
      <Button
        title="Desbloquear no Essencial"
        variant="premium"
        onPress={onUnlock}
        accessibilityLabel="Desbloquear personalização com o Essencial"
        icon={<AppIcon name="diamond" size={18} color={theme.colors.textOnPrimary} />}
        style={{ alignSelf: "center", marginTop: spacing.xs }}
      />
    </View>
  );
}

type CatalogContentTab = "products" | "services";
type CatalogAppearanceSection = "products" | "services";

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
  return (
    <Card padding="md">
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: 52,
              height: 52,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.surface,
            }}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radii.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <AppIcon name={icon} size={23} color={theme.colors.primaryStrong} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="bodyBold" numberOfLines={1}>
            {title}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {pending ? "Salvando visibilidade..." : description}
          </Typography>
        </View>
        <Switch
          value={enabled}
          disabled={disabled || pending}
          onValueChange={onChange}
          trackColor={{ true: theme.colors.primary }}
          accessibilityLabel={`${enabled ? "Ocultar" : "Exibir"} ${title} no catálogo`}
        />
      </View>
    </Card>
  );
}

function CatalogContentManager({ slug }: Readonly<{ slug: string }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [tab, setTab] = useState<CatalogContentTab>("products");
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
  const sectionUrl = publicCatalogSectionUrl(
    slug,
    isProductsTab ? "produtos" : "servicos",
  );
  const sectionCount = isProductsTab ? visibleProducts : visibleServices;
  const sectionShareMessage = isProductsTab
    ? `Oi! 😊 Veja meus produtos e faça seu pedido por aqui:\n\n${sectionUrl}`
    : `Oi! 😊 Veja meus serviços e solicite seu horário por aqui:\n\n${sectionUrl}`;

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

  async function previewSection() {
    await Linking.openURL(sectionUrl);
  }

  async function shareSection() {
    if (await openWhatsAppShare(sectionShareMessage)) {
      void trackAnalyticsAction("catalog_shared", useAuth.getState().token);
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
      <View style={{ gap: spacing.sm }}>
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
    content = (
      <View style={{ gap: spacing.sm }}>
        {products.map((product) => (
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
    content = (
      <View style={{ gap: spacing.sm }}>
        {services.map((service) => (
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

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h3">Conteúdo da vitrine</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Escolha o que seus clientes encontram no mesmo catálogo online.
        </Typography>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Chip
          label={`Produtos · ${visibleProducts}`}
          selected={tab === "products"}
          onPress={() => setTab("products")}
        />
        <Chip
          label={`Serviços · ${visibleServices}`}
          selected={tab === "services"}
          onPress={() => setTab("services")}
        />
      </View>
      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: spacing.sm }}>
        <Button
          title={`Ver ${sectionLabel}`}
          variant="secondary"
          disabled={sectionCount === 0}
          icon={
            <AppIcon name="eye-outline" size={20} color={theme.colors.primaryStrong} />
          }
          onPress={() => void previewSection()}
          style={desktopAction(isDesktop, 180)}
        />
        <Button
          title={`Compartilhar ${sectionLabel}`}
          variant="success"
          disabled={sectionCount === 0}
          icon={
            <AppIcon name="logo-whatsapp" size={20} color={theme.colors.textOnPrimary} />
          }
          onPress={() => void shareSection()}
          style={desktopAction(isDesktop, 230)}
        />
      </View>

      {content}
    </View>
  );
}

function CatalogForm({ settings }: Readonly<{ settings: CatalogSettings }>) {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();
  const update = useUpdateCatalogSettings();
  const [slug, setSlug] = useState(settings.slug);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ?? "");
  const [tagline, setTagline] = useState(settings.tagline ?? "");
  const [promo, setPromo] = useState(settings.promoBanner ?? "");
  const [serviceTagline, setServiceTagline] = useState(settings.serviceTagline ?? "");
  const [servicePromo, setServicePromo] = useState(settings.servicePromoBanner ?? "");
  const [appearanceSection, setAppearanceSection] =
    useState<CatalogAppearanceSection>("products");
  const [accentColor, setAccentColor] = useState<CatalogAccentColorValue | null>(
    settings.accentColor,
  );
  const isCustomColor = !!accentColor && accentColor.startsWith("#");
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Previa local imediata apos escolher a imagem (enquanto o upload/salvar roda).
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [serviceCoverPreview, setServiceCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const { pickFromGallery } = useImagePicker();
  const canShowFullCatalog =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "catalogPremium");
  const canCustomizeCatalog =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "catalogCustomization");
  const customCircleBorderColor = isCustomColor ? theme.colors.text : theme.colors.border;
  const resolvedBaseColor = isCustomColor
    ? accentColor
    : (ACCENT_SWATCHES.find((sw) => sw.key === (accentColor ?? "brown"))?.color ??
      "#8c5a45");

  useEffect(() => {
    setSlug(settings.slug);
    setWhatsapp(settings.whatsapp ?? "");
    setTagline(settings.tagline ?? "");
    setPromo(settings.promoBanner ?? "");
    setServiceTagline(settings.serviceTagline ?? "");
    setServicePromo(settings.servicePromoBanner ?? "");
    setAccentColor(settings.accentColor);
  }, [
    settings.slug,
    settings.whatsapp,
    settings.tagline,
    settings.promoBanner,
    settings.serviceTagline,
    settings.servicePromoBanner,
    settings.accentColor,
  ]);

  const isServiceAppearance = appearanceSection === "services";
  const appearanceCoverUrl = isServiceAppearance
    ? (serviceCoverPreview ?? settings.serviceCoverUrl)
    : (coverPreview ?? settings.coverUrl);
  const appearanceTagline = isServiceAppearance ? serviceTagline : tagline;
  const setAppearanceTagline = isServiceAppearance ? setServiceTagline : setTagline;
  const appearancePromo = isServiceAppearance ? servicePromo : promo;
  const setAppearancePromo = isServiceAppearance ? setServicePromo : setPromo;

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

  function requireEssential(): boolean {
    if (canCustomizeCatalog) return false;
    showPaywall("catalog", "essential");
    return true;
  }

  async function handlePickCover() {
    if (requireEssential()) return;
    const uri = await pickFromGallery();
    if (!uri) return;
    const targetSection = appearanceSection;
    if (targetSection === "services") setServiceCoverPreview(uri);
    else setCoverPreview(uri);
    setUploadingCover(true);
    try {
      const coverUrl = await uploadCatalogCover(uri);
      await save(
        targetSection === "services" ? { serviceCoverUrl: coverUrl } : { coverUrl },
      );
      if (targetSection === "services") setServiceCoverPreview(null);
      else setCoverPreview(null);
    } catch {
      if (targetSection === "services") setServiceCoverPreview(null);
      else setCoverPreview(null);
      alertError("Não foi possível enviar a capa. Tente novamente.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleRemoveCover() {
    if (appearanceSection === "services") {
      setServiceCoverPreview(null);
      await save({ serviceCoverUrl: null });
      return;
    }
    setCoverPreview(null);
    await save({ coverUrl: null });
  }

  async function handlePickLogo() {
    if (requireEssential()) return;
    const uri = await pickFromGallery();
    if (!uri) return;
    setLogoPreview(uri);
    setUploadingLogo(true);
    try {
      const logoUrl = await uploadCatalogLogo(uri);
      if (!(await save({ logoUrl }))) setLogoPreview(null);
    } catch {
      alertError("Não foi possível enviar a foto de perfil. Tente novamente.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoPreview(null);
    await save({ logoUrl: null });
  }

  function handlePickColor(color: CatalogAccentColorValue) {
    if (requireEssential()) return;
    setAccentColor(color);
  }

  function handleOpenColorModal() {
    if (requireEssential()) return;
    setColorModalVisible(true);
  }

  function handleConfirmCustomColor(hex: string) {
    setColorModalVisible(false);
    setAccentColor(hex);
  }

  async function handleToggle(enabled: boolean) {
    await save({ enabled });
  }

  async function handleSave() {
    const normalizedSlug = slug.trim().toLowerCase();
    const normalizedWhatsapp = whatsapp.trim() || null;
    const basicSettings = await save({
      slug: normalizedSlug,
      whatsapp: normalizedWhatsapp,
    });
    if (!basicSettings) return;

    if (
      basicSettings.slug !== normalizedSlug ||
      basicSettings.whatsapp !== normalizedWhatsapp
    ) {
      alertError("A API não confirmou o endereço e o WhatsApp. Tente novamente.");
      return;
    }

    if (canCustomizeCatalog) {
      const normalizedTagline = tagline.trim() || null;
      const normalizedPromo = promo.trim() || null;
      const normalizedServiceTagline = serviceTagline.trim() || null;
      const normalizedServicePromo = servicePromo.trim() || null;
      const customizedSettings = await save({
        accentColor,
        pattern: null,
        tagline: normalizedTagline,
        promoBanner: normalizedPromo,
        serviceTagline: normalizedServiceTagline,
        servicePromoBanner: normalizedServicePromo,
      });
      if (!customizedSettings) return;

      if (
        customizedSettings.accentColor !== accentColor ||
        customizedSettings.pattern !== null ||
        customizedSettings.tagline !== normalizedTagline ||
        customizedSettings.promoBanner !== normalizedPromo ||
        customizedSettings.serviceTagline !== normalizedServiceTagline ||
        customizedSettings.servicePromoBanner !== normalizedServicePromo
      ) {
        alertError("A API não confirmou as personalizações. Tente novamente.");
        return;
      }
    }

    showToast("Configurações salvas!");
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

  const heroBg = theme.colors.surfaceElevated;
  const split = desktopSplitLayout(isDesktop);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        {
          ...pageGutter(isDesktop),
          paddingTop: spacing.xl,
          paddingBottom: spacing["4xl"],
          gap: spacing.lg,
        },
        desktopStretch(isDesktop),
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View
        style={{
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.lg,
        }}
      >
        <Image
          source={catalogStorefront}
          resizeMode="contain"
          style={{ width: 300, height: 200 }}
        />
        <Typography variant="h1" style={{ marginTop: spacing.sm }}>
          Sua vitrine online
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center", paddingHorizontal: spacing.lg }}
        >
          Uma página linda com seus produtos e serviços. Compartilhe o link e receba
          pedidos direto no WhatsApp.
        </Typography>
        <Badge
          label={settings.enabled ? "✓ Catálogo no ar" : "Catálogo desativado"}
          variant={settings.enabled ? "success" : "danger"}
          style={{ alignSelf: "center" }}
        />
      </View>

      {!settings.enabled && (
        <CatalogIntro
          onActivate={() => void handleToggle(true)}
          pending={update.isPending}
        />
      )}

      {settings.enabled && (
        <View style={canCustomizeCatalog && isDesktop ? split.row : undefined}>
          <View
            style={canCustomizeCatalog && isDesktop ? split.main : { gap: spacing.lg }}
          >
            {/* Link compartilhável */}
            {settings.enabled && (
              <Card padding="lg" style={{ backgroundColor: heroBg }}>
                <View style={{ gap: spacing.md }}>
                  <Typography variant="label">SEU LINK</Typography>
                  <Pressable
                    onPress={() => void handleShare()}
                    accessibilityRole="button"
                    accessibilityLabel="Compartilhar link do catálogo"
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: radii.xl,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.lg,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <AppIcon
                      name="link-outline"
                      size={20}
                      color={theme.colors.primaryStrong}
                    />
                    <Typography
                      variant="caption"
                      style={{ flex: 1 }}
                      numberOfLines={1}
                      color={theme.colors.text}
                    >
                      {url.replace(/^https?:\/\//, "")}
                    </Typography>
                    <AppIcon
                      name="share-social-outline"
                      size={20}
                      color={theme.colors.primaryStrong}
                    />
                  </Pressable>
                  <View
                    style={{
                      flexDirection: isDesktop ? "row" : "column",
                      gap: spacing.sm,
                    }}
                  >
                    <Button
                      title="Ver vitrine"
                      variant="secondary"
                      icon={
                        <AppIcon
                          name="globe-outline"
                          size={20}
                          color={theme.colors.primaryStrong}
                        />
                      }
                      onPress={() => void handlePreview()}
                      style={desktopAction(isDesktop, 160)}
                    />
                    <Button
                      title="Compartilhar no WhatsApp"
                      variant="success"
                      icon={
                        <AppIcon
                          name="logo-whatsapp"
                          size={20}
                          color={theme.colors.textOnPrimary}
                        />
                      }
                      onPress={() => void handleWhatsAppShare()}
                      style={desktopAction(isDesktop, 240)}
                    />
                    <Button
                      title="Outras opções"
                      variant="outline"
                      icon={
                        <AppIcon
                          name="share-social-outline"
                          size={20}
                          color={theme.colors.primaryStrong}
                        />
                      }
                      onPress={() => void handleShare()}
                      style={desktopAction(isDesktop, 190)}
                    />
                  </View>
                </View>
              </Card>
            )}

            <CatalogContentManager slug={settings.slug} />

            {/* Gatilho de upgrade: free mostra ate 3 produtos no catalogo */}
            {!canShowFullCatalog && (
              <Card
                padding="lg"
                onPress={() => showPaywall("catalog", "essential")}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.premium,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
                >
                  <AppIcon
                    name="diamond-outline"
                    size={24}
                    color={theme.colors.premium}
                  />
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
            )}

            {/* Ativação */}
            <Card padding="lg">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.lg,
                    backgroundColor: settings.enabled
                      ? theme.colors.successBg
                      : theme.colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon
                    name={settings.enabled ? "globe-outline" : "eye-off-outline"}
                    size={22}
                    color={
                      settings.enabled ? theme.colors.success : theme.colors.textSecondary
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="h3">Catálogo ativo</Typography>
                  <Typography variant="caption">
                    {settings.enabled
                      ? "Qualquer pessoa com o link pode ver os itens publicados."
                      : "Ative para compartilhar com seus clientes."}
                  </Typography>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={(value) => void handleToggle(value)}
                  trackColor={{ true: theme.colors.primary }}
                  accessibilityLabel="Ativar catálogo"
                />
              </View>
            </Card>

            {/* Configurações */}
            <Card padding="lg">
              <View style={{ gap: spacing.md }}>
                <Typography variant="label">PERSONALIZAR</Typography>
                <Input
                  label="Endereço do catálogo"
                  value={slug}
                  onChangeText={setSlug}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="meu-negocio"
                />
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Só letras minúsculas, números e hífens.
                </Typography>
                <Input
                  label="WhatsApp para pedidos"
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  keyboardType="phone-pad"
                  placeholder="11 99999-8888"
                />
              </View>
            </Card>

            {/* Aparência (Essencial) */}
            <Card padding="lg">
              <View style={{ gap: spacing.md }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
                >
                  <Typography variant="label" style={{ flex: 1 }}>
                    APARÊNCIA
                  </Typography>
                  {!canCustomizeCatalog && <Badge label="Essencial" variant="premium" />}
                </View>

                {!canCustomizeCatalog ? (
                  <AppearanceEssentialTeaser
                    onUnlock={() => showPaywall("catalog", "essential")}
                  />
                ) : (
                  <>
                    <View style={{ gap: spacing.sm }}>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Personalizar o topo de
                      </Typography>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: spacing.sm,
                        }}
                      >
                        <Chip
                          label="Produtos"
                          selected={appearanceSection === "products"}
                          onPress={() => setAppearanceSection("products")}
                        />
                        <Chip
                          label="Serviços"
                          selected={appearanceSection === "services"}
                          onPress={() => setAppearanceSection("services")}
                        />
                      </View>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Capa, frase e promoção são próprias de cada vitrine. Foto de
                        perfil e cor continuam compartilhadas.
                      </Typography>
                    </View>

                    {/* Capa */}
                    <View
                      style={[
                        desktopStretch(isDesktop, 480),
                        isDesktop ? { alignSelf: "flex-start" } : undefined,
                      ]}
                    >
                      <Pressable
                        onPress={() => void handlePickCover()}
                        accessibilityRole="button"
                        accessibilityLabel={`Foto de capa da vitrine de ${
                          isServiceAppearance ? "serviços" : "produtos"
                        }`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                      >
                        {appearanceCoverUrl ? (
                          <Image
                            source={{ uri: appearanceCoverUrl }}
                            style={{
                              width: "100%",
                              height: 120,
                              borderRadius: radii.xl,
                              backgroundColor: theme.colors.surface,
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              height: 120,
                              borderRadius: radii.xl,
                              borderWidth: 1.5,
                              borderStyle: "dashed",
                              borderColor: theme.colors.primaryLight,
                              backgroundColor: theme.colors.primaryBg,
                              alignItems: "center",
                              justifyContent: "center",
                              gap: spacing.xs,
                            }}
                          >
                            {uploadingCover ? (
                              <ActivityIndicator color={theme.colors.primary} />
                            ) : (
                              <>
                                <AppIcon
                                  name="image-outline"
                                  size={28}
                                  color={theme.colors.primaryLight}
                                />
                                <Typography variant="caption">
                                  Adicionar foto de fundo do topo
                                </Typography>
                              </>
                            )}
                          </View>
                        )}
                      </Pressable>
                      {appearanceCoverUrl && (
                        <Pressable
                          onPress={() => void handleRemoveCover()}
                          accessibilityRole="button"
                        >
                          <Typography variant="caption" color={theme.colors.alert}>
                            Remover capa
                          </Typography>
                        </Pressable>
                      )}
                    </View>

                    {/* Foto de perfil / logo */}
                    <Typography variant="label">IDENTIDADE COMPARTILHADA</Typography>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Foto de perfil (aparece no topo do catálogo)
                    </Typography>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <Pressable
                        onPress={() => void handlePickLogo()}
                        accessibilityRole="button"
                        accessibilityLabel="Foto de perfil do catálogo"
                        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                      >
                        {(settings.logoUrl ?? logoPreview) ? (
                          <Image
                            source={{ uri: settings.logoUrl ?? logoPreview! }}
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: radii.full,
                              backgroundColor: theme.colors.surface,
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: radii.full,
                              borderWidth: 1.5,
                              borderStyle: "dashed",
                              borderColor: theme.colors.primaryLight,
                              backgroundColor: theme.colors.primaryBg,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {uploadingLogo ? (
                              <ActivityIndicator color={theme.colors.primary} />
                            ) : (
                              <AppIcon
                                name="person-circle-outline"
                                size={32}
                                color={theme.colors.primaryLight}
                              />
                            )}
                          </View>
                        )}
                      </Pressable>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Typography variant="caption">
                          {settings.logoUrl
                            ? "Toque na foto para trocar."
                            : "Toque para adicionar sua logo ou uma foto sua."}
                        </Typography>
                        {settings.logoUrl && (
                          <Pressable
                            onPress={() => void handleRemoveLogo()}
                            accessibilityRole="button"
                          >
                            <Typography variant="caption" color={theme.colors.alert}>
                              Remover foto de perfil
                            </Typography>
                          </Pressable>
                        )}
                      </View>
                    </View>

                    {/* Cor do tema */}
                    <View style={desktopCompactField(isDesktop)}>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Cor do catálogo
                      </Typography>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: spacing.md,
                          flexWrap: "wrap",
                        }}
                      >
                        {ACCENT_SWATCHES.map((swatch) => {
                          const selected = (accentColor ?? "brown") === swatch.key;
                          return (
                            <Pressable
                              key={swatch.key}
                              onPress={() => handlePickColor(swatch.key)}
                              accessibilityRole="button"
                              accessibilityLabel={`Cor ${swatch.label}`}
                              style={{ alignItems: "center", gap: spacing.xs }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: radii.full,
                                  backgroundColor: swatch.color,
                                  borderWidth: selected ? 3 : 0,
                                  borderColor: theme.colors.text,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {selected && (
                                  <AppIcon name="checkmark" size={20} color="#fff" />
                                )}
                              </View>
                              <Typography variant="caption">{swatch.label}</Typography>
                            </Pressable>
                          );
                        })}

                        {/* Cor personalizada: bolinha "+" abre o seletor de cores */}
                        <Pressable
                          onPress={handleOpenColorModal}
                          accessibilityRole="button"
                          accessibilityLabel="Escolher cor personalizada"
                          style={{ alignItems: "center", gap: spacing.xs }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: radii.full,
                              backgroundColor: isCustomColor
                                ? accentColor
                                : theme.colors.surface,
                              borderWidth: isCustomColor ? 3 : 1.5,
                              borderStyle: isCustomColor ? "solid" : "dashed",
                              borderColor: customCircleBorderColor,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <AppIcon
                              name={isCustomColor ? "checkmark" : "add"}
                              size={22}
                              color={isCustomColor ? "#fff" : theme.colors.textSecondary}
                            />
                          </View>
                          <Typography variant="caption">
                            {isCustomColor ? "Sua cor" : "Outra"}
                          </Typography>
                        </Pressable>
                      </View>
                    </View>

                    {!isDesktop ? (
                      <>
                        <Typography variant="caption" color={theme.colors.textSecondary}>
                          Prévia do topo do catálogo
                        </Typography>
                        <HeroPreview
                          baseColor={resolvedBaseColor}
                          businessName={
                            profile?.businessName ?? profile?.name ?? "Seu negócio"
                          }
                          tagline={appearanceTagline}
                        />
                      </>
                    ) : null}

                    <ColorPickerModal
                      visible={colorModalVisible}
                      initialColor={isCustomColor ? accentColor : "#8c5a45"}
                      onConfirm={handleConfirmCustomColor}
                      onCancel={() => setColorModalVisible(false)}
                    />

                    {/* Frase de apresentação */}
                    <Input
                      label={`Frase de apresentação de ${
                        isServiceAppearance ? "serviços" : "produtos"
                      }`}
                      value={appearanceTagline}
                      onChangeText={setAppearanceTagline}
                      placeholder={
                        isServiceAppearance
                          ? "Atendimento feito para você"
                          : `Conheça meus ${experienceCopy.productNounPlural}`
                      }
                      maxLength={120}
                    />

                    {/* Faixa promocional (topo do catálogo) */}
                    <Input
                      label={`Faixa promocional de ${
                        isServiceAppearance ? "serviços" : "produtos"
                      }`}
                      value={appearancePromo}
                      onChangeText={setAppearancePromo}
                      placeholder={
                        isServiceAppearance
                          ? "Agenda aberta para este mês"
                          : "Frete grátis hoje 🚚"
                      }
                      maxLength={60}
                    />
                  </>
                )}
              </View>
            </Card>

            {/* Salvar geral (endereco, whatsapp e frase) */}
            <Button
              title={update.isPending ? "Salvando..." : "Salvar"}
              variant="outline"
              onPress={() => void handleSave()}
              disabled={update.isPending}
              style={desktopAction(isDesktop, 220)}
            />
          </View>

          {canCustomizeCatalog && isDesktop ? (
            <View style={split.aside}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Prévia do topo do catálogo
              </Typography>
              <HeroPreview
                baseColor={resolvedBaseColor}
                businessName={profile?.businessName ?? profile?.name ?? "Seu negócio"}
                tagline={appearanceTagline}
              />
            </View>
          ) : null}
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}

export default function CatalogScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: settings, isLoading, refetch } = useCatalogSettings();

  let content: React.ReactNode;
  if (settings) {
    content = <CatalogForm settings={settings} />;
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
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Catálogo" hideBack={isDesktop} />
      {content}
    </SafeAreaView>
  );
}
