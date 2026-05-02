import type { Label, LabelData } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CreateLabelForm } from "../features/labels/components/create-label-form";
import { LabelPreview } from "../features/labels/components/label-preview";
import { TemplatePicker } from "../features/labels/components/template-picker";
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

  function startEditing(l: Label) {
    setName(l.name);
    setTemplateId(l.templateId);
    setLabelData(l.data);
    setEditing(true);
  }

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Opa!", "De um nome para o rotulo");
      return;
    }
    try {
      await updateLabel.mutateAsync({
        id: labelId,
        data: { name: name.trim(), templateId, data: labelData },
      });
      Alert.alert("Rotulo atualizado!");
      setEditing(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o rotulo.");
    }
  }

  function handleDelete() {
    Alert.alert("Excluir rotulo", "Tem certeza que deseja excluir este rotulo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deleteLabel
            .mutateAsync(labelId)
            .then(() => onClose())
            .catch(() => Alert.alert("Erro", "Nao foi possivel excluir."));
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
            <Typography variant="h2">Editar rotulo</Typography>
            <Input label="Nome do rotulo" value={name} onChangeText={setName} />
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
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input
                label="Fabricacao"
                placeholder="DD/MM/AAAA"
                value={labelData.manufacturingDate ?? ""}
                onChangeText={(v) => updateField("manufacturingDate", v)}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Validade"
                placeholder="DD/MM/AAAA"
                value={labelData.expirationDate ?? ""}
                onChangeText={(v) => updateField("expirationDate", v)}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Input
              label="Seu nome / nome do negocio"
              value={labelData.producerName ?? ""}
              onChangeText={(v) => updateField("producerName", v)}
            />
            <Input
              label="Telefone"
              value={labelData.producerPhone ?? ""}
              onChangeText={(v) => updateField("producerPhone", v)}
              keyboardType="phone-pad"
            />
            <LabelPreview data={labelData} templateId={templateId} />
            <Button
              title="Salvar"
              size="lg"
              onPress={() => {
                handleSave().catch(() => {});
              }}
              loading={updateLabel.isPending}
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
            <LabelPreview data={label.data} templateId={label.templateId} scale={1.2} />
            <View style={{ gap: spacing.md }}>
              <Button
                title="Excluir rotulo"
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
          description="Nao foi possivel carregar seus rotulos."
        />
      );
    }
    if (!data?.items.length) {
      return (
        <EmptyState
          title="Nenhum rotulo ainda"
          description="Crie rotulos para seus produtos"
          action={<Button title="Criar rotulo" onPress={() => setShowCreate(true)} />}
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
      <View style={{ position: "absolute", bottom: 100, right: 20 }}>
        <Button
          title="+ Novo rotulo"
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

      {/* Modal - Criar rotulo */}
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

      {/* Modal - Detalhe do rotulo */}
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
