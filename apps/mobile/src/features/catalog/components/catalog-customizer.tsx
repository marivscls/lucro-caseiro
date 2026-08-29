/* eslint-disable sonarjs/no-nested-conditional, sonarjs/no-nested-functions */
import type { Product, Service } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  IconButton,
  Input,
  Typography,
  fonts,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  View,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  desktopAction,
  desktopSplitLayout,
} from "../../../shared/layout/desktop-density";
import {
  floatingTabBarReserve,
  mobileTabBarSafeInset,
} from "../../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { SvgXml } from "react-native-svg";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { ColorPickerModal } from "../../../shared/components/color-picker-modal";
import { showToast } from "../../../shared/components/toast";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { useAuth } from "../../../shared/hooks/use-auth";
import { buildQrSvg } from "../../labels/qr";
import { ApiError } from "../../../shared/utils/api-client";
import {
  uploadCatalogCover,
  uploadCatalogLogo,
} from "../../../shared/utils/upload-image";
import { fetchStorefrontPreviewHtml, publicCatalogUrl } from "../api";
import {
  STOREFRONT_ACTION_LABEL_LIMIT,
  STOREFRONT_BRAND_COLORS,
  STOREFRONT_DISPLAY_NAME_LIMIT,
  STOREFRONT_INTRODUCTION_LIMIT,
  STOREFRONT_PROMO_LIMIT,
  buildStorefrontChecklist,
  catalogImageValidationError,
  createFeaturedItemTransforms,
  createStorefrontCustomization,
  displayCatalogItemName,
  formatCatalogWhatsapp,
  hasStorefrontErrors,
  isLocalCatalogImage,
  isStorefrontDraftDirty,
  normalizeStorefrontCustomization,
  resolveFeaturedVisual,
  validateStorefrontCustomization,
  type EditorStatus,
  type StorefrontEditorStep,
} from "../catalog-customizer";
import { useCatalogSlugAvailability, useUpdateCatalogSettings } from "../hooks";
import {
  StorefrontFinalPreview,
  StorefrontHeroPreview,
  StorefrontIdentityPreview,
} from "./storefront-preview";

const MAX_WIDTH = 980;
const CatalogSwitch = Switch as React.ComponentType<
  React.ComponentProps<typeof Switch> & Readonly<{ activeThumbColor?: string }>
>;

type CatalogCustomizerProps = Readonly<{
  settings: Parameters<typeof createStorefrontCustomization>[0];
  businessName: string;
  products: Product[];
  services: Service[];
  canCustomize: boolean;
  onRequireEssential: () => void;
  onClose: () => void;
}>;

type ColorTarget = "actionColor" | null;

function SectionHeading({
  title,
  description,
}: Readonly<{ title: string; description?: string }>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={{ gap: 3 }}>
      <Typography
        style={{
          color: colors.ink,
          fontFamily: fonts.extraBold,
          fontSize: 20,
          lineHeight: 26,
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography style={{ color: colors.warmGray, fontSize: 13, lineHeight: 19 }}>
          {description}
        </Typography>
      ) : null}
    </View>
  );
}

function EditorCard({
  children,
  style,
}: React.PropsWithChildren<Readonly<{ style?: ViewStyle }>>) {
  const colors = useBrandScreenPalette();
  const cardStyle: ViewStyle = {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 16,
    ...style,
  };
  return (
    <Card padding="lg" style={cardStyle}>
      {children}
    </Card>
  );
}

function FieldHint({ value, limit }: Readonly<{ value: string; limit: number }>) {
  const colors = useBrandScreenPalette();
  return (
    <Typography style={{ color: colors.warmGray, fontSize: 11, textAlign: "right" }}>
      {value.length} de {limit} caracteres
    </Typography>
  );
}

function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: Readonly<{
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      style={{ minHeight: 50, flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Typography
          style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
        >
          {label}
        </Typography>
        {description ? (
          <Typography style={{ color: colors.warmGray, fontSize: 11, lineHeight: 16 }}>
            {description}
          </Typography>
        ) : null}
      </View>
      <View pointerEvents="none">
        <CatalogSwitch
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.rose }}
          thumbColor={colors.onWine}
          activeThumbColor={colors.onWine}
        />
      </View>
    </Pressable>
  );
}

