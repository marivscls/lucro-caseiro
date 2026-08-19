/* eslint-disable sonarjs/no-nested-conditional, sonarjs/no-nested-functions */
import type {
  CatalogItemAction,
  Product,
  Service,
  StorefrontCustomization,
} from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  IconButton,
  Input,
  Typography,
  fonts,
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
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { SvgXml } from "react-native-svg";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
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
  STOREFRONT_SIGNATURE_LIMIT,
  buildStorefrontChecklist,
  catalogImageValidationError,
  createFeaturedItemTransforms,
  createStorefrontCustomization,
  displayCatalogItemName,
  formatCatalogWhatsapp,
  hasStorefrontErrors,
  isLocalCatalogImage,
  isStorefrontDraftDirty,
  normalizeFeaturedItemTransform,
  normalizeStorefrontCustomization,
  validateStorefrontCustomization,
  type EditorStatus,
  type StorefrontEditorStep,
  type StorefrontOrganizationSection,
} from "../catalog-customizer";
import { useCatalogSlugAvailability, useUpdateCatalogSettings } from "../hooks";
import {
  CoverAdjuster,
  StorefrontCardsPreview,
  StorefrontContentPreview,
  StorefrontFinalPreview,
  StorefrontHeroPreview,
  StorefrontIdentityPreview,
} from "./storefront-preview";

const NAV_HEIGHT = 76;
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

