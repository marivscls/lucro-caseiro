import type { Order } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { brToIso, isoToBR, maskDateBR } from "../../../shared/utils/date";
import { uploadOrderImage } from "../../../shared/utils/upload-image";
import { useCreateOrder, useDeleteOrder, useUpdateOrder } from "../hooks";

interface OrderFormProps {
  readonly order?: Order | null;
  readonly onSuccess?: () => void;
}

const SURFACE = "rgba(44, 36, 32, 0.82)";
const PANEL = "rgba(44, 36, 32, 0.6)";
const BORDER = "rgba(245, 225, 219, 0.1)";
const MUTED = "#B8A090";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function offsetIsoBr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function Field({
  icon,
  trailingIcon,
  ...props
}: Readonly<
  TextInputProps & {
    icon: keyof typeof Ionicons.glyphMap;
    trailingIcon?: keyof typeof Ionicons.glyphMap;
  }
>) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        minHeight: 58,
        borderRadius: radii.lg,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
    >
      <Ionicons name={icon} size={24} color={theme.colors.primaryLight} />
      <TextInput
        {...props}
        placeholderTextColor="rgba(184, 160, 144, 0.7)"
        style={[
          {
            flex: 1,
            color: theme.colors.text,
            fontSize: 18,
            paddingVertical: 0,
            minHeight: 48,
            textAlignVertical: "center",
          },
          props.style,
        ]}
      />
      {trailingIcon ? (
        <Ionicons name={trailingIcon} size={24} color={theme.colors.primaryLight} />
      ) : null}
    </View>
  );
}