function ColorField({
  label,
  value,
  error,
  stacked = false,
  onTextChange,
  onOpen,
}: Readonly<{
  label: string;
  value: string;
  error?: string;
  stacked?: boolean;
  onTextChange: (value: string) => void;
  onOpen: () => void;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        flex: stacked ? undefined : 1,
        width: stacked ? "100%" : undefined,
        minWidth: stacked ? 0 : 180,
        gap: 8,
      }}
    >
      <Typography style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 12 }}>
        {label}
      </Typography>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Escolher ${label}`}
          onPress={onOpen}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: /^#[0-9a-f]{6}$/i.test(value) ? value : colors.neutral,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        <Input
          value={value}
          onChangeText={onTextChange}
          autoCapitalize="characters"
          maxLength={7}
          error={error}
          containerStyle={{ flex: 1, minWidth: 0 }}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

function StepNavigation({
  step,
  onNavigate,
}: Readonly<{
  step: StorefrontEditorStep;
  onNavigate: (step: StorefrontEditorStep) => void;
}>) {
  const colors = useBrandScreenPalette();
  const steps: ReadonlyArray<{
    id: StorefrontEditorStep;
    label: string;
    number: number;
  }> = [
    { id: "identity", label: "Identidade", number: 1 },
    { id: "hero", label: "Topo da vitrine", number: 2 },
    { id: "organization", label: "Publicação", number: 3 },
  ];
  return (
    <View style={{ gap: 8, paddingBottom: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
        }}
      >
        {steps.map((item, index) => {
          const active = item.id === step;
          const complete =
            steps.findIndex((candidate) => candidate.id === step) > item.number - 1;
          return (
            <React.Fragment key={item.id}>
              {index > 0 ? (
                <View
                  style={{
                    width: 1,
                    height: 22,
                    backgroundColor: colors.border,
                    marginHorizontal: 4,
                  }}
                />
              ) : null}
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                onPress={() => onNavigate(item.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      active || complete ? colors.wineFill : colors.surface,
                    borderWidth: active || complete ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  {complete ? (
                    <AppIcon name="checkmark" size={13} color={colors.onWine} />
                  ) : (
                    <Typography
                      style={{
                        color: active ? colors.onWine : colors.warmGray,
                        fontFamily: fonts.bold,
                        fontSize: 11,
                      }}
                    >
                      {item.number}
                    </Typography>
                  )}
                </View>
                <Typography
                  style={{
                    color: active ? colors.wine : colors.warmGray,
                    fontFamily: active ? fonts.bold : fonts.medium,
                    fontSize: 11,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Typography>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

function UploadButton({
  title,
  image,
  onPress,
  onRemove,
  loading,
}: Readonly<{
  title: string;
  image: string | null;
  onPress: () => void;
  onRemove?: () => void;
  loading?: boolean;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 999,
          backgroundColor: colors.softRose,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <AppIcon name="image-outline" size={30} color={colors.wine} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 180, gap: 7 }}>
        <Typography style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }}>
          {title}
        </Typography>
        <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
          PNG ou JPG • até 5 MB
        </Typography>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button
            title={image ? "Trocar" : "Selecionar"}
            variant="outline"
            compact
            loading={loading}
            onPress={onPress}
          />
          {image && onRemove ? (
            <Button title="Remover" variant="text" compact onPress={onRemove} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function FeaturedPicker({
  visible,
  products,
  services,
  selectedIds,
  onClose,
  onAddProduct,
  onAddService,
  onAddMedia,
}: Readonly<{
  visible: boolean;
  products: Product[];
  services: Service[];
  selectedIds: Set<string>;
  onClose: () => void;
  onAddProduct: (item: Product) => void;
  onAddService: (item: Service) => void;
  onAddMedia: () => void;
}>) {
  const colors = useBrandScreenPalette();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const productItems = products.filter(
    (item) =>
      item.isActive &&
      item.publicEnabled &&
      displayCatalogItemName(item.name).toLocaleLowerCase("pt-BR").includes(normalized),
  );
  const serviceItems = services.filter(
    (item) =>
      item.active &&
      item.publicEnabled &&
      displayCatalogItemName(item.name).toLocaleLowerCase("pt-BR").includes(normalized),
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            maxHeight: "86%",
            borderRadius: 22,
            backgroundColor: colors.white,
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <SectionHeading
              title="Selecionar destaques"
              description="Escolha produtos, serviços ou uma imagem. Limite de três."
            />
            <View style={{ flex: 1 }} />
            <IconButton
              accessibilityLabel="Fechar seletor"
              onPress={onClose}
              icon={<AppIcon name="close" size={21} color={colors.ink} />}
            />
          </View>
          <Input
            placeholder="Buscar por nome"
            value={query}
            onChangeText={setQuery}
            icon={<AppIcon name="search-outline" size={18} color={colors.warmGray} />}
          />
          <Button
            title="Enviar imagem"
            variant="outline"
            onPress={onAddMedia}
            icon={<AppIcon name="image-outline" size={18} color={colors.rose} />}
          />
          <ScrollView contentContainerStyle={{ gap: 9 }}>
            {[
              ...productItems.map((item) => ({ kind: "product" as const, item })),
              ...serviceItems.map((item) => ({ kind: "service" as const, item })),
            ].map(({ kind, item }) => {
              const key = `${kind}:${item.id}`;
              const selected = selectedIds.has(key);
              const product = kind === "product" ? item : null;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  disabled={selected}
                  onPress={() =>
                    kind === "product" ? onAddProduct(item) : onAddService(item)
                  }
                  style={{
                    minHeight: 66,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? colors.rose : colors.border,
                    padding: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    opacity: selected ? 0.65 : 1,
                  }}
                >
                  {product?.photoUrl ? (
                    <Image
                      source={{ uri: product.photoUrl }}
                      style={{ width: 46, height: 46, borderRadius: 10 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 10,
                        backgroundColor: colors.softRose,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon
                        name={
                          kind === "product" ? "bag-handle-outline" : "person-outline"
                        }
                        size={22}
                        color={colors.wine}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Typography
                      style={{
                        color: colors.ink,
                        fontFamily: fonts.semiBold,
                        fontSize: 13,
                      }}
                    >
                      {displayCatalogItemName(item.name)}
                    </Typography>
                    <Typography style={{ color: colors.warmGray, fontSize: 11 }}>
                      {kind === "product" ? "Produto" : "Serviço"}
                    </Typography>
                  </View>
                  <AppIcon
                    name={selected ? "checkmark-circle" : "add-circle-outline"}
                    size={22}
                    color={colors.rose}
                  />
                </Pressable>
              );
            })}
            {productItems.length + serviceItems.length === 0 ? (
              <Typography
                style={{
                  color: colors.warmGray,
                  textAlign: "center",
                  paddingVertical: 24,
                }}
              >
                Nenhum item real encontrado.
              </Typography>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PreviewModal({
  visible,
  onClose,
  html,
  loading = false,
  source,
  onSourceChange,
  children,
}: React.PropsWithChildren<
  Readonly<{
    visible: boolean;
    onClose: () => void;
    html?: string | null;
    loading?: boolean;
    source: "local" | "published";
    onSourceChange: (source: "local" | "published") => void;
  }>
>) {
  const colors = useBrandScreenPalette();
  const isDesktop = useDesktopLayout();
  const allowPublished = Platform.OS === "web";
  const showIframe = allowPublished && source === "published" && Boolean(html);
  const showSpinner = allowPublished && source === "published" && loading && !html;
  const previewBody = showIframe ? (
    React.createElement("iframe", {
      srcDoc: html,
      title: "Prévia da vitrine publicada",
      sandbox: "allow-scripts allow-forms allow-popups allow-modals",
      style: { flex: 1, width: "100%", border: 0, background: colors.background },
    })
  ) : showSpinner ? (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.rose} />
      <Typography style={{ marginTop: 12, color: colors.warmGray }}>
        Abrindo a página publicada…
      </Typography>
    </View>
  ) : (
    <ScrollView
      contentContainerStyle={{
        width: "100%",
        maxWidth: MAX_WIDTH,
        alignSelf: "center",
        padding: 16,
        paddingBottom: 40,
      }}
    >
      {children}
    </ScrollView>
  );
  return (
    <Modal
      visible={visible}
      animationType={isDesktop ? "fade" : "slide"}
      presentationStyle={isDesktop ? "overFullScreen" : "fullScreen"}
      transparent={isDesktop}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDesktop ? colors.overlay : colors.background,
          alignItems: isDesktop ? "center" : "stretch",
          justifyContent: isDesktop ? "center" : "flex-start",
          padding: isDesktop ? 28 : 0,
        }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: isDesktop ? 1100 : undefined,
            maxHeight: isDesktop ? "92%" : undefined,
            borderRadius: isDesktop ? 24 : 0,
            overflow: "hidden",
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              minHeight: 68,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <IconButton
              accessibilityLabel="Fechar prévia"
              onPress={onClose}
              icon={<AppIcon name="close" size={24} color={colors.wine} />}
            />
            <Typography
              style={{
                color: colors.ink,
                fontFamily: fonts.extraBold,
                fontSize: 20,
                marginLeft: 8,
                flex: 1,
              }}
            >
              Prévia da vitrine
            </Typography>
            {allowPublished ? (
              <View style={{ flexDirection: "row", gap: 6 }}>
                {(
                  [
                    ["local", "Rascunho"],
                    ["published", "Página no ar"],
                  ] as const
                ).map(([value, label]) => {
                  const active = source === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => onSourceChange(value)}
                      style={{
                        minHeight: 36,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? colors.rose : colors.border,
                        backgroundColor: active ? colors.softRose : colors.white,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        style={{
                          color: active ? colors.wine : colors.warmGray,
                          fontFamily: fonts.semiBold,
                          fontSize: 12,
                        }}
                      >
                        {label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
          {previewBody}
        </View>
      </View>
    </Modal>
  );
}

export function CatalogCustomizer({
  settings,
  businessName,
  products,
  services,
  canCustomize,
  onRequireEssential,
  onClose,
}: CatalogCustomizerProps) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string; section?: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const update = useUpdateCatalogSettings();
  const { pickFromGalleryAsset } = useImagePicker();
  const counts = useMemo(
    () => ({
      products: products.filter((item) => item.isActive && item.publicEnabled).length,
      services: services.filter((item) => item.active && item.publicEnabled).length,
    }),
    [products, services],
  );
  const initial = useMemo(
    () => createStorefrontCustomization(settings, businessName, counts),
    [settings, businessName, counts],
  );
  const [savedDraft, setSavedDraft] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [requestStatus, setRequestStatus] = useState<EditorStatus>("saved");
  const [colorTarget, setColorTarget] = useState<ColorTarget>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSource, setPreviewSource] = useState<"local" | "published">("local");
  const [featuredPickerVisible, setFeaturedPickerVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [publishedVisible, setPublishedVisible] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [slugToCheck, setSlugToCheck] = useState("");
  const [coverUrl, setCoverUrl] = useState(settings.coverUrl);
  const [savedCoverUrl, setSavedCoverUrl] = useState(settings.coverUrl);
  const selectedFiles = useRef(new Map<string, File>());

  const step: StorefrontEditorStep =
    params.step === "hero" || params.step === "organization" ? params.step : "identity";
  const isPublication = step === "organization";
  const dirty = isStorefrontDraftDirty(draft, savedDraft) || coverUrl !== savedCoverUrl;
  const status: EditorStatus =
    requestStatus === "saved" && dirty ? "dirty" : requestStatus;
  const errors = useMemo(() => validateStorefrontCustomization(draft), [draft]);
  const normalizedSlug = draft.publication.slug.trim().toLowerCase();
  const slugChanged = normalizedSlug !== settings.slug;
  const shouldCheckSlug = slugChanged && !errors.slug && slugToCheck === normalizedSlug;
  const slugAvailability = useCatalogSlugAvailability(slugToCheck, shouldCheckSlug);
  const slugAvailable = !slugChanged || slugAvailability.data?.available === true;
  const checklist = buildStorefrontChecklist(draft, counts, slugAvailable);
  const publishingReady =
    checklist.every((item) => item.valid) &&
    !hasStorefrontErrors(errors) &&
    !slugAvailability.isFetching;
  const wide = width >= 700 || isDesktop;
  const splitDesktop = isDesktop && width >= 1200;
  const split = desktopSplitLayout(splitDesktop);
  const asideWidth = width >= 1440 ? 460 : 400;
  const stackColorFields = width < 520 && !isDesktop;

  useEffect(() => {
    if (!slugChanged || errors.slug) {
      setSlugToCheck("");
      return;
    }
    const timeout = setTimeout(() => setSlugToCheck(normalizedSlug), 450);
    return () => clearTimeout(timeout);
  }, [errors.slug, normalizedSlug, slugChanged]);

  useEffect(() => {
    if (Platform.OS !== "web" || !dirty || typeof window === "undefined") return;
    const listener = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);

  useEffect(
    () => () => {
      if (linkCopiedTimer.current) clearTimeout(linkCopiedTimer.current);
    },
    [],
  );

  function signalLinkCopied() {
    setLinkCopied(true);
    if (linkCopiedTimer.current) clearTimeout(linkCopiedTimer.current);
    linkCopiedTimer.current = setTimeout(() => setLinkCopied(false), 2200);
  }

  function copyCatalogLink() {
    void Clipboard.setStringAsync(publicCatalogUrl(normalizedSlug)).then(
      signalLinkCopied,
    );
  }

  function navigate(nextStep: StorefrontEditorStep) {
    router.setParams({
      editor: "1",
      step: nextStep,
      section: nextStep === "organization" ? "publication" : undefined,
    });
  }

  function requestClose() {
    if (!dirty) {
      onClose();
      return;
    }
    showAlert({
      title: "Descartar alterações?",
      message: "Seu rascunho ainda não foi salvo.",
      buttons: [
        { text: "Continuar editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: onClose },
      ],
    });
  }

  function requireCustomization(): boolean {
    if (canCustomize) return false;
    onRequireEssential();
    return true;
  }

  function openPreview() {
    setPreviewSource("local");
    setPreviewVisible(true);
  }

  async function loadPublishedPreview() {
    if (!token || previewLoading) return;
    setPreviewLoading(true);
    try {
      setPreviewHtml(await fetchStorefrontPreviewHtml(token, draft));
    } catch {
      setPreviewHtml(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function imageSize(uri: string, fallback?: number | null): Promise<number> {
    if (typeof fallback === "number") return fallback;
    const response = await fetch(uri);
    return (await response.blob()).size;
  }

  async function pickImage(target: "logo" | "media" | "cover") {
    if (requireCustomization()) return;
    setImageError(null);
    const asset = await pickFromGalleryAsset({
      allowsEditing: target === "logo",
      aspect: target === "logo" ? [1, 1] : [16, 9],
      quality: 0.84,
    });
    if (!asset) return;
    try {
      const error = catalogImageValidationError({
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        uri: asset.uri,
        fileSize: await imageSize(asset.uri, asset.fileSize),
      });
      if (error) {
        setImageError(error);
        return;
      }
    } catch {
      setImageError("Não foi possível verificar a imagem. Escolha outro arquivo.");
      return;
    }
    if (asset.file) selectedFiles.current.set(asset.uri, asset.file);
    if (target === "logo")
      setDraft((current) => ({
        ...current,
        identity: { ...current.identity, logoUrl: asset.uri },
      }));
    if (target === "cover") setCoverUrl(asset.uri);
    if (target === "media") {
      const id = `media:${Date.now()}`;
      setDraft((current) => ({
        ...current,
        hero: {
          ...current.hero,
          featuredItems: [
            ...current.hero.featuredItems,
            {
              id,
              kind: "media" as const,
              assetUrl: asset.uri,
              altText: asset.fileName?.replace(/\.[^.]+$/, "") || "Imagem de destaque",
              transforms: createFeaturedItemTransforms(id),
            },
          ].slice(0, 3),
        },
      }));
      setFeaturedPickerVisible(false);
    }
  }

  function addFeatured(kind: "product" | "service", item: Product | Service) {
    const id = `${kind}:${item.id}`;
    if (
      draft.hero.featuredItems.length >= 3 ||
      draft.hero.featuredItems.some((entry) => entry.id === id)
    )
      return;
    setDraft((current) => ({
      ...current,
      hero: {
        ...current.hero,
        featuredItems: [
          ...current.hero.featuredItems,
          {
            id,
            kind,
            sourceId: item.id,
            assetUrl: kind === "product" ? (item as Product).photoUrl : null,
            altText: displayCatalogItemName(item.name),
            transforms: createFeaturedItemTransforms(id),
          },
        ],
      },
    }));
    if (draft.hero.featuredItems.length === 2) setFeaturedPickerVisible(false);
  }

  async function uploadLocal(uri: string | null, logo = false): Promise<string | null> {
    if (!isLocalCatalogImage(uri)) return uri;
    const file = selectedFiles.current.get(uri);
    return logo ? uploadCatalogLogo(uri, file) : uploadCatalogCover(uri, file);
  }

  async function persist(publishing: boolean) {
    if (update.isPending) return;
    if (publishing && !publishingReady) {
      setRequestStatus("error");
      showAlert({
        title: "Revise antes de publicar",
        message: "Abra os itens pendentes da revisão final e complete as configurações.",
      });
      return;
    }
    if (!canCustomize) {
      onRequireEssential();
      return;
    }
    setRequestStatus(publishing ? "publishing" : "saving");
    try {
      const logoUrl = await uploadLocal(draft.identity.logoUrl, true);
      const uploadedCoverUrl = await uploadLocal(coverUrl);
      const featuredItems = await Promise.all(
        draft.hero.featuredItems.map(async (item) => ({
          ...item,
          assetUrl: await uploadLocal(item.assetUrl),
          processedUrl: await uploadLocal(item.processedUrl ?? null),
        })),
      );
      const hydrated = {
        ...draft,
        identity: { ...draft.identity, logoUrl },
        hero: { ...draft.hero, featuredItems },
      };
      const normalized = normalizeStorefrontCustomization(hydrated, publishing, counts);
      const whatsapp =
        normalized.organization.contact.destination.replace(/\D/g, "") || null;
      const result = await update.mutateAsync({
        slug: normalized.publication.slug,
        enabled: publishing ? true : settings.enabled,
        whatsapp,
        logoUrl,
        coverUrl: uploadedCoverUrl,
        serviceCoverUrl:
          normalized.identity.offeringMode === "products"
            ? settings.serviceCoverUrl
            : uploadedCoverUrl,
        accentColor: normalized.identity.actionColor,
        tagline: normalized.hero.introduction || null,
        promoBanner: normalized.hero.promotionalText || null,
        promoBannerEnabled: normalized.hero.showPromotionalBar,
        serviceTagline: normalized.hero.introduction || null,
        servicePromoBanner: normalized.hero.promotionalText || null,
        servicePromoBannerEnabled: normalized.hero.showPromotionalBar,
        customization: normalized,
        publishStorefront: publishing,
      });
      if (!result.customization)
        throw new Error("A API ainda não confirmou a nova personalização.");
      selectedFiles.current.clear();
      const confirmed = createStorefrontCustomization(
        result,
        normalized.identity.displayName,
        counts,
      );
      setDraft(confirmed);
      setSavedDraft(confirmed);
      setCoverUrl(result.coverUrl);
      setSavedCoverUrl(result.coverUrl);
      setRequestStatus("saved");
      if (publishing) {
        setPublishedVisible(true);
      } else {
        showToast("Alterações salvas!");
      }
    } catch (error) {
      setRequestStatus("error");
      if (error instanceof ApiError && error.code === "LIMIT_EXCEEDED") {
        onRequireEssential();
        return;
      }
      const message =
        error instanceof ApiError && error.status === 400
          ? error.message
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar. Seu rascunho continua nesta tela.";
      showAlert({
        title: publishing ? "Não foi possível publicar" : "Não foi possível salvar",
        message,
      });
    }
  }

  const previewProps = {
    customization: draft,
    products,
    services,
    status,
    coverUrl,
  };
  let contextualPreview: React.ReactNode = (
    <StorefrontIdentityPreview {...previewProps} />
  );
  if (step === "hero")
    contextualPreview = (
      <StorefrontHeroPreview customization={draft} status={status} coverUrl={coverUrl} />
    );
  if (isPublication) contextualPreview = <StorefrontFinalPreview {...previewProps} />;

  const canSave =
    dirty &&
    !hasStorefrontErrors(errors) &&
    slugAvailable &&
    !slugAvailability.isFetching &&
    !update.isPending;
  const selectedIds = new Set(draft.hero.featuredItems.map((item) => item.id));
  const catalogUrl = publicCatalogUrl(normalizedSlug);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        overflow: "hidden",
        paddingBottom: isDesktop
          ? 0
          : floatingTabBarReserve(mobileTabBarSafeInset(insets.bottom)),
      }}
    >
      <View
        style={{
          paddingTop: isDesktop ? 8 : insets.top,
          paddingHorizontal: isDesktop ? 0 : wide ? 28 : 12,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            minHeight: 56,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <IconButton
            accessibilityLabel="Voltar"
            onPress={requestClose}
            icon={<AppIcon name="arrow-back" size={22} color={colors.wine} />}
          />
          <View style={{ flex: 1 }}>
            <Typography
              style={{
                color: colors.wine,
                fontFamily: fonts.extraBold,
                fontSize: isDesktop ? 28 : wide ? 26 : 20,
                textAlign: isDesktop ? "left" : "center",
              }}
            >
              Personalizar vitrine
            </Typography>
            {wide ? (
              <Typography
                style={{
                  color: colors.warmGray,
                  fontSize: 13,
                  textAlign: isDesktop ? "left" : "center",
                  marginTop: 2,
                }}
              >
                Deixe seu catálogo com a cara do seu negócio.
              </Typography>
            ) : null}
          </View>
          <IconButton
            accessibilityLabel="Ver prévia"
            onPress={() => openPreview()}
            icon={<AppIcon name="eye-outline" size={21} color={colors.wine} />}
          />
        </View>
        <StepNavigation step={step} onNavigate={navigate} />
      </View>

      <View
        style={[
          { flex: 1, minHeight: 0, width: "100%" },
          split.outer,
          splitDesktop
            ? { ...split.row, paddingTop: 20, alignItems: "stretch" }
            : undefined,
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1, minWidth: 0 }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: splitDesktop ? undefined : MAX_WIDTH,
            alignSelf: splitDesktop ? "stretch" : "center",
            paddingHorizontal: isDesktop ? 0 : wide ? 28 : 14,
            paddingTop: splitDesktop ? 0 : 16,
            paddingBottom: 24,
            gap: isDesktop ? 22 : 18,
          }}
        >
          {splitDesktop ? null : contextualPreview}

          {step === "identity" ? (
            <>
              <SectionHeading
                title="Identidade da marca"
                description="O que seus clientes reconhecem primeiro."
              />
              <EditorCard>
                <View style={{ flexDirection: wide ? "row" : "column", gap: 18 }}>
                  <View style={{ flex: 1 }}>
                    <UploadButton
                      title="Logo ou foto de perfil"
                      image={draft.identity.logoUrl}
                      onPress={() => void pickImage("logo")}
                      onRemove={() =>
                        setDraft((current) => ({
                          ...current,
                          identity: { ...current.identity, logoUrl: null },
                        }))
                      }
                    />
                  </View>
                  <Input
                    label="Nome exibido"
                    value={draft.identity.displayName}
                    maxLength={STOREFRONT_DISPLAY_NAME_LIMIT}
                    error={errors.displayName}
                    onChangeText={(displayName) =>
                      setDraft((current) => ({
                        ...current,
                        identity: { ...current.identity, displayName },
                      }))
                    }
                    containerStyle={{ flex: 1, minWidth: 240 }}
                  />
                </View>
                {imageError ? (
                  <Typography
                    accessibilityLiveRegion="polite"
                    style={{ color: theme.colors.alert, fontSize: 12 }}
                  >
                    {imageError}
                  </Typography>
                ) : null}
              </EditorCard>
              <EditorCard>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <SectionHeading
                      title="Cor dos botões"
                      description="A marca Lucro Caseiro define o fundo e o vinho do texto."
                    />
                  </View>
                  <Button
                    title="Usar cor da marca"
                    variant="text"
                    compact
                    icon={
                      <AppIcon
                        name="color-palette-outline"
                        size={16}
                        color={colors.rose}
                      />
                    }
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        identity: {
                          ...current.identity,
                          actionColor: STOREFRONT_BRAND_COLORS.action,
                        },
                      }))
                    }
                  />
                </View>
                <ColorField
                  label="Hexadecimal"
                  value={draft.identity.actionColor}
                  error={errors.actionColor}
                  stacked={stackColorFields}
                  onOpen={() => setColorTarget("actionColor")}
                  onTextChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      identity: { ...current.identity, actionColor: value },
                    }))
                  }
                />
              </EditorCard>
            </>
          ) : null}

          {step === "hero" ? (
            <>
              <SectionHeading
                title="Composição do topo"
                description="Monte a primeira impressão da sua vitrine."
              />
              <EditorCard>
                <Typography
                  style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }}
                >
                  Capa da vitrine
                </Typography>
                <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                  A arte principal é o arquivo enviado. Logo e destaques ficam separados.
                </Typography>
                <UploadButton
                  title="Capa ou banner"
                  image={coverUrl}
                  onPress={() => void pickImage("cover")}
                  onRemove={() => setCoverUrl(null)}
                />
                {coverUrl ? null : (
                  <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                    Sem capa, o topo fica neutro. Destaques só aparecem quando não houver
                    capa.
                  </Typography>
                )}
                <Typography
                  style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }}
                >
                  Destaques do topo
                </Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {draft.hero.featuredItems.map((item) => {
                    const visual = resolveFeaturedVisual(
                      item,
                      draft.hero.removeBackground,
                    );
                    return (
                      <View
                        key={item.id}
                        style={{ width: wide ? 180 : "47%", minWidth: 140, gap: 7 }}
                      >
                        <View
                          style={{
                            height: 110,
                            borderRadius: 14,
                            overflow: "hidden",
                            backgroundColor: colors.neutral,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {visual.source ? (
                            <Image
                              source={{ uri: visual.source }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode={visual.cutout ? "contain" : "cover"}
                            />
                          ) : (
                            <AppIcon
                              name="person-outline"
                              size={30}
                              color={colors.rose}
                            />
                          )}
                        </View>
                        <Typography
                          numberOfLines={1}
                          style={{
                            color: colors.ink,
                            fontFamily: fonts.semiBold,
                            fontSize: 12,
                          }}
                        >
                          {displayCatalogItemName(item.altText)}
                        </Typography>
                        <Typography style={{ color: colors.warmGray, fontSize: 11 }}>
                          {item.kind === "product"
                            ? "Produto"
                            : item.kind === "service"
                              ? "Serviço"
                              : "Mídia"}
                        </Typography>
                        <Button
                          title="Remover"
                          variant="text"
                          compact
                          onPress={() =>
                            setDraft((current) => ({
                              ...current,
                              hero: {
                                ...current.hero,
                                featuredItems: current.hero.featuredItems.filter(
                                  (entry) => entry.id !== item.id,
                                ),
                              },
                            }))
                          }
                        />
                      </View>
                    );
                  })}
                  {draft.hero.featuredItems.length < 3 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setFeaturedPickerVisible(true)}
                      style={{
                        width: wide ? 180 : "47%",
                        minWidth: 140,
                        minHeight: 110,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: colors.rose,
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                      }}
                    >
                      <AppIcon name="add-circle-outline" size={26} color={colors.rose} />
                      <Typography
                        style={{
                          color: colors.rose,
                          fontFamily: fonts.semiBold,
                          fontSize: 12,
                          textAlign: "center",
                        }}
                      >
                        Selecionar itens ou mídia
                      </Typography>
                      <Typography style={{ color: colors.warmGray, fontSize: 11 }}>
                        Até 3 destaques
                      </Typography>
                    </Pressable>
                  ) : null}
                </View>
                <SwitchRow
                  label="Remover fundo automaticamente"
                  description={
                    draft.hero.removeBackground
                      ? coverUrl
                        ? "Os destaques ficam recortados. Com capa no topo, eles só aparecem se você remover a capa."
                        : "Os destaques aparecem recortados. Se já existir uma versão processada, ela é usada."
                      : "Os destaques mantêm o fundo original da foto."
                  }
                  value={draft.hero.removeBackground}
                  onValueChange={(removeBackground) =>
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, removeBackground },
                    }))
                  }
                />
              </EditorCard>
              <SectionHeading title="Texto e ação" />
              <EditorCard>
                <View style={{ gap: 6 }}>
                  <Input
                    label="Frase de apresentação"
                    value={draft.hero.introduction}
                    maxLength={STOREFRONT_INTRODUCTION_LIMIT}
                    error={errors.introduction}
                    onChangeText={(introduction) =>
                      setDraft((current) => ({
                        ...current,
                        hero: { ...current.hero, introduction },
                      }))
                    }
                  />
                  <FieldHint
                    value={draft.hero.introduction}
                    limit={STOREFRONT_INTRODUCTION_LIMIT}
                  />
                </View>
                <View style={{ gap: 6 }}>
                  <Input
                    label="Botão de contato"
                    value={draft.hero.action.label}
                    maxLength={STOREFRONT_ACTION_LABEL_LIMIT}
                    error={errors.heroActionLabel}
                    onChangeText={(label) =>
                      setDraft((current) => ({
                        ...current,
                        hero: {
                          ...current.hero,
                          action: {
                            ...current.hero.action,
                            label,
                            type: label.trim() ? "whatsapp" : "none",
                          },
                        },
                      }))
                    }
                  />
                  <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                    Abre o WhatsApp. Deixe em branco se não quiser o botão no topo.
                  </Typography>
                  <FieldHint
                    value={draft.hero.action.label}
                    limit={STOREFRONT_ACTION_LABEL_LIMIT}
                  />
                </View>
                <Input
                  label="Faixa promocional"
                  value={draft.hero.promotionalText}
                  maxLength={STOREFRONT_PROMO_LIMIT}
                  error={errors.promotionalText}
                  onChangeText={(promotionalText) =>
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, promotionalText },
                    }))
                  }
                />
                <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                  Se preencher, a faixa aparece no topo da vitrine.
                </Typography>
              </EditorCard>
            </>
          ) : null}

          {isPublication ? (
            <>
              <SectionHeading
                title="Contato e conversão"
                description="Defina como seus clientes entram em contato."
              />
              <EditorCard>
                <Input
                  label="Número do WhatsApp"
                  value={draft.organization.contact.destination}
                  keyboardType="phone-pad"
                  error={errors.whatsapp}
                  onChangeText={(destination) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        contact: {
                          ...current.organization.contact,
                          destination: formatCatalogWhatsapp(destination),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Texto do botão flutuante"
                  value={draft.organization.contact.defaultActionLabel}
                  maxLength={24}
                  onChangeText={(defaultActionLabel) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        contact: { ...current.organization.contact, defaultActionLabel },
                      },
                    }))
                  }
                />
                <View style={{ gap: 6 }}>
                  <Input
                    label="Mensagem inicial"
                    value={draft.organization.contact.initialMessage}
                    maxLength={300}
                    multiline
                    onChangeText={(initialMessage) =>
                      setDraft((current) => ({
                        ...current,
                        organization: {
                          ...current.organization,
                          contact: { ...current.organization.contact, initialMessage },
                        },
                      }))
                    }
                  />
                  <FieldHint
                    value={draft.organization.contact.initialMessage}
                    limit={300}
                  />
                </View>
              </EditorCard>
              <SectionHeading
                title="Link do catálogo"
                description="Compartilhe sua vitrine com seus clientes."
              />
              <EditorCard>
                <Input
                  label="Endereço"
                  value={draft.publication.slug}
                  autoCapitalize="none"
                  error={errors.slug ?? slugAvailability.data?.reason ?? undefined}
                  onChangeText={(slug) =>
                    setDraft((current) => ({
                      ...current,
                      publication: {
                        ...current.publication,
                        slug: slug.toLowerCase().replace(/\s+/g, "-"),
                      },
                    }))
                  }
                />
                <View
                  style={{
                    minHeight: 48,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AppIcon
                    name={slugAvailable ? "checkmark-circle" : "time-outline"}
                    size={16}
                    color={slugAvailable ? colors.wine : colors.warmGray}
                  />
                  <Typography
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      color: slugAvailable ? colors.wine : colors.warmGray,
                      fontSize: 12,
                    }}
                  >
                    {slugAvailability.isFetching
                      ? "Verificando disponibilidade..."
                      : slugAvailable
                        ? catalogUrl
                        : "Escolha outro endereço."}
                  </Typography>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <Button
                    title={linkCopied ? "Copiado!" : "Copiar link"}
                    variant={linkCopied ? "successOutline" : "outline"}
                    disabled={!slugAvailable}
                    onPress={copyCatalogLink}
                    icon={
                      <AppIcon
                        name={linkCopied ? "checkmark-circle" : "clipboard-outline"}
                        size={16}
                        color={linkCopied ? colors.limeText : colors.rose}
                      />
                    }
                    style={{ flexGrow: 1, flexBasis: "47%" }}
                  />
                  <Button
                    title="Compartilhar"
                    variant="outline"
                    disabled={!slugAvailable}
                    onPress={() => void Share.share({ message: catalogUrl })}
                    icon={<AppIcon name="share-outline" size={16} color={colors.rose} />}
                    style={{ flexGrow: 1, flexBasis: "47%" }}
                  />
                  <Button
                    title="Criar QR Code"
                    variant="outline"
                    disabled={!slugAvailable}
                    onPress={() => setQrVisible(true)}
                    icon={
                      <AppIcon name="qr-code-outline" size={16} color={colors.rose} />
                    }
                    style={{ flexGrow: 1, flexBasis: "47%" }}
                  />
                </View>
              </EditorCard>
              <SectionHeading
                title="Revisão final"
                description="Confira antes de publicar."
              />
              <EditorCard>
                {checklist.map((item) => {
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => navigate(item.step)}
                      style={{
                        minHeight: 46,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: item.valid ? colors.lime : colors.surface,
                        }}
                      >
                        <AppIcon
                          name={item.valid ? "checkmark" : "alert-circle-outline"}
                          size={14}
                          color={item.valid ? colors.onLime : colors.warmGray}
                        />
                      </View>
                      <Typography style={{ flex: 1, color: colors.ink, fontSize: 13 }}>
                        {item.label}
                      </Typography>
                      <AppIcon name="chevron-forward" size={18} color={colors.warmGray} />
                    </Pressable>
                  );
                })}
                <View
                  style={{
                    borderRadius: 13,
                    padding: 12,
                    backgroundColor: publishingReady
                      ? theme.colors.successBg
                      : colors.softRose,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <AppIcon
                    name={publishingReady ? "checkmark-circle" : "alert-circle-outline"}
                    size={18}
                    color={publishingReady ? theme.colors.success : colors.rose}
                  />
                  <Typography
                    style={{
                      color: publishingReady ? theme.colors.success : colors.ink,
                      fontFamily: fonts.semiBold,
                      fontSize: 12,
                    }}
                  >
                    {publishingReady
                      ? "Tudo pronto para sua vitrine ficar no ar."
                      : "Complete os itens pendentes para publicar."}
                  </Typography>
                </View>
                <Button
                  title="Publicar depois"
                  variant="text"
                  onPress={() => void persist(false)}
                  disabled={!dirty}
                />
              </EditorCard>
            </>
          ) : null}
        </ScrollView>

        {splitDesktop ? (
          <View
            style={{
              ...split.aside,
              width: asideWidth,
              maxHeight: "100%",
              minHeight: 0,
            }}
          >
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
            >
              {contextualPreview}
            </ScrollView>
            <View
              style={{
                gap: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: spacing["3xl"],
              }}
            >
              <Button
                title="Ver prévia"
                variant="outline"
                onPress={() => openPreview()}
                icon={<AppIcon name="eye-outline" size={19} color={colors.rose} />}
              />
              <Button
                title={
                  isPublication
                    ? requestStatus === "publishing"
                      ? "Publicando..."
                      : "Salvar e publicar"
                    : requestStatus === "saving"
                      ? "Salvando..."
                      : "Salvar alterações"
                }
                loading={requestStatus === "saving" || requestStatus === "publishing"}
                disabled={isPublication ? !publishingReady || update.isPending : !canSave}
                onPress={() => void persist(isPublication)}
              />
            </View>
          </View>
        ) : null}
      </View>

      {splitDesktop ? null : (
        <View
          style={{
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: isDesktop ? 0 : wide ? 28 : 14,
            paddingTop: spacing.md,
            paddingBottom: spacing["2xl"],
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: isDesktop ? undefined : MAX_WIDTH,
              alignSelf: isDesktop ? "stretch" : "center",
              flexDirection: width < 360 ? "column" : "row",
              justifyContent: isDesktop ? "flex-end" : "flex-start",
              gap: 10,
            }}
          >
            <Button
              title="Ver prévia"
              variant="outline"
              onPress={() => openPreview()}
              icon={<AppIcon name="eye-outline" size={19} color={colors.rose} />}
              style={isDesktop ? desktopAction(true, 200) : { flex: 1 }}
            />
            <Button
              title={
                isPublication
                  ? requestStatus === "publishing"
                    ? "Publicando..."
                    : "Salvar e publicar"
                  : requestStatus === "saving"
                    ? "Salvando..."
                    : "Salvar alterações"
              }
              loading={requestStatus === "saving" || requestStatus === "publishing"}
              disabled={isPublication ? !publishingReady || update.isPending : !canSave}
              onPress={() => void persist(isPublication)}
              style={isDesktop ? desktopAction(true, 240) : { flex: 1.08 }}
            />
          </View>
        </View>
      )}

      <ColorPickerModal
        visible={colorTarget !== null}
        initialColor={colorTarget ? draft.identity[colorTarget] : colors.rose}
        onCancel={() => setColorTarget(null)}
        onConfirm={(value) => {
          if (colorTarget)
            setDraft((current) => ({
              ...current,
              identity: { ...current.identity, [colorTarget]: value },
            }));
          setColorTarget(null);
        }}
      />
      <FeaturedPicker
        visible={featuredPickerVisible}
        products={products}
        services={services}
        selectedIds={selectedIds}
        onClose={() => setFeaturedPickerVisible(false)}
        onAddProduct={(item) => addFeatured("product", item)}
        onAddService={(item) => addFeatured("service", item)}
        onAddMedia={() => void pickImage("media")}
      />
      <PreviewModal
        visible={previewVisible}
        html={previewHtml}
        loading={previewLoading}
        source={previewSource}
        onSourceChange={(next) => {
          setPreviewSource(next);
          if (next === "published") void loadPublishedPreview();
        }}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewLoading(false);
          setPreviewHtml(null);
          setPreviewSource("local");
        }}
      >
        <StorefrontFinalPreview {...previewProps} chrome={false} />
      </PreviewModal>
      <Modal
        visible={publishedVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPublishedVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 22,
              backgroundColor: colors.white,
              padding: 22,
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${colors.lime}66`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="checkmark-circle"
                size={32}
                color={colors.limeText}
                importantForAccessibility="no"
              />
            </View>
            <View style={{ gap: 4, alignItems: "center" }}>
              <Typography
                style={{
                  color: colors.ink,
                  fontFamily: fonts.extraBold,
                  fontSize: 20,
                  lineHeight: 26,
                  textAlign: "center",
                }}
              >
                Salvo e publicado
              </Typography>
              <Typography
                style={{
                  color: colors.warmGray,
                  fontSize: 13,
                  lineHeight: 19,
                  textAlign: "center",
                }}
              >
                Sua vitrine já está no ar com as alterações.
              </Typography>
            </View>
            <Typography
              selectable
              style={{ color: colors.warmGray, fontSize: 12, textAlign: "center" }}
            >
              {publicCatalogUrl(normalizedSlug)}
            </Typography>
            <Button
              title="OK"
              style={{ width: "100%" }}
              onPress={() => setPublishedVisible(false)}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setQrVisible(false);
          setLinkCopied(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 22,
              backgroundColor: colors.white,
              padding: 22,
              alignItems: "center",
              gap: 16,
            }}
          >
            <SectionHeading
              title="QR Code da vitrine"
              description="Aponte a câmera para abrir o catálogo."
            />
            <SvgXml
              xml={buildQrSvg(catalogUrl, colors.wineFill)}
              width={230}
              height={230}
            />
            <Typography
              selectable
              style={{ color: colors.warmGray, fontSize: 12, textAlign: "center" }}
            >
              {catalogUrl}
            </Typography>
            <View style={{ width: "100%", flexDirection: "row", gap: 9 }}>
              <Button
                title={linkCopied ? "Copiado!" : "Copiar link"}
                variant={linkCopied ? "successOutline" : "outline"}
                style={{ flex: 1 }}
                onPress={copyCatalogLink}
                icon={
                  <AppIcon
                    name={linkCopied ? "checkmark-circle" : "clipboard-outline"}
                    size={16}
                    color={linkCopied ? colors.limeText : colors.rose}
                  />
                }
              />
              <Button
                title="Compartilhar"
                style={{ flex: 1 }}
                onPress={() => void Share.share({ message: catalogUrl })}
              />
            </View>
            <Button
              title="Fechar"
              variant="text"
              onPress={() => {
                setQrVisible(false);
                setLinkCopied(false);
              }}
            />
          </View>
        </View>
      </Modal>
      {requestStatus === "loading" ? (
        <View
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={colors.rose} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const StyleSheetAbsoluteFill = Platform.select({
  web: { position: "fixed", inset: 0 } as unknown as ViewStyle,
  default: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as ViewStyle,
});
