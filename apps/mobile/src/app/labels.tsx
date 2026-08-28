import { hasActiveFeature, type Label, type LabelData } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  EmptyState,
  fonts,
  fontSizes,
  Input,
  radii,
  spacing,
  Typography,
  useBrand,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { publicCatalogProductUrl } from "../features/catalog/api";
import { useCatalogSettings } from "../features/catalog/hooks";
import { CreateLabelForm } from "../features/labels/components/create-label-form";
import { LabelCard } from "../features/labels/components/label-card";
import { LabelLayoutEditor } from "../features/labels/components/label-layout-editor";
import { LabelPreview } from "../features/labels/components/label-preview";
import { LabelProductPicker } from "../features/labels/components/label-product-picker";
import { LabelStyleEditor } from "../features/labels/components/label-style-editor";
import { TemplatePicker } from "../features/labels/components/template-picker";
import { brToIso, isoToBR } from "../features/labels/dates";
import {
  LABEL_LIST_FILTERS,
  labelCategory,
  labelsHeroIllustrationWidth,
  labelsHeroPanelHeight,
  mostUsedLabelId,
  visibleLabels,
  type LabelListFilter,
} from "../features/labels/domain";
import { exportLabelPdfWithChoice } from "../features/labels/label-export";
import {
  useDeleteLabel,
  useLabel,
  useLabels,
  useUpdateLabel,
} from "../features/labels/hooks";
import { useAllProducts } from "../features/products/hooks";
import { useProfile } from "../features/subscription/hooks";
import { AppIcon } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { DateField } from "../shared/components/date-field";
import { FormSection } from "../shared/components/form-section";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton, SkeletonList } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { useBrandIllustration } from "../shared/brand-illustrations";
import { brandScreenPalette } from "../shared/brand-palette";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { usePaywall } from "../shared/hooks/use-paywall";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { maskPhoneBR } from "../shared/utils/phone";
import { uploadLabelLogo } from "../shared/utils/upload-image";