export function OrderForm({ order, onSuccess }: OrderFormProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(order?.title ?? "");
  const [dateText, setDateText] = useState(
    order?.deliveryDate ? isoToBR(order.deliveryDate) : offsetIsoBr(0),
  );
  const [time, setTime] = useState(order?.deliveryTime ?? "");
  const [amount, setAmount] = useState(
    order?.amount != null ? String(order.amount).replace(".", ",") : "",
  );
  const [notes] = useState(order?.notes ?? "");
  const [savedPhotoUrl, setSavedPhotoUrl] = useState(order?.photoUrl ?? null);
  const { imageUri, showPicker, clear } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const isEditing = !!order;
  const currentPhotoUrl = imageUri ?? savedPhotoUrl;
  const isSaving =
    createOrder.isPending || updateOrder.isPending || deleteOrder.isPending || uploading;

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Opa!", "Dê um nome para a encomenda.");
      return;
    }
    const iso = brToIso(dateText);
    if (!iso) {
      Alert.alert("Opa!", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }
    if (time.trim() && !/^\d{2}:\d{2}$/.test(time.trim())) {
      Alert.alert("Opa!", "Horário inválido. Use HH:MM, ex.: 14:30.");
      return;
    }

    const parsedAmount = amount.trim() ? parseFloat(amount.replace(",", ".")) : undefined;
    let photoUrl: string | null | undefined = savedPhotoUrl;
    if (imageUri && !imageUri.startsWith("http")) {
      try {
        setUploading(true);
        photoUrl = await uploadOrderImage(imageUri);
      } catch {
        Alert.alert(
          "Foto não enviada",
          "Não consegui enviar a imagem. A encomenda não foi salva para evitar ficar sem a foto.",
        );
        return;
      } finally {
        setUploading(false);
      }
    } else if (imageUri?.startsWith("http")) {
      photoUrl = imageUri;
    }

    const data = {
      title: title.trim(),
      deliveryDate: iso,
      deliveryTime: time.trim() || undefined,
      amount:
        parsedAmount !== undefined && !Number.isNaN(parsedAmount)
          ? parsedAmount
          : undefined,
      photoUrl,
      notes: notes.trim() || undefined,
    };

    try {
      let savedOrder: Order;
      if (isEditing && order) {
        savedOrder = await updateOrder.mutateAsync({ id: order.id, data });
      } else {
        savedOrder = await createOrder.mutateAsync(data);
      }
      if (photoUrl && savedOrder.photoUrl !== photoUrl) {
        if (!isEditing) {
          try {
            await deleteOrder.mutateAsync(savedOrder.id);
          } catch {
            // A falha de limpeza nao deve esconder o motivo real: API sem suporte a photoUrl.
          }
        }
        Alert.alert(
          isEditing ? "Imagem não atualizada" : "Encomenda não salva",
          "A API que está rodando ainda não aceita imagem de encomenda. Publique a API nova e aplique a migration photo_url.",
        );
        return;
      }
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a encomenda. Tente novamente.";
      Alert.alert("Erro ao salvar", message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: 0,
          paddingBottom: spacing["2xl"],
          gap: spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.lg,
              backgroundColor: "rgba(196, 112, 126, 0.25)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="cube-outline" size={34} color={theme.colors.primaryLight} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography
              variant="display"
              color={theme.colors.text}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{ fontSize: 36, lineHeight: 42, fontWeight: "800" }}
            >
              {isEditing ? "Editar encomenda" : "Nova encomenda"}
            </Typography>
            <Typography variant="body" color={MUTED} style={{ fontSize: 17 }}>
              Preencha os dados da encomenda
            </Typography>
          </View>
        </View>

        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: BORDER,
            backgroundColor: PANEL,
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <View style={{ gap: spacing.md }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 19 }}>
              Imagem da encomenda (opcional)
            </Typography>
            <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              <Pressable
                onPress={showPicker}
                style={({ pressed }) => ({
                  width: 96,
                  height: 96,
                  borderRadius: radii.lg,
                  backgroundColor: "rgba(245, 225, 219, 0.03)",
                  borderWidth: 1,
                  borderStyle: currentPhotoUrl ? "solid" : "dashed",
                  borderColor: currentPhotoUrl ? BORDER : "rgba(184, 160, 144, 0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                {currentPhotoUrl ? (
                  <Image
                    source={{ uri: currentPhotoUrl }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={34}
                    color={theme.colors.primaryLight}
                  />
                )}
              </Pressable>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <Pressable
                  onPress={showPicker}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: spacing.sm,
                    opacity: pressed ? 0.82 : 1,
                  })}
                >
                  <Ionicons
                    name={
                      currentPhotoUrl ? "swap-horizontal-outline" : "cloud-upload-outline"
                    }
                    size={19}
                    color={theme.colors.primaryLight}
                  />
                  <Typography
                    variant="bodyBold"
                    color={theme.colors.primaryLight}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontSize: 15 }}
                  >
                    {currentPhotoUrl ? "Trocar imagem" : "Adicionar imagem"}
                  </Typography>
                </Pressable>
                <Typography
                  variant="caption"
                  color={MUTED}
                  style={{ fontSize: 13, lineHeight: 17 }}
                >
                  Foto opcional para identificar a encomenda.
                </Typography>
                {currentPhotoUrl ? (
                  <Pressable
                    onPress={() => {
                      setSavedPhotoUrl(null);
                      clear();
                    }}
                  >
                    <Typography variant="caption" color={theme.colors.alert}>
                      Remover imagem
                    </Typography>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: BORDER }} />

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              O que é? (encomenda){" "}
              <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                *
              </Typography>
            </Typography>
            <Field
              icon="cube-outline"
              placeholder="Ex: Bolo de chocolate 2kg"
              value={title}
              onChangeText={setTitle}
              autoFocus={!isEditing}
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Data de entrega{" "}
              <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                *
              </Typography>
            </Typography>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {[
                {
                  label: "Hoje",
                  value: offsetIsoBr(0),
                  icon: "calendar-outline" as const,
                },
                {
                  label: "Amanhã",
                  value: offsetIsoBr(1),
                  icon: "sunny-outline" as const,
                },
              ].map((chip) => {
                const active = dateText === chip.value;
                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => setDateText(chip.value)}
                    style={{
                      minHeight: 48,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.lg,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: spacing.sm,
                      backgroundColor: active ? theme.colors.primary : SURFACE,
                    }}
                  >
                    <Ionicons
                      name={chip.icon}
                      size={21}
                      color={active ? theme.colors.textOnPrimary : MUTED}
                    />
                    <Typography
                      variant="bodyBold"
                      color={active ? theme.colors.textOnPrimary : MUTED}
                      style={{ fontSize: 17 }}
                    >
                      {chip.label}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
            <Field
              icon="calendar-outline"
              trailingIcon="calendar-outline"
              value={dateText}
              onChangeText={(v) => setDateText(maskDateBR(v))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Horário (opcional)
            </Typography>
            <Field
              icon="time-outline"
              trailingIcon="chevron-down"
              placeholder="Ex: 14:30"
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Valor combinado (opcional)
            </Typography>
            <Field
              icon="cash-outline"
              placeholder="Ex: 120,00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Pressable
          disabled={isSaving}
          onPress={() => {
            void handleSave();
          }}
          style={({ pressed }) => ({
            minHeight: 62,
            borderRadius: radii.xl,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: spacing.md,
            opacity: pressed || isSaving ? 0.82 : 1,
          })}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Ionicons
              name="checkmark-circle"
              size={25}
              color={theme.colors.textOnPrimary}
            />
          )}
          <Typography
            variant="bodyBold"
            color={theme.colors.textOnPrimary}
            style={{ fontSize: 21 }}
          >
            {uploading ? "Enviando imagem..." : "Salvar encomenda"}
          </Typography>
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <Ionicons name="shield-checkmark-outline" size={17} color={MUTED} />
          <Typography variant="caption" color={MUTED} style={{ fontSize: 14 }}>
            Seus dados estão seguros
          </Typography>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