type ColorTarget = "primaryColor" | "actionColor" | "backgroundColor" | null;
type SelectOption<T extends string> = Readonly<{
  value: T;
  label: string;
  icon?: AppIconName;
}>;

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

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 3,
  label,
}: Readonly<{
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  columns?: number;
  label?: string;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View accessibilityRole="radiogroup" style={{ gap: 9 }}>
      {label ? (
        <Typography
          style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
        >
          {label}
        </Typography>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={{
                flexBasis: columns === 2 ? "47%" : "30%",
                flexGrow: 1,
                minWidth: columns === 2 ? 138 : 102,
                minHeight: 48,
                borderRadius: 14,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? colors.rose : colors.border,
                backgroundColor: selected ? colors.softRose : colors.white,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              {option.icon ? (
                <AppIcon
                  name={option.icon}
                  size={19}
                  color={selected ? colors.wine : colors.warmGray}
                />
              ) : null}
              <Typography
                style={{
                  color: selected ? colors.wine : colors.ink,
                  fontFamily: selected ? fonts.bold : fonts.semiBold,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                {option.label}
              </Typography>
              {selected ? (
                <AppIcon name="checkmark-circle" size={17} color={colors.rose} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FieldHint({
  value,
  limit,
}: Readonly<{ value: string; limit: number }>) {
  const colors = useBrandScreenPalette();
  return (
    <Typography style={{ color: colors.warmGray, fontSize: 11, textAlign: "right" }}>
      {value.length} de {limit} caracteres
    </Typography>
  );
}

function StyleOption<T extends string>({
  value,
  selected,
  title,
  description,
  onSelect,
  children,
}: React.PropsWithChildren<
  Readonly<{
    value: T;
    selected: boolean;
    title: string;
    description: string;
    onSelect: (value: T) => void;
  }>
>) {
  const colors = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={() => onSelect(value)}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 132,
        minHeight: 118,
        borderRadius: 16,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.rose : colors.border,
        backgroundColor: selected ? colors.softRose : colors.white,
        padding: 10,
        gap: 8,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          height: 46,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.surface,
        }}
      >
        {children}
        {selected ? (
          <View style={{ position: "absolute", top: 4, right: 4 }}>
            <AppIcon name="checkmark-circle" size={16} color={colors.rose} />
          </View>
        ) : null}
      </View>
      <Typography
        style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }}
      >
        {title}
      </Typography>
      <Typography style={{ color: colors.warmGray, fontSize: 11, lineHeight: 15 }}>
        {description}
      </Typography>
    </Pressable>
  );
}

function CompactReorderRow({
  label,
  index,
  last,
  onMoveUp,
  onMoveDown,
}: Readonly<{
  label: string;
  index: number;
  last: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppIcon name="list" size={16} color={colors.warmGray} importantForAccessibility="no" />
      <Typography style={{ flex: 1, color: colors.ink, fontSize: 13 }}>{label}</Typography>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Subir ${label}`}
        disabled={index === 0}
        onPress={onMoveUp}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          opacity: index === 0 ? 0.35 : 1,
        }}
      >
        <AppIcon name="chevron-up" size={18} color={colors.wine} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Descer ${label}`}
        disabled={last}
        onPress={onMoveDown}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          opacity: last ? 0.35 : 1,
        }}
      >
        <AppIcon name="chevron-down" size={18} color={colors.wine} />
      </Pressable>
    </View>
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
    <View style={{ minHeight: 50, flexDirection: "row", alignItems: "center", gap: 12 }}>
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
      <CatalogSwitch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.rose }}
        thumbColor={colors.onWine}
        activeThumbColor={colors.onWine}
      />
    </View>
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
  section,
  onNavigate,
}: Readonly<{
  step: StorefrontEditorStep;
  section: StorefrontOrganizationSection;
  onNavigate: (
    step: StorefrontEditorStep,
    section?: StorefrontOrganizationSection,
  ) => void;
}>) {
  const colors = useBrandScreenPalette();
  const steps: ReadonlyArray<{
    id: StorefrontEditorStep;
    label: string;
    number: number;
  }> = [
    { id: "identity", label: "Identidade", number: 1 },
    { id: "hero", label: "Topo da vitrine", number: 2 },
    { id: "organization", label: "Organização", number: 3 },
  ];
  const sections: ReadonlyArray<{
    id: StorefrontOrganizationSection;
    label: string;
    number: number;
  }> = [
    { id: "content", label: "Conteúdo", number: 1 },
    { id: "cards-actions", label: "Cards e ações", number: 2 },
    { id: "publication", label: "Publicação", number: 3 },
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
      {step === "organization" ? (
        <View
          style={{
            marginHorizontal: 12,
            borderRadius: 14,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: "row",
            padding: 4,
          }}
        >
          {sections.map((item) => {
            const active = item.id === section;
            const complete =
              sections.findIndex((candidate) => candidate.id === section) >
              item.number - 1;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                onPress={() => onNavigate("organization", item.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 40,
                  borderRadius: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: active ? colors.softRose : "transparent",
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      active || complete ? colors.wineFill : colors.surface,
                  }}
                >
                  {complete ? (
                    <AppIcon name="checkmark" size={11} color={colors.onWine} />
                  ) : (
                    <Typography
                      style={{
                        color: active ? colors.onWine : colors.warmGray,
                        fontFamily: fonts.bold,
                        fontSize: 10,
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
                    fontSize: 10,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
      displayCatalogItemName(item.name)
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
  );
  const serviceItems = services.filter(
    (item) =>
      item.active &&
      item.publicEnabled &&
      displayCatalogItemName(item.name)
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
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

function TransformEditor({
  visible,
  featured,
  onChange,
  onClose,
}: Readonly<{
  visible: boolean;
  featured: StorefrontCustomization["hero"]["featuredItems"];
  onChange: (items: StorefrontCustomization["hero"]["featuredItems"]) => void;
  onClose: () => void;
}>) {
  const colors = useBrandScreenPalette();
  const [selectedId, setSelectedId] = useState(featured[0]?.id ?? "");
  const [breakpoint, setBreakpoint] = useState<
    "smallMobile" | "mobile" | "tablet" | "desktop"
  >("mobile");
  const selected = featured.find((item) => item.id === selectedId) ?? featured[0];
  const transform = selected?.transforms.find((item) => item.breakpoint === breakpoint);
  function patchTransform(patch: Partial<NonNullable<typeof transform>>) {
    if (!selected || !transform) return;
    onChange(
      featured.map((item) =>
        item.id !== selected.id
          ? item
          : {
              ...item,
              transforms: item.transforms.map((entry) =>
                entry.breakpoint !== breakpoint
                  ? entry
                  : normalizeFeaturedItemTransform({ ...entry, ...patch }),
              ),
            },
      ),
    );
  }
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
            borderRadius: 22,
            backgroundColor: colors.white,
            padding: 18,
            gap: 15,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SectionHeading
              title="Ajustar posição e tamanho"
              description="Coordenadas são salvas por tamanho de tela."
            />
            <View style={{ flex: 1 }} />
            <IconButton
              accessibilityLabel="Fechar editor"
              onPress={onClose}
              icon={<AppIcon name="close" size={21} color={colors.ink} />}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {featured.map((item) => (
              <Button
                key={item.id}
                title={item.altText}
                variant={item.id === selected?.id ? "secondary" : "outline"}
                compact
                onPress={() => setSelectedId(item.id)}
              />
            ))}
          </ScrollView>
          <ChoiceGroup
            value={breakpoint}
            columns={2}
            onChange={setBreakpoint}
            options={[
              { value: "smallMobile", label: "320–389" },
              { value: "mobile", label: "390–767" },
              { value: "tablet", label: "768–1023" },
              { value: "desktop", label: "1024+" },
            ]}
          />
          {selected && transform ? (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  height: 190,
                  borderRadius: 16,
                  backgroundColor: colors.neutral,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(selected.processedUrl ?? selected.assetUrl) ? (
                  <Image
                    source={{ uri: selected.processedUrl ?? selected.assetUrl! }}
                    style={{
                      width: 130,
                      height: 130,
                      borderRadius: 14,
                      transform: [
                        { translateX: (transform.x - 0.5) * 160 },
                        { translateY: (transform.y - 0.5) * 110 },
                        { scale: transform.scale },
                      ],
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <AppIcon name="person-outline" size={48} color={colors.rose} />
                )}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Button
                  title="←"
                  variant="outline"
                  onPress={() => patchTransform({ x: transform.x - 0.05 })}
                  accessibilityLabel="Mover para esquerda"
                />
                <Button
                  title="→"
                  variant="outline"
                  onPress={() => patchTransform({ x: transform.x + 0.05 })}
                  accessibilityLabel="Mover para direita"
                />
                <Button
                  title="↑"
                  variant="outline"
                  onPress={() => patchTransform({ y: transform.y - 0.05 })}
                  accessibilityLabel="Mover para cima"
                />
                <Button
                  title="↓"
                  variant="outline"
                  onPress={() => patchTransform({ y: transform.y + 0.05 })}
                  accessibilityLabel="Mover para baixo"
                />
                <Button
                  title="− tamanho"
                  variant="outline"
                  onPress={() => patchTransform({ scale: transform.scale - 0.1 })}
                />
                <Button
                  title="+ tamanho"
                  variant="outline"
                  onPress={() => patchTransform({ scale: transform.scale + 0.1 })}
                />
                <Button
                  title="− camada"
                  variant="outline"
                  onPress={() => patchTransform({ layer: transform.layer - 1 })}
                />
                <Button
                  title="+ camada"
                  variant="outline"
                  onPress={() => patchTransform({ layer: transform.layer + 1 })}
                />
                <Button
                  title="Restaurar"
                  variant="text"
                  onPress={() => patchTransform({ x: 0.5, y: 0.5, scale: 1, layer: 0 })}
                />
              </View>
            </View>
          ) : (
            <Typography style={{ color: colors.warmGray }}>
              Selecione um destaque primeiro.
            </Typography>
          )}
          <Button title="Concluir ajustes" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const ACTION_OPTIONS: ReadonlyArray<SelectOption<CatalogItemAction["type"]>> = [
  { value: "order", label: "Pedir" },
  { value: "preorder", label: "Encomendar" },
  { value: "quote", label: "Orçamento" },
  { value: "schedule", label: "Agendar" },
  { value: "details", label: "Ver detalhes" },
  { value: "contact", label: "Contato" },
  { value: "externalLink", label: "Link externo" },
  { value: "none", label: "Sem ação" },
];

function ActionEditor({
  title,
  value,
  onChange,
  allowed,
}: Readonly<{
  title: string;
  value: CatalogItemAction;
  onChange: (action: CatalogItemAction) => void;
  allowed: readonly CatalogItemAction["type"][];
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View style={{ flex: 1, minWidth: 260, gap: 12 }}>
      <Typography style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }}>
        {title}
      </Typography>
      <ChoiceGroup
        value={value.type}
        columns={2}
        onChange={(type) => onChange({ ...value, type })}
        options={ACTION_OPTIONS.filter((item) => allowed.includes(item.value))}
      />
      {value.type !== "none" ? (
        <>
          <ChoiceGroup
            value={value.channel ?? "whatsapp"}
            columns={3}
            onChange={(channel) => onChange({ ...value, channel })}
            options={[
              { value: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
              { value: "internal", label: "Interno", icon: "phone-portrait-outline" },
              { value: "external", label: "Externo", icon: "open-outline" },
            ]}
          />
          <Input
            label="Texto do botão"
            value={value.label ?? ""}
            maxLength={24}
            onChangeText={(label) => onChange({ ...value, label })}
          />
          {value.channel === "external" ? (
            <Input
              label="Destino"
              value={value.destination ?? ""}
              autoCapitalize="none"
              onChangeText={(destination) => onChange({ ...value, destination })}
            />
          ) : null}
          {value.channel === "whatsapp" ? (
            <Input
              label="Mensagem inicial"
              value={value.initialMessage ?? ""}
              maxLength={300}
              multiline
              onChangeText={(initialMessage) => onChange({ ...value, initialMessage })}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function PreviewModal({
  visible,
  onClose,
  html,
  loading = false,
  children,
}: React.PropsWithChildren<
  Readonly<{
    visible: boolean;
    onClose: () => void;
    html?: string | null;
    loading?: boolean;
  }>
>) {
  const colors = useBrandScreenPalette();
  const isDesktop = useDesktopLayout();
  const showIframe = Platform.OS === "web" && Boolean(html);
  const showSpinner = Platform.OS === "web" && loading && !html;
  const previewBody = showIframe ? (
    React.createElement("iframe", {
      srcDoc: html,
      title: "Prévia da vitrine",
      sandbox: "allow-scripts allow-forms allow-popups",
      style: { flex: 1, width: "100%", border: 0, background: colors.background },
    })
  ) : showSpinner ? (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.rose} />
      <Typography style={{ marginTop: 12, color: colors.warmGray }}>
        Preparando prévia…
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
              }}
            >
              Prévia da vitrine
            </Typography>
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
  const [featuredPickerVisible, setFeaturedPickerVisible] = useState(false);
  const [transformVisible, setTransformVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [slugToCheck, setSlugToCheck] = useState("");
  const [coverUrl, setCoverUrl] = useState(settings.coverUrl);
  const [savedCoverUrl, setSavedCoverUrl] = useState(settings.coverUrl);
  const [coverAdjustVisible, setCoverAdjustVisible] = useState(false);
  const selectedFiles = useRef(new Map<string, File>());

  const step: StorefrontEditorStep =
    params.step === "hero" || params.step === "organization" ? params.step : "identity";
  const section: StorefrontOrganizationSection =
    params.section === "cards-actions" || params.section === "publication"
      ? params.section
      : "content";
  const dirty =
    isStorefrontDraftDirty(draft, savedDraft) || coverUrl !== savedCoverUrl;
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

  function navigate(
    nextStep: StorefrontEditorStep,
    nextSection: StorefrontOrganizationSection = "content",
  ) {
    router.setParams({
      editor: "1",
      step: nextStep,
      section: nextStep === "organization" ? nextSection : undefined,
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

  async function openPreview() {
    setPreviewVisible(true);
    if (Platform.OS !== "web" || !token) return;
    setPreviewHtml(null);
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

  async function pickImage(target: "logo" | "media" | "small" | "cover") {
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
    if (target === "small")
      setDraft((current) => ({
        ...current,
        hero: { ...current.hero, smallScreenAlternativeUrl: asset.uri },
      }));
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
      const smallScreenAlternativeUrl = await uploadLocal(
        draft.hero.smallScreenAlternativeUrl,
      );
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
        hero: { ...draft.hero, smallScreenAlternativeUrl, featuredItems },
      };
      const normalized = normalizeStorefrontCustomization(hydrated, publishing);
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
      showToast(publishing ? "Vitrine publicada!" : "Alterações salvas!");
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
      <StorefrontHeroPreview
        customization={draft}
        status={status}
        coverUrl={coverUrl}
      />
    );
  if (step === "organization" && section === "content")
    contextualPreview = <StorefrontContentPreview {...previewProps} />;
  if (step === "organization" && section === "cards-actions")
    contextualPreview = <StorefrontCardsPreview {...previewProps} />;
  if (step === "organization" && section === "publication")
    contextualPreview = <StorefrontFinalPreview {...previewProps} />;

  const categories = [...new Set(products.map((item) => item.category).filter(Boolean))];
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
        paddingBottom: isDesktop ? 0 : NAV_HEIGHT + insets.bottom,
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
            onPress={() => void openPreview()}
            icon={<AppIcon name="eye-outline" size={21} color={colors.wine} />}
          />
        </View>
        <StepNavigation step={step} section={section} onNavigate={navigate} />
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
              <ChoiceGroup
                label="O que você oferece?"
                value={draft.identity.offeringMode}
                onChange={(offeringMode) =>
                  setDraft((current) => ({
                    ...current,
                    identity: { ...current.identity, offeringMode },
                    organization: {
                      ...current.organization,
                      content: {
                        ...current.organization.content,
                        showProducts: offeringMode !== "services",
                        showServices: offeringMode !== "products",
                      },
                    },
                  }))
                }
                options={[
                  { value: "products", label: "Produtos", icon: "bag-handle-outline" },
                  { value: "services", label: "Serviços", icon: "person-outline" },
                  { value: "both", label: "Ambos", icon: "apps-outline" },
                ]}
              />
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
                  <SectionHeading title="Cores da vitrine" />
                </View>
                <Button
                  title="Usar cores da marca"
                  variant="text"
                  compact
                  icon={
                    <AppIcon name="color-palette-outline" size={16} color={colors.rose} />
                  }
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      identity: {
                        ...current.identity,
                        primaryColor: STOREFRONT_BRAND_COLORS.primary,
                        actionColor: STOREFRONT_BRAND_COLORS.action,
                        backgroundColor: STOREFRONT_BRAND_COLORS.background,
                      },
                    }))
                  }
                />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                {(["primaryColor", "actionColor", "backgroundColor"] as const).map(
                  (key) => (
                    <ColorField
                      key={key}
                      label={
                        key === "primaryColor"
                          ? "Cor principal"
                          : key === "actionColor"
                            ? "Ação"
                            : "Fundo"
                      }
                      value={draft.identity[key]}
                      error={errors[key]}
                      stacked={stackColorFields}
                      onOpen={() => setColorTarget(key)}
                      onTextChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          identity: { ...current.identity, [key]: value },
                        }))
                      }
                    />
                  ),
                )}
              </View>
            </EditorCard>
          </>
        ) : null}

        {step === "hero" ? (
          <>
            <SectionHeading
              title="Estilo do topo"
              description="Escolha como sua história aparece primeiro."
            />
            <View
              accessibilityRole="radiogroup"
              style={{ flexDirection: wide ? "row" : "column", gap: 10 }}
            >
              <StyleOption
                value="classic"
                selected={draft.hero.style === "classic"}
                title="Clássico"
                description="Texto e ação em coluna, capa em destaque."
                onSelect={(style) =>
                  setDraft((current) => ({ ...current, hero: { ...current.hero, style } }))
                }
              >
                <View style={{ flex: 1, padding: 6, gap: 4 }}>
                  <View style={{ height: 6, width: "55%", borderRadius: 4, backgroundColor: colors.wine }} />
                  <View style={{ height: 4, width: "80%", borderRadius: 4, backgroundColor: colors.border }} />
                  <View style={{ height: 10, width: 36, borderRadius: 6, backgroundColor: colors.rose }} />
                </View>
              </StyleOption>
              <StyleOption
                value="editorial"
                selected={draft.hero.style === "editorial"}
                title="Editorial"
                description="Destaques visuais, texto à esquerda e ação visível."
                onSelect={(style) =>
                  setDraft((current) => ({ ...current, hero: { ...current.hero, style } }))
                }
              >
                <View style={{ flex: 1, flexDirection: "row", padding: 6, gap: 6 }}>
                  <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
                    <View style={{ height: 6, width: "90%", borderRadius: 4, backgroundColor: colors.wine }} />
                    <View style={{ height: 10, width: 28, borderRadius: 6, backgroundColor: colors.rose }} />
                  </View>
                  <View style={{ width: 28, borderRadius: 6, backgroundColor: colors.softRose }} />
                </View>
              </StyleOption>
              <StyleOption
                value="compact"
                selected={draft.hero.style === "compact"}
                title="Compacto"
                description="Leitura rápida, menos altura e ação objetiva."
                onSelect={(style) =>
                  setDraft((current) => ({ ...current, hero: { ...current.hero, style } }))
                }
              >
                <View style={{ flex: 1, padding: 8, justifyContent: "center", gap: 3 }}>
                  <View style={{ height: 5, width: "70%", borderRadius: 4, backgroundColor: colors.wine }} />
                  <View style={{ height: 8, width: 32, borderRadius: 5, backgroundColor: colors.rose }} />
                </View>
              </StyleOption>
            </View>
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
              {coverUrl ? (
                <>
                  <Button
                    title="Ajustar posição e tamanho"
                    variant="outline"
                    compact
                    onPress={() => setCoverAdjustVisible((current) => !current)}
                    icon={<AppIcon name="options-outline" size={18} color={colors.rose} />}
                  />
                  {coverAdjustVisible ? (
                    <CoverAdjuster
                      coverUrl={coverUrl}
                      focal={draft.hero.coverFocal ?? { x: 0.5, y: 0.5, scale: 1 }}
                      onChange={(coverFocal) =>
                        setDraft((current) => ({
                          ...current,
                          hero: { ...current.hero, coverFocal },
                        }))
                      }
                    />
                  ) : null}
                </>
              ) : (
                <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                  Sem capa, o topo fica neutro. Destaques só aparecem quando não houver capa.
                </Typography>
              )}
              <Typography
                style={{ color: colors.ink, fontFamily: fonts.bold, fontSize: 14 }}
              >
                Destaques do topo
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {draft.hero.featuredItems.map((item) => (
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
                      {(item.processedUrl ?? item.assetUrl) ? (
                        <Image
                          source={{ uri: item.processedUrl ?? item.assetUrl! }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <AppIcon name="person-outline" size={30} color={colors.rose} />
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
                ))}
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
                description="A vitrine usa a versão processada quando ela existe; o processamento ainda não é feito neste app."
                value={draft.hero.removeBackground}
                disabled
                onValueChange={() => undefined}
              />
              <Button
                title="Ajustar posição e tamanho"
                variant="outline"
                disabled={draft.hero.featuredItems.length === 0}
                onPress={() => setTransformVisible(true)}
                icon={<AppIcon name="options-outline" size={19} color={colors.rose} />}
              />
              <UploadButton
                title="Imagem alternativa para telas pequenas"
                image={draft.hero.smallScreenAlternativeUrl}
                onPress={() => void pickImage("small")}
                onRemove={() =>
                  setDraft((current) => ({
                    ...current,
                    hero: { ...current.hero, smallScreenAlternativeUrl: null },
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
                  label="Assinatura curta"
                  value={draft.hero.shortSignature}
                  maxLength={STOREFRONT_SIGNATURE_LIMIT}
                  error={errors.shortSignature}
                  onChangeText={(shortSignature) =>
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, shortSignature },
                    }))
                  }
                />
                <FieldHint
                  value={draft.hero.shortSignature}
                  limit={STOREFRONT_SIGNATURE_LIMIT}
                />
              </View>
              <View style={{ gap: 6 }}>
                <Input
                  label="Texto do botão"
                  value={draft.hero.action.label}
                  maxLength={STOREFRONT_ACTION_LABEL_LIMIT}
                  error={errors.heroActionLabel}
                  onChangeText={(label) =>
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, action: { ...current.hero.action, label } },
                    }))
                  }
                />
                <FieldHint
                  value={draft.hero.action.label}
                  limit={STOREFRONT_ACTION_LABEL_LIMIT}
                />
              </View>
              <ChoiceGroup
                label="Tipo de ação"
                columns={2}
                value={draft.hero.action.type}
                onChange={(type) =>
                  setDraft((current) => ({
                    ...current,
                    hero: { ...current.hero, action: { ...current.hero.action, type } },
                  }))
                }
                options={[
                  { value: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
                  { value: "quote", label: "Orçamento", icon: "document-text-outline" },
                  { value: "schedule", label: "Agendamento", icon: "calendar-outline" },
                  { value: "externalLink", label: "Link externo", icon: "link-outline" },
                  { value: "none", label: "Sem ação" },
                ]}
              />
              {draft.hero.action.type === "externalLink" ? (
                <Input
                  label="Destino da ação"
                  value={draft.hero.action.destination ?? ""}
                  error={errors.heroActionDestination}
                  autoCapitalize="none"
                  onChangeText={(destination) =>
                    setDraft((current) => ({
                      ...current,
                      hero: {
                        ...current.hero,
                        action: { ...current.hero.action, destination },
                      },
                    }))
                  }
                />
              ) : null}
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
              <SwitchRow
                label="Mostrar faixa promocional"
                value={draft.hero.showPromotionalBar}
                onValueChange={(showPromotionalBar) =>
                  setDraft((current) => ({
                    ...current,
                    hero: { ...current.hero, showPromotionalBar },
                  }))
                }
              />
            </EditorCard>
            <SectionHeading
              title="Informações rápidas"
              description="Mostre até 3 detalhes importantes abaixo do topo."
            />
            <EditorCard>
              {[...draft.hero.quickInfo]
                .sort((a, b) => a.order - b.order)
                .map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: wide ? "row" : "column",
                      gap: 8,
                      alignItems: wide ? "center" : "stretch",
                    }}
                  >
                    <Input
                      value={item.label}
                      maxLength={48}
                      onChangeText={(label) =>
                        setDraft((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            quickInfo: current.hero.quickInfo.map((entry) =>
                              entry.id === item.id ? { ...entry, label } : entry,
                            ),
                          },
                        }))
                      }
                      containerStyle={{ flex: 1 }}
                    />
                    <Button
                      title={item.enabled ? "Visível" : "Oculta"}
                      variant={item.enabled ? "secondary" : "outline"}
                      compact
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            quickInfo: current.hero.quickInfo.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, enabled: !entry.enabled }
                                : entry,
                            ),
                          },
                        }))
                      }
                    />
                    <Button
                      title="↑"
                      variant="outline"
                      compact
                      disabled={index === 0}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            quickInfo: [...current.hero.quickInfo]
                              .sort((a, b) => a.order - b.order)
                              .map((entry, position, all) =>
                                position === index
                                  ? { ...all[index - 1], order: index }
                                  : position === index - 1
                                    ? { ...all[index], order: index - 1 }
                                    : { ...entry, order: position },
                              ),
                          },
                        }))
                      }
                    />
                    <Button
                      title="Remover"
                      variant="text"
                      compact
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          hero: {
                            ...current.hero,
                            quickInfo: current.hero.quickInfo
                              .filter((entry) => entry.id !== item.id)
                              .map((entry, order) => ({ ...entry, order })),
                          },
                        }))
                      }
                    />
                  </View>
                ))}
              <Button
                title="Adicionar informação"
                variant="text"
                disabled={draft.hero.quickInfo.length >= 3}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    hero: {
                      ...current.hero,
                      quickInfo: [
                        ...current.hero.quickInfo,
                        {
                          id: `quick:${Date.now()}`,
                          icon: "sparkles",
                          label: "Nova informação",
                          order: current.hero.quickInfo.length,
                          enabled: true,
                        },
                      ],
                    },
                  }))
                }
                icon={<AppIcon name="add" size={18} color={colors.rose} />}
              />
            </EditorCard>
            <EditorCard>
              <Typography style={{ color: colors.ink, fontFamily: fonts.bold }}>
                Configurações avançadas
              </Typography>
              <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                As cores antigas de título e descrição continuam preservadas no backend
                para compatibilidade, mas o contraste agora é calculado pela prévia
                compartilhada.
              </Typography>
            </EditorCard>
          </>
        ) : null}

        {step === "organization" && section === "content" ? (
          <>
            <SectionHeading
              title="Conteúdo da vitrine"
              description="Escolha o que seus clientes podem encontrar."
            />
            <EditorCard>
              <SwitchRow
                label="Produtos"
                description={`${counts.products} publicados`}
                value={draft.organization.content.showProducts}
                onValueChange={(showProducts) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      content: { ...current.organization.content, showProducts },
                    },
                  }))
                }
              />
              <SwitchRow
                label="Serviços"
                description={`${counts.services} publicados`}
                value={draft.organization.content.showServices}
                onValueChange={(showServices) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      content: { ...current.organization.content, showServices },
                    },
                  }))
                }
              />
              <SwitchRow
                label="Categorias"
                description={`${categories.length} encontradas`}
                value={draft.organization.content.showCategories}
                onValueChange={(showCategories) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      content: { ...current.organization.content, showCategories },
                    },
                  }))
                }
              />
              {errors.visibleContent ? (
                <Typography style={{ color: theme.colors.alert, fontSize: 12 }}>
                  {errors.visibleContent}
                </Typography>
              ) : null}
              <ChoiceGroup
                label="Seção inicial"
                value={draft.organization.content.initialSection}
                onChange={(initialSection) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      content: { ...current.organization.content, initialSection },
                    },
                  }))
                }
                options={[
                  { value: "all", label: "Todos" },
                  { value: "products", label: "Produtos" },
                  { value: "services", label: "Serviços" },
                ]}
              />
              <Typography
                style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
              >
                Ordem das seções
              </Typography>
              {draft.organization.content.sectionOrder.map((item, index) => (
                <CompactReorderRow
                  key={item}
                  label={
                    item === "products"
                      ? "Produtos"
                      : item === "services"
                        ? "Serviços"
                        : "Categorias"
                  }
                  index={index}
                  last={index === draft.organization.content.sectionOrder.length - 1}
                  onMoveUp={() =>
                    setDraft((current) => {
                      const order = [...current.organization.content.sectionOrder];
                      [order[index - 1], order[index]] = [order[index], order[index - 1]];
                      return {
                        ...current,
                        organization: {
                          ...current.organization,
                          content: {
                            ...current.organization.content,
                            sectionOrder: order,
                          },
                        },
                      };
                    })
                  }
                  onMoveDown={() =>
                    setDraft((current) => {
                      const order = [...current.organization.content.sectionOrder];
                      [order[index + 1], order[index]] = [order[index], order[index + 1]];
                      return {
                        ...current,
                        organization: {
                          ...current.organization,
                          content: {
                            ...current.organization.content,
                            sectionOrder: order,
                          },
                        },
                      };
                    })
                  }
                />
              ))}
            </EditorCard>
            <SectionHeading
              title="Navegação e descoberta"
              description="Facilite a busca pelo que você oferece."
            />
            <EditorCard>
              <SwitchRow
                label="Mostrar campo de busca"
                value={draft.organization.discovery.showSearch}
                onValueChange={(showSearch) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      discovery: { ...current.organization.discovery, showSearch },
                    },
                  }))
                }
              />
              <SwitchRow
                label="Mostrar categorias"
                value={draft.organization.discovery.showCategories}
                onValueChange={(showCategories) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      discovery: { ...current.organization.discovery, showCategories },
                    },
                  }))
                }
              />
              <SwitchRow
                label="Permitir filtros"
                value={draft.organization.discovery.allowFilters}
                onValueChange={(allowFilters) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      discovery: { ...current.organization.discovery, allowFilters },
                    },
                  }))
                }
              />
              <SwitchRow
                label="Permitir ordenação"
                value={draft.organization.discovery.allowSorting}
                onValueChange={(allowSorting) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      discovery: { ...current.organization.discovery, allowSorting },
                    },
                  }))
                }
              />
              <ChoiceGroup
                label="Ordenação padrão"
                columns={2}
                value={draft.organization.discovery.defaultSort}
                onChange={(defaultSort) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      discovery: { ...current.organization.discovery, defaultSort },
                    },
                  }))
                }
                options={[
                  { value: "featured", label: "Destaques primeiro" },
                  { value: "name", label: "Nome" },
                  { value: "priceLow", label: "Menor preço" },
                  { value: "priceHigh", label: "Maior preço" },
                ]}
              />
              <Typography
                style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
              >
                Categorias visíveis
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categories.map((category) => {
                  const selected =
                    draft.organization.discovery.visibleCategoryIds.length === 0 ||
                    draft.organization.discovery.visibleCategoryIds.includes(category);
                  return (
                    <Button
                      key={category}
                      title={category}
                      variant={selected ? "secondary" : "outline"}
                      compact
                      onPress={() =>
                        setDraft((current) => {
                          const currentIds =
                            current.organization.discovery.visibleCategoryIds.length === 0
                              ? categories
                              : current.organization.discovery.visibleCategoryIds;
                          const visibleCategoryIds = currentIds.includes(category)
                            ? currentIds.filter((id) => id !== category)
                            : [...currentIds, category];
                          return {
                            ...current,
                            organization: {
                              ...current.organization,
                              discovery: {
                                ...current.organization.discovery,
                                visibleCategoryIds,
                              },
                            },
                          };
                        })
                      }
                    />
                  );
                })}
                {categories.length === 0 ? (
                  <Typography style={{ color: colors.warmGray, fontSize: 12 }}>
                    Nenhuma categoria cadastrada.
                  </Typography>
                ) : null}
              </View>
              <Typography
                style={{ color: colors.ink, fontFamily: fonts.semiBold, fontSize: 13 }}
              >
                Reordenar categorias
              </Typography>
              {(draft.organization.discovery.categoryOrder.length
                ? draft.organization.discovery.categoryOrder
                : categories
              ).map((category, index, order) => (
                <CompactReorderRow
                  key={category}
                  label={category}
                  index={index}
                  last={index === order.length - 1}
                  onMoveUp={() =>
                    setDraft((current) => {
                      const next = [
                        ...(current.organization.discovery.categoryOrder.length
                          ? current.organization.discovery.categoryOrder
                          : categories),
                      ];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return {
                        ...current,
                        organization: {
                          ...current.organization,
                          discovery: {
                            ...current.organization.discovery,
                            categoryOrder: next,
                          },
                        },
                      };
                    })
                  }
                  onMoveDown={() =>
                    setDraft((current) => {
                      const next = [
                        ...(current.organization.discovery.categoryOrder.length
                          ? current.organization.discovery.categoryOrder
                          : categories),
                      ];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      return {
                        ...current,
                        organization: {
                          ...current.organization,
                          discovery: {
                            ...current.organization.discovery,
                            categoryOrder: next,
                          },
                        },
                      };
                    })
                  }
                />
              ))}
            </EditorCard>
            <EditorCard>
              <SectionHeading title="Resumo" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {[
                  {
                    icon: "bag-handle-outline" as const,
                    value: counts.products,
                    label: "produtos",
                  },
                  {
                    icon: "person-outline" as const,
                    value: counts.services,
                    label: "serviços",
                  },
                  {
                    icon: "apps-outline" as const,
                    value: categories.length,
                    label: "categorias",
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: 1,
                      minWidth: 150,
                      minHeight: 60,
                      borderRadius: 13,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 9,
                    }}
                  >
                    <AppIcon name={item.icon} size={20} color={colors.wine} />
                    <Typography style={{ color: colors.ink, fontFamily: fonts.bold }}>
                      {item.value} {item.label}
                    </Typography>
                  </View>
                ))}
              </View>
              <Button
                title="Continuar para cards e ações"
                variant="outline"
                onPress={() => navigate("organization", "cards-actions")}
                icon={<AppIcon name="arrow-forward" size={18} color={colors.rose} />}
              />
            </EditorCard>
          </>
        ) : null}

        {step === "organization" && section === "cards-actions" ? (
          <>
            <SectionHeading
              title="Estilo dos cards"
              description="Escolha como seus itens serão exibidos."
            />
            <EditorCard>
              <View
                accessibilityRole="radiogroup"
                style={{ flexDirection: wide ? "row" : "column", gap: 10 }}
              >
                <StyleOption
                  value="editorial"
                  selected={draft.organization.cards.style === "editorial"}
                  title="Editorial"
                  description="Imagem ampla, texto e ação bem visíveis."
                  onSelect={(style) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, style },
                      },
                    }))
                  }
                >
                  <View style={{ flex: 1, padding: 6, gap: 4 }}>
                    <View style={{ height: 18, borderRadius: 6, backgroundColor: colors.softRose }} />
                    <View style={{ height: 5, width: "70%", borderRadius: 4, backgroundColor: colors.wine }} />
                    <View style={{ height: 8, width: 40, borderRadius: 5, backgroundColor: colors.rose }} />
                  </View>
                </StyleOption>
                <StyleOption
                  value="compact"
                  selected={draft.organization.cards.style === "compact"}
                  title="Compacto"
                  description="Lista objetiva, com menos altura por item."
                  onSelect={(style) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, style },
                      },
                    }))
                  }
                >
                  <View style={{ flex: 1, padding: 8, justifyContent: "center", gap: 5 }}>
                    <View style={{ height: 8, width: "80%", borderRadius: 4, backgroundColor: colors.wine }} />
                    <View style={{ height: 8, width: "60%", borderRadius: 4, backgroundColor: colors.border }} />
                  </View>
                </StyleOption>
              </View>
              <View style={{ gap: 2 }}>
                <SwitchRow
                  label="Mostrar preço"
                  value={draft.organization.cards.showPrice}
                  onValueChange={(showPrice) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, showPrice },
                      },
                    }))
                  }
                />
                <SwitchRow
                  label="Mostrar detalhes do item"
                  value={draft.organization.cards.showDetails}
                  onValueChange={(showDetails) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, showDetails },
                      },
                    }))
                  }
                />
                <SwitchRow
                  label="Mostrar disponibilidade"
                  value={draft.organization.cards.showAvailability}
                  onValueChange={(showAvailability) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, showAvailability },
                      },
                    }))
                  }
                />
              </View>
              <View style={{ gap: 10, paddingTop: 4 }}>
              <ChoiceGroup
                label="Quando não houver preço"
                columns={2}
                value={draft.organization.cards.missingPriceBehavior}
                onChange={(missingPriceBehavior) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      cards: { ...current.organization.cards, missingPriceBehavior },
                    },
                  }))
                }
                options={[
                  { value: "consult", label: "Mostrar “Consultar”" },
                  { value: "hidden", label: "Ocultar preço" },
                  { value: "custom", label: "Texto personalizado" },
                ]}
              />
              {draft.organization.cards.missingPriceBehavior === "custom" ? (
                <Input
                  label="Texto personalizado"
                  value={draft.organization.cards.missingPriceText}
                  maxLength={30}
                  onChangeText={(missingPriceText) =>
                    setDraft((current) => ({
                      ...current,
                      organization: {
                        ...current.organization,
                        cards: { ...current.organization.cards, missingPriceText },
                      },
                    }))
                  }
                />
              ) : null}
              </View>
            </EditorCard>
            <SectionHeading
              title="Ações nos cards"
              description="Defina como cada produto ou serviço conduz o cliente."
            />
            <EditorCard>
              <ChoiceGroup
                label="Modo de ação"
                columns={2}
                value={draft.organization.actions.mode}
                onChange={(mode) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      actions: { ...current.organization.actions, mode },
                    },
                  }))
                }
                options={[
                  { value: "perItem", label: "Usar a ação de cada item" },
                  { value: "default", label: "Usar uma ação padrão" },
                  { value: "hidden", label: "Não mostrar ações" },
                ]}
              />
              {draft.organization.actions.mode !== "hidden" ? (
                <View style={{ flexDirection: wide ? "row" : "column", gap: 22 }}>
                  <ActionEditor
                    title="Ação padrão para produtos"
                    value={draft.organization.actions.productDefault}
                    allowed={[
                      "order",
                      "preorder",
                      "quote",
                      "details",
                      "contact",
                      "externalLink",
                      "none",
                    ]}
                    onChange={(productDefault) =>
                      setDraft((current) => ({
                        ...current,
                        organization: {
                          ...current.organization,
                          actions: { ...current.organization.actions, productDefault },
                        },
                      }))
                    }
                  />
                  <ActionEditor
                    title="Ação padrão para serviços"
                    value={draft.organization.actions.serviceDefault}
                    allowed={[
                      "schedule",
                      "quote",
                      "contact",
                      "details",
                      "externalLink",
                      "none",
                    ]}
                    onChange={(serviceDefault) =>
                      setDraft((current) => ({
                        ...current,
                        organization: {
                          ...current.organization,
                          actions: { ...current.organization.actions, serviceDefault },
                        },
                      }))
                    }
                  />
                </View>
              ) : null}
            </EditorCard>
            <SectionHeading title="Ações configuradas" />
            <EditorCard>
              {draft.organization.actions.mode === "perItem" &&
              Object.keys(draft.organization.actions.itemOverrides).length === 0 ? (
                <View
                  accessibilityLiveRegion="polite"
                  style={{
                    borderRadius: 12,
                    backgroundColor: colors.softRose,
                    padding: 12,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <AppIcon name="alert-circle-outline" size={16} color={colors.rose} />
                  <Typography style={{ color: colors.ink, fontSize: 12, flex: 1 }}>
                    Nenhuma ação individual foi definida. Toque em um item para
                    personalizar, ou use uma ação padrão.
                  </Typography>
                </View>
              ) : null}
              {[
                ...products
                  .filter((item) => item.isActive && item.publicEnabled)
                  .map((item) => ({ kind: "product" as const, item })),
                ...services
                  .filter((item) => item.active && item.publicEnabled)
                  .map((item) => ({ kind: "service" as const, item })),
              ]
                .slice(0, 8)
                .map(({ kind, item }) => {
                  const key = `${kind}:${item.id}`;
                  const override = draft.organization.actions.itemOverrides[key];
                  const fallback =
                    kind === "product"
                      ? draft.organization.actions.productDefault
                      : draft.organization.actions.serviceDefault;
                  const assigned = override ?? fallback;
                  return (
                    <View
                      key={key}
                      style={{
                        minHeight: 58,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          backgroundColor: colors.softRose,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {kind === "product" && item.photoUrl ? (
                          <Image
                            source={{ uri: item.photoUrl }}
                            style={{ width: "100%", height: "100%", borderRadius: 10 }}
                          />
                        ) : (
                          <AppIcon
                            name={
                              kind === "product" ? "bag-handle-outline" : "person-outline"
                            }
                            size={20}
                            color={colors.wine}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography
                          numberOfLines={1}
                          style={{
                            color: colors.ink,
                            fontFamily: fonts.semiBold,
                            fontSize: 13,
                          }}
                        >
                          {displayCatalogItemName(item.name)}
                        </Typography>
                        <Typography style={{ color: colors.warmGray, fontSize: 11 }}>
                          {kind === "product" ? "Produto" : "Serviço"} •{" "}
                          {override ? "ação individual" : "ação padrão"}
                          {assigned.channel ? ` • ${assigned.channel}` : ""}
                        </Typography>
                      </View>
                      <Button
                        title={
                          assigned.label ||
                          ACTION_OPTIONS.find((option) => option.value === assigned.type)
                            ?.label ||
                          "Sem ação"
                        }
                        variant={override ? "secondary" : "outline"}
                        compact
                        onPress={() => {
                          const allowed =
                            kind === "product"
                              ? [
                                  "order",
                                  "preorder",
                                  "quote",
                                  "details",
                                  "contact",
                                  "none",
                                ]
                              : ["schedule", "quote", "contact", "details", "none"];
                          const currentIndex = allowed.indexOf(assigned.type);
                          const nextType = allowed[
                            (currentIndex + 1) % allowed.length
                          ] as CatalogItemAction["type"];
                          const label = ACTION_OPTIONS.find(
                            (option) => option.value === nextType,
                          )?.label;
                          setDraft((current) => ({
                            ...current,
                            organization: {
                              ...current.organization,
                              actions: {
                                ...current.organization.actions,
                                itemOverrides: {
                                  ...current.organization.actions.itemOverrides,
                                  [key]: { ...assigned, type: nextType, label },
                                },
                              },
                            },
                          }));
                        }}
                      />
                    </View>
                  );
                })}
              {counts.products + counts.services === 0 ? (
                <Typography
                  style={{
                    color: colors.warmGray,
                    textAlign: "center",
                    paddingVertical: 20,
                  }}
                >
                  Cadastre produtos ou serviços para configurar ações individuais.
                </Typography>
              ) : null}
              <Typography style={{ color: colors.warmGray, fontSize: 11 }}>
                Toque na ação para alternar. A configuração específica sempre tem
                precedência sobre o padrão.
              </Typography>
              <Button
                title="Continuar para publicação"
                onPress={() => navigate("organization", "publication")}
              />
            </EditorCard>
          </>
        ) : null}

        {step === "organization" && section === "publication" ? (
          <>
            <SectionHeading
              title="Contato e conversão"
              description="Defina como seus clientes entram em contato."
            />
            <EditorCard>
              <SwitchRow
                label="Contato flutuante"
                value={draft.organization.contact.floatingEnabled}
                onValueChange={(floatingEnabled) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      contact: { ...current.organization.contact, floatingEnabled },
                    },
                  }))
                }
              />
              <ChoiceGroup
                label="Canal principal"
                columns={2}
                value={draft.organization.contact.channel}
                onChange={(channel) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      contact: { ...current.organization.contact, channel },
                    },
                  }))
                }
                options={[
                  { value: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
                  { value: "phone", label: "Telefone", icon: "call-outline" },
                  { value: "email", label: "E-mail", icon: "mail-outline" },
                  { value: "external", label: "Link externo", icon: "link-outline" },
                ]}
              />
              <Input
                label={
                  draft.organization.contact.channel === "whatsapp"
                    ? "Número conectado"
                    : "Destino"
                }
                value={draft.organization.contact.destination}
                keyboardType={
                  draft.organization.contact.channel === "whatsapp"
                    ? "phone-pad"
                    : "default"
                }
                error={errors.whatsapp}
                onChangeText={(destination) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      contact: {
                        ...current.organization.contact,
                        destination:
                          current.organization.contact.channel === "whatsapp"
                            ? formatCatalogWhatsapp(destination)
                            : destination,
                      },
                    },
                  }))
                }
              />
              <Input
                label="Ação padrão da vitrine"
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
              <SwitchRow
                label="Manter ação visível ao rolar"
                value={draft.organization.contact.keepVisibleOnScroll}
                onValueChange={(keepVisibleOnScroll) =>
                  setDraft((current) => ({
                    ...current,
                    organization: {
                      ...current.organization,
                      contact: { ...current.organization.contact, keepVisibleOnScroll },
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
                  title="Copiar link"
                  variant="outline"
                  disabled={!slugAvailable}
                  onPress={() =>
                    void Clipboard.setStringAsync(catalogUrl).then(() =>
                      showToast("Link copiado!"),
                    )
                  }
                  icon={<AppIcon name="clipboard-outline" size={16} color={colors.rose} />}
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
                  icon={<AppIcon name="qr-code-outline" size={16} color={colors.rose} />}
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
                const attention =
                  item.id === "actions" &&
                  draft.organization.actions.mode === "perItem" &&
                  Object.keys(draft.organization.actions.itemOverrides).length === 0;
                return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => navigate(item.step, item.section)}
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
                      backgroundColor: item.valid
                        ? colors.lime
                        : attention
                          ? colors.softRose
                          : colors.surface,
                    }}
                  >
                    <AppIcon
                      name={item.valid ? "checkmark" : "alert-circle-outline"}
                      size={14}
                      color={
                        item.valid ? colors.onLime : attention ? colors.rose : colors.warmGray
                      }
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
          <View style={{ gap: 10 }}>
            <Button
              title="Ver prévia"
              variant="outline"
              onPress={() => void openPreview()}
              icon={<AppIcon name="eye-outline" size={19} color={colors.rose} />}
            />
            <Button
              title={
                section === "publication" && step === "organization"
                  ? requestStatus === "publishing"
                    ? "Publicando..."
                    : "Salvar e publicar"
                  : requestStatus === "saving"
                    ? "Salvando..."
                    : "Salvar alterações"
              }
              loading={requestStatus === "saving" || requestStatus === "publishing"}
              disabled={
                section === "publication" && step === "organization"
                  ? !publishingReady || update.isPending
                  : !canSave
              }
              onPress={() =>
                void persist(step === "organization" && section === "publication")
              }
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
          paddingVertical: 10,
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
            onPress={() => void openPreview()}
            icon={<AppIcon name="eye-outline" size={19} color={colors.rose} />}
            style={isDesktop ? desktopAction(true, 200) : { flex: 1 }}
          />
          <Button
            title={
              section === "publication" && step === "organization"
                ? requestStatus === "publishing"
                  ? "Publicando..."
                  : "Salvar e publicar"
                : requestStatus === "saving"
                  ? "Salvando..."
                  : "Salvar alterações"
            }
            loading={requestStatus === "saving" || requestStatus === "publishing"}
            disabled={
              section === "publication" && step === "organization"
                ? !publishingReady || update.isPending
                : !canSave
            }
            onPress={() =>
              void persist(step === "organization" && section === "publication")
            }
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
      <TransformEditor
        visible={transformVisible}
        featured={draft.hero.featuredItems}
        onChange={(featuredItems) =>
          setDraft((current) => ({
            ...current,
            hero: { ...current.hero, featuredItems },
          }))
        }
        onClose={() => setTransformVisible(false)}
      />
      <PreviewModal
        visible={previewVisible}
        html={previewHtml}
        loading={previewLoading}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewLoading(false);
        }}
      >
        <StorefrontFinalPreview {...previewProps} />
      </PreviewModal>
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
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
                title="Copiar link"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() =>
                  void Clipboard.setStringAsync(catalogUrl).then(() =>
                    showToast("Link copiado!"),
                  )
                }
              />
              <Button
                title="Compartilhar"
                style={{ flex: 1 }}
                onPress={() => void Share.share({ message: catalogUrl })}
              />
            </View>
            <Button title="Fechar" variant="text" onPress={() => setQrVisible(false)} />
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
