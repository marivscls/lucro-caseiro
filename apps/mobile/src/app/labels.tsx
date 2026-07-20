import { hasActiveFeature, type Label, type LabelData } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  radii,
  spacing,
  useBrand,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { FlatList, Image, Pressable, Switch, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import labelsEmpty from "../assets/labels-empty.png";
import { publicCatalogProductUrl } from "../features/catalog/api";
import { useCatalogSettings } from "../features/catalog/hooks";
import { CreateLabelForm } from "../features/labels/components/create-label-form";
import { LabelPreview } from "../features/labels/components/label-preview";
import { LabelProductPicker } from "../features/labels/components/label-product-picker";
import { LabelStyleEditor } from "../features/labels/components/label-style-editor";
import { TemplatePicker } from "../features/labels/components/template-picker";
import { brToIso, isoToBR } from "../features/labels/dates";
import { exportLabelPdfWithChoice } from "../features/labels/label-export";
import {
  useDeleteLabel,
  useLabel,
  useLabels,
  useUpdateLabel,
} from "../features/labels/hooks";
import { useProfile } from "../features/subscription/hooks";
import { AppIcon } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { DateField } from "../shared/components/date-field";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { maskPhoneBR } from "../shared/utils/phone";
import { uploadLabelLogo } from "../shared/utils/upload-image";

function LabelDetailModal({
  labelId,
  visible,
  onClose,
}: Readonly<{
  labelId: string;
  visible: boolean;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
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

  let footer: React.ReactNode;
  if (!isLoading && label) {
    footer = editing ? (
      <>
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={() => setEditing(false)}
          style={{ flex: 1 }}
        />
        <Button
          title={uploading ? "Enviando logo..." : "Salvar"}
          size="lg"
          onPress={() => void handleSave()}
          loading={updateLabel.isPending || uploading}
          style={{ flex: 1 }}
        />
      </>
    ) : (
      <>
        <Button
          title="Excluir etiqueta"
          variant="secondary"
          onPress={handleDelete}
          loading={deleteLabel.isPending}
          style={{ flex: 1 }}
        />
        <Button
          title="Baixar / Compartilhar"
          size="lg"
          icon={
            <AppIcon
              name="download-outline"
              size={20}
              color={theme.colors.textOnPrimary}
            />
          }
          onPress={() => void handleExport(label)}
          loading={exporting}
          style={{ flex: 1 }}
        />
      </>
    );
  }

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
      {isLoading ? <SkeletonList rows={4} /> : null}

      {!isLoading && label && editing ? (
        <View style={{ flexShrink: 1, gap: spacing["3xl"] }}>
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
        <View style={{ flexShrink: 1, gap: spacing.lg }}>
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

export default function LabelsScreen() {
  const { theme } = useTheme();
  const labelsLabel = useBrand().copy.labelsLabel;
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useLabels();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function renderContent() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, padding: spacing.xl }}>
          <SkeletonList rows={5} />
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
    if (!data?.items.length) {
      return (
        <EmptyState
          icon={
            <Image
              source={labelsEmpty}
              resizeMode="contain"
              style={{ width: 132, height: 132 }}
            />
          }
          title="Nenhuma etiqueta ainda"
          description="Escolha um produto e crie uma etiqueta pronta para imprimir."
          action={
            <Button
              title="Criar etiqueta"
              variant="outline"
              onPress={() => setShowCreate(true)}
            />
          }
        />
      );
    }
    return (
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        renderItem={({ item }) => (
          <Card onPress={() => setSelectedId(item.id)}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="bodyBold">{item.name}</Typography>
                <Typography variant="caption" numberOfLines={1}>
                  {item.data.productName}
                </Typography>
              </View>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
              </Typography>
            </View>
          </Card>
        )}
      />
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {!isDesktop ? <ScreenHeader title={labelsLabel} /> : null}
      <View style={{ flex: 1 }}>{renderContent()}</View>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm + insets.bottom,
        }}
      >
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            alignSelf: isDesktop ? "flex-end" : undefined,
            width: isDesktop ? 190 : undefined,
            minHeight: isDesktop ? 44 : 56,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primaryInteractive,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppIcon
            name="add"
            size={isDesktop ? 20 : 24}
            color={theme.colors.textOnPrimary}
          />
          <Typography
            variant={isDesktop ? "bodyBold" : "h3"}
            color={theme.colors.textOnPrimary}
          >
            Nova etiqueta
          </Typography>
        </Pressable>
      </View>

      <CreateLabelForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />

      {selectedId ? (
        <LabelDetailModal
          labelId={selectedId}
          visible
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
