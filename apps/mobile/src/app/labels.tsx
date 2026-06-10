import type { Label, LabelData } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CreateLabelForm } from "../features/labels/components/create-label-form";
import { LabelPreview } from "../features/labels/components/label-preview";
import { TemplatePicker } from "../features/labels/components/template-picker";
import { exportLabelPdfWithChoice } from "../features/labels/label-export";
import { addDaysToBR, brToIso, isoToBR, maskDateBR } from "../features/labels/dates";
import { cleanNutrition } from "../features/labels/nutrition";
import { NutritionFields } from "../features/labels/components/nutrition-fields";
import { normalizeLink } from "../features/labels/qr";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { maskPhoneBR } from "../shared/utils/phone";
import { uploadLabelLogo } from "../shared/utils/upload-image";
import { Ionicons } from "@expo/vector-icons";
import {
  useDeleteLabel,
  useLabel,
  useLabels,
  useUpdateLabel,
} from "../features/labels/hooks";

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
  const { data: label, isLoading } = useLabel(labelId);
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({ productName: "" });
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [qrLink, setQrLink] = useState("");
  const [shelfDays, setShelfDays] = useState("");
  const { imageUri: newLogo, showPicker, clear: clearPickedLogo } = useImagePicker();

  // Logo exibido na edição: novo escolhido > existente (a menos que removido).
  const editingLogo = newLogo ?? (logoRemoved ? null : (label?.logoUrl ?? null));
  const editingQrUrl = normalizeLink(qrLink);

  async function handleExport(l: Label) {
    setExporting(true);
    try {
      await exportLabelPdfWithChoice(l.data, l.templateId, l.logoUrl, l.qrCodeUrl);
    } catch {
      Alert.alert("Erro", "Não foi possível gerar o rótulo. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function startEditing(l: Label) {
    setName(l.name);
    setTemplateId(l.templateId);
    // datas vêm em ISO do back; no formulário usamos DD/MM/AAAA.
    setLabelData({
      ...l.data,
      manufacturingDate: isoToBR(l.data.manufacturingDate),
      expirationDate: isoToBR(l.data.expirationDate),
    });
    setShelfDays("");
    setLogoRemoved(false);
    setQrLink(l.qrCodeUrl ?? "");
    clearPickedLogo();
    setEditing(true);
  }

  function handleRemoveLogo() {
    clearPickedLogo();
    setLogoRemoved(true);
  }

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((prev) => ({ ...prev, [key]: value }));
  }

  function recomputeExpiration(manufacturing: string, days: string) {
    const n = parseInt(days, 10);
    if (!manufacturing || Number.isNaN(n) || n <= 0) return;
    const expiration = addDaysToBR(manufacturing, n);
    if (expiration) updateField("expirationDate", expiration);
  }

  function handleManufacturingChange(value: string) {
    const masked = maskDateBR(value);
    updateField("manufacturingDate", masked);
    recomputeExpiration(masked, shelfDays);
  }

  function handleShelfDaysChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setShelfDays(digits);
    recomputeExpiration(labelData.manufacturingDate ?? "", digits);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Opa!", "De um nome para o rótulo");
      return;
    }

    // logoUrl: string (novo upload), null (removido) ou undefined (inalterado).
    let logoUrl: string | null | undefined;
    if (newLogo) {
      try {
        setUploading(true);
        logoUrl = await uploadLabelLogo(newLogo);
      } catch {
        Alert.alert(
          "Logo não enviado",
          "Não consegui enviar o novo logo agora. Vou salvar mantendo o logo anterior.",
        );
        logoUrl = undefined;
      } finally {
        setUploading(false);
      }
    } else if (logoRemoved) {
      logoUrl = null;
    }

    try {
      await updateLabel.mutateAsync({
        id: labelId,
        data: {
          name: name.trim(),
          templateId,
          data: {
            ...labelData,
            manufacturingDate: brToIso(labelData.manufacturingDate ?? ""),
            expirationDate: brToIso(labelData.expirationDate ?? ""),
            nutrition: cleanNutrition(labelData.nutrition),
          },
          qrCodeUrl: editingQrUrl ?? null,
          ...(logoUrl !== undefined ? { logoUrl } : {}),
        },
      });
      Alert.alert("Rótulo atualizado!");
      setEditing(false);
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível atualizar o rótulo.",
      );
    }
  }

  function handleDelete() {
    Alert.alert("Excluir rótulo", "Tem certeza que deseja excluir este rótulo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deleteLabel
            .mutateAsync(labelId)
            .then(() => onClose())
            .catch(() => Alert.alert("Erro", "Não foi possível excluir."));
        },
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          <Pressable onPress={onClose}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
          {label && !editing && (
            <Pressable onPress={() => startEditing(label)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Editar
              </Typography>
            </Pressable>
          )}
        </View>

        {isLoading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {!isLoading && label && editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h2">Editar rótulo</Typography>
            <Input label="Nome do rótulo" value={name} onChangeText={setName} />
            <TemplatePicker selected={templateId} onSelect={setTemplateId} />
            <Input
              label="Nome do produto"
              value={labelData.productName}
              onChangeText={(v) => updateField("productName", v)}
            />
            <Input
              label="Ingredientes"
              value={labelData.ingredients ?? ""}
              onChangeText={(v) => updateField("ingredients", v)}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            />
            <NutritionFields
              value={labelData.nutrition}
              onChange={(n) => updateField("nutrition", n)}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input
                label="Fabricacao"
                placeholder="DD/MM/AAAA"
                value={labelData.manufacturingDate ?? ""}
                onChangeText={handleManufacturingChange}
                keyboardType="number-pad"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Validade"
                placeholder="DD/MM/AAAA"
                value={labelData.expirationDate ?? ""}
                onChangeText={(v) => updateField("expirationDate", maskDateBR(v))}
                keyboardType="number-pad"
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Input
              label="Validade em dias (opcional)"
              placeholder="Ex: 7 — preenche a validade sozinho"
              value={shelfDays}
              onChangeText={handleShelfDaysChange}
              keyboardType="number-pad"
            />
            <Input
              label="Seu nome / nome do negócio"
              value={labelData.producerName ?? ""}
              onChangeText={(v) => updateField("producerName", v)}
            />
            <Input
              label="Telefone"
              value={labelData.producerPhone ?? ""}
              onChangeText={(v) => updateField("producerPhone", maskPhoneBR(v))}
              keyboardType="phone-pad"
            />
            <Input
              label="Link do QR Code (opcional)"
              placeholder="Seu Instagram, cardápio ou WhatsApp"
              value={qrLink}
              onChangeText={setQrLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View>
              <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
                Logo do negócio (opcional)
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
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
                    <Ionicons
                      name="image-outline"
                      size={28}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </Pressable>
                {editingLogo && (
                  <Pressable onPress={handleRemoveLogo} hitSlop={8}>
                    <Typography variant="caption" color={theme.colors.primary}>
                      Remover logo
                    </Typography>
                  </Pressable>
                )}
              </View>
            </View>
            <LabelPreview
              data={labelData}
              templateId={templateId}
              logoUrl={editingLogo}
              qrUrl={editingQrUrl}
            />
            <Button
              title={uploading ? "Enviando logo..." : "Salvar"}
              size="lg"
              onPress={() => {
                handleSave().catch(() => {});
              }}
              loading={updateLabel.isPending || uploading}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setEditing(false)}
            />
          </ScrollView>
        )}

        {!isLoading && label && !editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h1">{label.name}</Typography>
            <Typography variant="caption">
              Template: {label.templateId} · Criado em{" "}
              {new Date(label.createdAt).toLocaleDateString("pt-BR")}
            </Typography>
            <LabelPreview
              data={label.data}
              templateId={label.templateId}
              logoUrl={label.logoUrl}
              qrUrl={label.qrCodeUrl}
              scale={1.2}
            />
            <View style={{ gap: spacing.md }}>
              <Button
                title="Baixar / Compartilhar"
                size="lg"
                icon={
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={theme.colors.textOnPrimary}
                  />
                }
                onPress={() => {
                  void handleExport(label);
                }}
                loading={exporting}
              />
              <Button
                title="Excluir rótulo"
                variant="secondary"
                onPress={handleDelete}
                loading={deleteLabel.isPending}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function LabelsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useLabels();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function renderContent() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Algo deu errado"
          description="Não foi possível carregar seus rótulos."
        />
      );
    }
    if (!data?.items.length) {
      return (
        <EmptyState
          title="Nenhum rótulo ainda"
          description="Crie rótulos para seus produtos"
          action={<Button title="Criar rótulo" onPress={() => setShowCreate(true)} />}
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
              }}
            >
              <View style={{ gap: 2 }}>
                <Typography variant="bodyBold">{item.name}</Typography>
                <Typography variant="caption">Template: {item.templateId}</Typography>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderContent()}

      {/* FAB */}
      <View
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      >
        <Button
          title="+ Novo rótulo"
          onPress={() => setShowCreate(true)}
          size="md"
          style={{
            borderRadius: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
      </View>

      {/* Modal - Criar rótulo */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowCreate(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <CreateLabelForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Modal - Detalhe do rótulo */}
      {selectedId && (
        <LabelDetailModal
          labelId={selectedId}
          visible={true}
          onClose={() => setSelectedId(null)}
        />
      )}
    </SafeAreaView>
  );
}
