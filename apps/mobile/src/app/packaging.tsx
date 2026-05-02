import type { Packaging } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  useTheme,
  spacing,
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

import { CreatePackagingForm } from "../features/packaging/components/create-packaging-form";
import {
  useDeletePackaging,
  usePackaging,
  usePackagingList,
  useUpdatePackaging,
} from "../features/packaging/hooks";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const TYPE_LABELS: Record<string, string> = {
  box: "Caixa",
  bag: "Sacola",
  pot: "Pote",
  film: "Filme",
  label: "Rotulo",
  other: "Outro",
};

const TYPES = [
  { value: "box", label: "Caixa" },
  { value: "bag", label: "Sacola" },
  { value: "pot", label: "Pote" },
  { value: "film", label: "Filme" },
  { value: "label", label: "Rotulo" },
  { value: "other", label: "Outro" },
] as const;

function PackagingDetailModal({
  packagingId,
  visible,
  onClose,
}: Readonly<{
  packagingId: string;
  visible: boolean;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  const { data: pkg, isLoading } = usePackaging(packagingId);
  const updatePackaging = useUpdatePackaging();
  const deletePackaging = useDeletePackaging();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("box");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");

  function startEditing(p: Packaging) {
    setName(p.name);
    setType(p.type);
    setUnitCost(String(p.unitCost).replace(".", ","));
    setSupplier(p.supplier ?? "");
    setEditing(true);
  }

  async function handleSave() {
    const cost = parseFloat(unitCost.replace(",", "."));
    if (!name.trim()) {
      Alert.alert("Opa!", "Coloque o nome da embalagem");
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      Alert.alert("Opa!", "O custo precisa ser maior que zero");
      return;
    }
    try {
      await updatePackaging.mutateAsync({
        id: packagingId,
        data: {
          name: name.trim(),
          type: type as "box" | "bag" | "pot" | "film" | "label" | "other",
          unitCost: cost,
          supplier: supplier.trim() || undefined,
        },
      });
      Alert.alert("Embalagem atualizada!");
      setEditing(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar a embalagem.");
    }
  }

  function handleDelete() {
    Alert.alert("Excluir embalagem", "Tem certeza que deseja excluir esta embalagem?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deletePackaging
            .mutateAsync(packagingId)
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
          {pkg && !editing && (
            <Pressable onPress={() => startEditing(pkg)}>
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

        {!isLoading && pkg && editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h2">Editar embalagem</Typography>
            <Input label="Nome" value={name} onChangeText={setName} />
            <View style={{ gap: spacing.sm }}>
              <Typography variant="caption">Tipo</Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: 20,
                      backgroundColor:
                        type === t.value ? theme.colors.primary : theme.colors.surface,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={
                        type === t.value
                          ? theme.colors.textOnPrimary
                          : theme.colors.textSecondary
                      }
                    >
                      {t.label}
                    </Typography>
                  </Pressable>
                ))}
              </View>
            </View>
            <Input
              label="Custo unitario (R$)"
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="decimal-pad"
            />
            <Input label="Fornecedor" value={supplier} onChangeText={setSupplier} />
            <Button
              title="Salvar"
              size="lg"
              onPress={() => {
                handleSave().catch(() => {});
              }}
              loading={updatePackaging.isPending}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setEditing(false)}
            />
          </ScrollView>
        )}

        {!isLoading && pkg && !editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h1">{pkg.name}</Typography>
            <Card>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="caption">Tipo</Typography>
                  <Badge label={TYPE_LABELS[pkg.type] ?? pkg.type} variant="info" />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="caption">Custo unitario</Typography>
                  <Typography variant="h3" color={theme.colors.success}>
                    {formatCurrency(pkg.unitCost)}
                  </Typography>
                </View>
                {pkg.supplier && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="caption">Fornecedor</Typography>
                    <Typography variant="body">{pkg.supplier}</Typography>
                  </View>
                )}
              </View>
            </Card>
            <Button
              title="Excluir embalagem"
              variant="secondary"
              onPress={handleDelete}
              loading={deletePackaging.isPending}
            />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default function PackagingScreen() {
  const { theme } = useTheme();
  const { data, isLoading, error } = usePackagingList();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {isLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      {!isLoading && error && (
        <EmptyState
          title="Algo deu errado"
          description="Nao foi possivel carregar suas embalagens. Tente novamente."
        />
      )}
      {!isLoading && !error && !data?.items.length && (
        <EmptyState
          title="Nenhuma embalagem ainda"
          description="Cadastre suas embalagens para facilitar a precificacao"
          action={
            <Button title="Cadastrar embalagem" onPress={() => setShowCreate(true)} />
          }
        />
      )}
      {!isLoading && !error && !!data?.items.length && (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, padding: 20 }}
          ListHeaderComponent={
            <View style={{ gap: 8 }}>
              <Typography variant="h2">Embalagens</Typography>
              <Typography variant="caption">
                {data.total} embalage{data.total !== 1 ? "ns" : "m"}
              </Typography>
            </View>
          }
          renderItem={({ item }) => (
            <Card onPress={() => setSelectedId(item.id)}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ gap: 4, flex: 1 }}>
                  <Typography variant="h3">{item.name}</Typography>
                  <Typography variant="caption">
                    {formatCurrency(item.unitCost)}
                    {item.supplier ? ` · ${item.supplier}` : ""}
                  </Typography>
                </View>
                {item.type && (
                  <Badge label={TYPE_LABELS[item.type] ?? item.type} variant="info" />
                )}
              </View>
            </Card>
          )}
        />
      )}

      {/* FAB */}
      <View style={{ position: "absolute", bottom: 100, right: 20 }}>
        <Button
          title="+ Nova embalagem"
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

      {/* Modal - Criar embalagem */}
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
          <CreatePackagingForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Modal - Detalhe da embalagem */}
      {selectedId && (
        <PackagingDetailModal
          packagingId={selectedId}
          visible={true}
          onClose={() => setSelectedId(null)}
        />
      )}
    </SafeAreaView>
  );
}