function LabelDetailModal({
  labelId,
  visible,
  onClose,
  startInEdit = false,
}: Readonly<{
  labelId: string;
  visible: boolean;
  onClose: () => void;
  startInEdit?: boolean;
}>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((state) => state.show);
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "labelsPremium");
  const { data: label, isLoading } = useLabel(labelId);
  const { data: catalogSettings } = useCatalogSettings();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({ productName: "" });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [includeQr, setIncludeQr] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [layoutValid, setLayoutValid] = useState(true);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const { imageUri: newLogo, showPicker, clear: clearPickedLogo } = useImagePicker();
  const editingLogo = newLogo ?? (logoRemoved ? null : (label?.logoUrl ?? null));
  const generatedQrUrl =
    catalogSettings && selectedProductId
      ? publicCatalogProductUrl(catalogSettings.slug, selectedProductId)
      : undefined;
  const savedQrUrl =
    label?.productId === selectedProductId ? (label.qrCodeUrl ?? undefined) : undefined;
  const editingQrUrl = includeQr ? (generatedQrUrl ?? savedQrUrl) : undefined;

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((previous) => ({ ...previous, [key]: value }));
  }

  function startEditing(current: Label) {
    setName(current.name);
    setTemplateId(current.templateId);
    setSelectedProductId(current.productId);
    setIncludeQr(Boolean(current.qrCodeUrl));
    setLabelData({
      ...current.data,
      manufacturingDate: isoToBR(current.data.manufacturingDate),
      expirationDate: isoToBR(current.data.expirationDate),
    });
    setLogoRemoved(false);
    clearPickedLogo();
    setEditing(true);
  }

  const startedEdit = useRef(false);
  useEffect(() => {
    startedEdit.current = false;
  }, [labelId]);
  useEffect(() => {
    if (!startInEdit || !label || startedEdit.current) return;
    startedEdit.current = true;
    startEditing(label);
  }, [startInEdit, label]);

  function validateDates(): {
    manufacturingDate?: string;
    expirationDate?: string;
  } | null {
    const manufacturingDate = brToIso(labelData.manufacturingDate ?? "");
    const expirationDate = brToIso(labelData.expirationDate ?? "");
    if (
      (labelData.manufacturingDate?.trim() && !manufacturingDate) ||
      (labelData.expirationDate?.trim() && !expirationDate)
    ) {
      showAlert({
        title: "Data incompleta",
        message: "Confira as datas no formato DD/MM/AAAA.",
      });
      return null;
    }
    if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
      showAlert({
        title: "Datas invertidas",
        message: "A validade não pode ser anterior à data de produção.",
      });
      return null;
    }
    return { manufacturingDate, expirationDate };
  }

  async function resolveLogoUrl(): Promise<string | null | undefined> {
    if (!newLogo) return logoRemoved ? null : undefined;
    try {
      setUploading(true);
      return await uploadLabelLogo(newLogo);
    } catch {
      showAlert({
        title: "Logo não enviado",
        message: "Não consegui enviar o novo logo. Vou manter o anterior.",
      });
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      alertValidation("Dê um nome para a etiqueta");
      return;
    }
    if (!selectedProductId) {
      alertValidation("Escolha o produto da etiqueta");
      return;
    }
    if (!labelData.productName.trim()) {
      alertValidation("Preencha o nome que será impresso");
      return;
    }
    if (!layoutValid) {
      alertValidation("Confira o tamanho e a quantidade de etiquetas por folha");
      return;
    }
    const dates = validateDates();
    if (!dates) return;
    const logoUrl = await resolveLogoUrl();

    try {
      await updateLabel.mutateAsync({
        id: labelId,
        data: {
          name: name.trim(),
          templateId,
          productId: selectedProductId,
          data: { ...labelData, ...dates },
          qrCodeUrl: editingQrUrl ?? null,
          ...(logoUrl !== undefined ? { logoUrl } : {}),
        },
      });
      showAlert({ title: "Etiqueta atualizada!" });
      setEditing(false);
    } catch (error) {
      showAlert({
        title: "Erro",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a etiqueta.",
      });
    }
  }

  async function handleExport(current: Label) {
    setExporting(true);
    try {
      await exportLabelPdfWithChoice(
        current.data,
        current.templateId,
        current.logoUrl,
        current.qrCodeUrl,
      );
    } catch {
      alertError("Não foi possível gerar a etiqueta. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleDelete() {
    showAlert({
      title: "Excluir etiqueta",
      message: "Tem certeza que deseja excluir esta etiqueta?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteLabel
              .mutateAsync(labelId)
              .then(() => onClose())
              .catch(() => alertError("Não foi possível excluir."));
          },
        },
      ],
    });
  }

  let footerButtons: React.ReactNode;
  if (!isLoading && label) {
    footerButtons = editing ? (
      <>
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={() => setEditing(false)}
          style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
        />
        <Button
          title={uploading ? "Enviando logo..." : "Salvar"}
          size="lg"
          onPress={() => void handleSave()}
          loading={updateLabel.isPending || uploading}
          style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
        />
      </>
    ) : (
      <>
        <Button
          title="Excluir etiqueta"
          variant="secondary"
          onPress={handleDelete}
          loading={deleteLabel.isPending}
          style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
        />
        <Button
          title="Baixar / Compartilhar"
          size="lg"
          compact
          icon={
            <AppIcon
              name="download-outline"
              size={20}
              color={theme.colors.textOnPrimary}
            />
          }
          onPress={() => void handleExport(label)}
          loading={exporting}
          style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
        />
      </>
    );
  }

  const footer = footerButtons ? (
    <View
      style={{
        flex: 1,
        flexDirection: isDesktop ? "row" : "column",
        gap: spacing.md,
      }}
    >
      {footerButtons}
    </View>
  ) : undefined;

  return (
    <StandardModal
      title={editing ? "Editar etiqueta" : (label?.name ?? "Etiqueta")}
      subtitle={
        !editing && label
          ? `Modelo: ${label.templateId} · Criada em ${new Date(label.createdAt).toLocaleDateString("pt-BR")}`
          : undefined
      }
      visible={visible}
      onClose={onClose}
      wide
      right={
        label && !editing ? (
          <Pressable onPress={() => startEditing(label)} hitSlop={8}>
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Editar
            </Typography>
          </Pressable>
        ) : undefined
      }
      footer={footer}
    >
      {isLoading ? <SkeletonList rows={4} variant="label" /> : null}

      {!isLoading && label && editing ? (
        <View
          style={{
            width: "100%",
            minWidth: 0,
            alignSelf: "stretch",
            gap: isDesktop ? spacing["3xl"] : spacing["2xl"],
          }}
        >
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor: theme.colors.surface,
              padding: spacing.md,
            }}
          >
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Etiqueta para identificar seu produto. Não substitui a rotulagem obrigatória
              quando aplicável.
            </Typography>
          </View>
          <Input label="Nome da etiqueta" value={name} onChangeText={setName} />
          <LabelProductPicker
            selectedId={selectedProductId}
            onSelect={(product) => {
              setSelectedProductId(product.id);
              updateField("productName", product.name);
            }}
          />
          <TemplatePicker selected={templateId} onSelect={setTemplateId} />
          <FormSection
            title="Formato de impressão"
            subtitle="Tamanho exato e quantidade na folha A4"
            icon="grid-outline"
            titleAccessory={<Badge label="Profissional" variant="premium" />}
          >
            <LabelLayoutEditor
              value={labelData.layout}
              onChange={(layout) => updateField("layout", layout)}
              onValidityChange={setLayoutValid}
              locked={!isPremium}
              onLockedPress={() => showPaywall("labels")}
            />
          </FormSection>
          <Input
            label="Nome que será impresso"
            value={labelData.productName}
            onChangeText={(value) => updateField("productName", value)}
          />
          <Input
            label="Observação (opcional)"
            placeholder="Ex: Manter refrigerado"
            value={labelData.note ?? ""}
            onChangeText={(value) => updateField("note", value)}
            multiline
            numberOfLines={3}
            style={{
              height: 88,
              lineHeight: 24,
              paddingTop: spacing["3xl"],
              paddingBottom: spacing["3xl"],
              textAlignVertical: "center",
            }}
          />
          <View style={{ gap: spacing.md }}>
            <Typography variant="h3">Datas (opcional)</Typography>
            <DateField
              label="Feito em"
              value={labelData.manufacturingDate ?? ""}
              onChange={(value) => updateField("manufacturingDate", value)}
            />
            <DateField
              label="Validade"
              value={labelData.expirationDate ?? ""}
              onChange={(value) => updateField("expirationDate", value)}
            />
          </View>
          <Typography variant="h3">Contato e marca</Typography>
          <Input
            label="Seu nome / nome do negócio"
            value={labelData.producerName ?? ""}
            onChangeText={(value) => updateField("producerName", value)}
          />
          <Input
            label="Telefone"
            value={labelData.producerPhone ?? ""}
            onChangeText={(value) => updateField("producerPhone", maskPhoneBR(value))}
            keyboardType="phone-pad"
          />
          <View>
            <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
              Logo do negócio (opcional)
            </Typography>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Pressable
                onPress={showPicker}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {editingLogo ? (
                  <Image
                    source={{ uri: editingLogo }}
                    style={{ width: 80, height: 80 }}
                  />
                ) : (
                  <AppIcon
                    name="image-outline"
                    size={28}
                    color={theme.colors.textSecondary}
                  />
                )}
              </Pressable>
              {editingLogo ? (
                <Pressable
                  onPress={() => {
                    clearPickedLogo();
                    setLogoRemoved(true);
                  }}
                  hitSlop={8}
                >
                  <Typography variant="caption" color={theme.colors.alert}>
                    Remover logo
                  </Typography>
                </Pressable>
              ) : null}
            </View>
          </View>
          {catalogSettings || label.qrCodeUrl ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">Incluir QR Code do catálogo</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Opcional: abre o produto diretamente no catálogo.
                </Typography>
              </View>
              <Switch
                value={includeQr}
                onValueChange={setIncludeQr}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>
          ) : null}
          <LabelStyleEditor
            value={labelData.style}
            onChange={(style) => updateField("style", style)}
            locked={!isPremium}
            onLockedPress={() => {
              if (isPremium) return false;
              showPaywall("labels");
              return true;
            }}
          />
          <LabelPreview
            data={labelData}
            templateId={templateId}
            logoUrl={editingLogo}
            qrUrl={editingQrUrl}
          />
        </View>
      ) : null}

      {!isLoading && label && !editing ? (
        <View style={{ width: "100%", minWidth: 0, gap: spacing.lg }}>
          <LabelPreview
            data={label.data}
            templateId={label.templateId}
            logoUrl={label.logoUrl}
            qrUrl={label.qrCodeUrl}
            scale={1.2}
          />
        </View>
      ) : null}
    </StandardModal>
  );
}

function LabelsSummary({ totalCount }: Readonly<{ totalCount: number }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width: viewportWidth } = useWindowDimensions();
  const isDesktop = useDesktopLayout();
  const hero = useBrandIllustration("etiquetasHero");
  const compact = viewportWidth < 360;
  const gutter = isDesktop ? 0 : spacing.lg;
  const panelWidth = Math.min(720, Math.max(280, viewportWidth - gutter * 2));
  const panelHeight = labelsHeroPanelHeight(viewportWidth);
  const illustrationWidth = labelsHeroIllustrationWidth(panelWidth);
  const illustrationHeight = Math.min(panelHeight - 8, illustrationWidth);
  const countLabel = totalCount === 1 ? "etiqueta" : "etiquetas";

  return (
    <View
      style={{
        height: panelHeight,
        borderRadius: radii["2xl"],
        backgroundColor: palette.wineFill,
        overflow: "hidden",
        paddingVertical: compact ? spacing.md : spacing.lg,
        paddingLeft: compact ? spacing.md : spacing.lg,
        paddingRight: spacing.sm,
        ...theme.shadows.sm,
      }}
    >
      <View
        style={{
          width: "50%",
          maxWidth: "52%",
          height: "100%",
          zIndex: 1,
          justifyContent: "center",
          gap: spacing.sm,
        }}
      >
        <Typography
          variant="label"
          color={palette.rose}
          numberOfLines={1}
          style={{ fontFamily: fonts.bold, letterSpacing: 1.4 }}
        >
          SUA COLEÇÃO
        </Typography>
        <Typography
          color={palette.onWine}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{
            fontFamily: fonts.extraBold,
            fontSize: compact ? 26 : 32,
            lineHeight: compact ? 30 : 36,
          }}
        >
          {totalCount} {countLabel}
        </Typography>
        <Typography
          color={palette.onWine}
          style={{ fontFamily: fonts.medium, fontSize: compact ? 13 : fontSizes.sm }}
        >
          prontas para imprimir
        </Typography>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: compact ? 0 : 4,
          bottom: 0,
          width: illustrationWidth,
          height: illustrationHeight,
        }}
      >
        <Image
          source={hero}
          resizeMode="contain"
          accessible={false}
          accessibilityElementsHidden
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        height: 44,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: selected ? palette.wineFill : palette.rose,
        backgroundColor: selected ? palette.wineFill : palette.white,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Typography
        variant="bodyBold"
        color={selected ? palette.onWine : palette.ink}
        style={{ fontFamily: selected ? fonts.bold : fonts.semiBold, fontSize: 14 }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function LabelsSkeleton() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width } = useWindowDimensions();
  return (
    <View style={{ gap: spacing.lg }}>
      <Skeleton height={labelsHeroPanelHeight(width)} borderRadius={radii["2xl"]} />
      <Skeleton height={56} borderRadius={18} />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Skeleton width={88} height={44} borderRadius={radii.full} />
        <Skeleton width={108} height={44} borderRadius={radii.full} />
        <Skeleton width={128} height={44} borderRadius={radii.full} />
      </View>
      <View style={{ gap: spacing.md }}>
        {Array.from({ length: 4 }, (_, index) => (
          <View
            key={`label-skeleton-${index}`}
            style={{
              minHeight: 88,
              borderRadius: 18,
              backgroundColor: palette.white,
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              gap: spacing.md,
            }}
          >
            <Skeleton width={64} height={64} borderRadius={radii.md} />
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Skeleton width="58%" height={16} />
              <Skeleton width={72} height={18} borderRadius={radii.full} />
              <Skeleton width="42%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const CREATE_CTA_HEIGHT = 56;

export default function LabelsScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const labelsLabel = useBrand().copy.labelsLabel;
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useLabels({ limit: 100 });
  const { data: products } = useAllProducts();
  const deleteLabel = useDeleteLabel();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<LabelListFilter>("all");
  const backToHome = !router.canGoBack();
  const items = data?.items ?? [];
  const totalCount = data?.total ?? items.length;

  const categoryByProductId = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products ?? []) {
      if (product.category.trim()) map.set(product.id, product.category);
    }
    return map;
  }, [products]);

  const visible = useMemo(
    () => visibleLabels(items, search, listFilter, categoryByProductId),
    [items, search, listFilter, categoryByProductId],
  );
  const mostUsedId = useMemo(() => mostUsedLabelId(items), [items]);
  const contentStyle = {
    ...pageGutter(isDesktop, spacing.lg),
    ...desktopStretch(isDesktop, desktopWidths.data),
  };
  const bottomBarPad = spacing.md + insets.bottom;
  const listBottomPad = spacing.lg;

  function handleBack() {
    if (backToHome) {
      router.replace("/tabs");
      return;
    }
    router.back();
  }

  function openDetail(id: string, edit = false) {
    setEditOnOpen(edit);
    setSelectedId(id);
  }

  function confirmDelete(labelId: string) {
    showAlert({
      title: "Excluir etiqueta",
      message: "Tem certeza que deseja excluir esta etiqueta?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteLabel
              .mutateAsync(labelId)
              .then(() => {
                if (selectedId === labelId) setSelectedId(null);
              })
              .catch(() => alertError("Não foi possível excluir."));
          },
        },
      ],
    });
  }

  async function printLabel(label: Label) {
    try {
      await exportLabelPdfWithChoice(
        label.data,
        label.templateId,
        label.logoUrl,
        label.qrCodeUrl,
      );
    } catch {
      alertError("Não foi possível gerar a etiqueta. Tente novamente.");
    }
  }

  function renderList() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, paddingVertical: spacing.sm, ...contentStyle }}>
          <LabelsSkeleton />
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Algo deu errado"
          description="Não foi possível carregar suas etiquetas."
        />
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          ...contentStyle,
          paddingTop: spacing.sm,
          paddingBottom: listBottomPad,
          gap: spacing.md,
        }}
      >
        <LabelsSummary totalCount={totalCount} />

        {items.length > 0 ? (
          <>
            <View
              style={{
                minHeight: 56,
                height: 56,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: palette.white,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.md,
                gap: spacing.sm,
              }}
            >
              <AppIcon name="search-outline" size={20} color={palette.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar etiqueta"
                placeholderTextColor={palette.muted}
                accessibilityLabel="Buscar etiqueta"
                returnKeyType="search"
                style={{
                  flex: 1,
                  minWidth: 0,
                  color: palette.ink,
                  fontSize: fontSizes.md,
                  fontFamily: fonts.regular,
                  paddingVertical: 0,
                }}
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => setSearch("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name="close-circle" size={20} color={palette.muted} />
                </Pressable>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {LABEL_LIST_FILTERS.map((filter) => (
                <FilterChip
                  key={filter.value}
                  label={filter.label}
                  selected={listFilter === filter.value}
                  onPress={() => setListFilter(filter.value)}
                />
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <AppIcon name="pricetag-outline" size={18} color={palette.ink} />
                <Typography
                  variant="bodyBold"
                  color={palette.ink}
                  style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
                >
                  Suas etiquetas
                </Typography>
              </View>
              <Typography
                variant="caption"
                color={palette.muted}
                style={{ fontFamily: fonts.medium }}
              >
                {visible.length} {visible.length === 1 ? "modelo" : "modelos"}
              </Typography>
            </View>
          </>
        ) : null}

        {items.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center" }}>
            <Typography
              variant="body"
              color={palette.muted}
              style={{ textAlign: "center" }}
            >
              Escolha um produto e crie uma etiqueta pronta para imprimir.
            </Typography>
          </View>
        ) : null}

        {items.length > 0 && visible.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center" }}>
            <Typography
              variant="body"
              color={palette.muted}
              style={{ textAlign: "center" }}
            >
              Nenhuma etiqueta encontrada. Ajuste a busca ou o filtro.
            </Typography>
          </View>
        ) : null}

        {visible.length > 0 ? (
          <View style={{ gap: spacing.md, width: "100%" }}>
            {visible.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                category={labelCategory(label, categoryByProductId)}
                mostUsed={label.id === mostUsedId}
                onPress={() => openDetail(label.id)}
                onEdit={() => openDetail(label.id, true)}
                onPrint={() => void printLabel(label)}
                onDelete={() => confirmDelete(label.id)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background, overflow: "hidden" }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={labelsLabel}
        subtitle="Organize seus rótulos para imprimir quando precisar."
        subtitleNumberOfLines={2}
        onBack={handleBack}
        backLabel={backToHome ? "Ir para o início" : "Voltar"}
        hideBack={isDesktop}
        style={{ gap: spacing.sm, ...pageGutter(isDesktop, spacing.lg) }}
        titleStyle={{ color: palette.ink }}
        subtitleStyle={{ color: palette.muted }}
      />

      <View style={{ flex: 1 }}>{renderList()}</View>

      {!isLoading && !error ? (
        <View
          style={{
            ...contentStyle,
            width: "100%",
            paddingTop: spacing.sm,
            paddingBottom: bottomBarPad,
            backgroundColor: palette.background,
          }}
        >
          <Pressable
            onPress={() => setShowCreate(true)}
            accessibilityRole="button"
            accessibilityLabel="Nova etiqueta"
            style={({ pressed }) => ({
              minHeight: CREATE_CTA_HEIGHT,
              height: CREATE_CTA_HEIGHT,
              borderRadius: 16,
              backgroundColor: palette.rose,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Typography
              color={palette.onWine}
              style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
            >
              + Nova etiqueta
            </Typography>
          </Pressable>
        </View>
      ) : null}

      <CreateLabelForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />

      {selectedId ? (
        <LabelDetailModal
          labelId={selectedId}
          visible
          startInEdit={editOnOpen}
          onClose={() => {
            setSelectedId(null);
            setEditOnOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
