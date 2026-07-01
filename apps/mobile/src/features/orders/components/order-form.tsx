import type { Order } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import {
  brToIso,
  isoToBR,
  isValidTimeBR,
  maskDateBR,
  maskTimeBR,
} from "../../../shared/utils/date";
import { uploadOrderImage } from "../../../shared/utils/upload-image";
import { useCreateOrder, useDeleteOrder, useUpdateOrder } from "../hooks";
import { FormSection } from "../../../shared/components/form-section";
import { alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

type DateTimePickerEvent = { type?: string };
type NativeDatePicker = React.ComponentType<{
  value: Date;
  mode: "date";
  display: "spinner" | "default";
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}>;

function getNativeDatePicker(): NativeDatePicker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-community/datetimepicker").default as NativeDatePicker;
  } catch {
    return null;
  }
}

interface OrderFormProps {
  readonly order?: Order | null;
  readonly onSuccess?: () => void;
}

// Paleta derivada do tema ativo (antes eram constantes fixas de dark, que
// deixavam o formulario de encomenda com cores erradas no modo claro).
function formPalette(theme: { mode: string; colors: Record<string, string> }) {
  const isDark = theme.mode === "dark";
  return {
    surface: isDark ? "rgba(44, 36, 32, 0.82)" : theme.colors.surfaceElevated,
    panel: isDark ? "rgba(44, 36, 32, 0.6)" : theme.colors.surface,
    border: isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)",
    muted: theme.colors.textSecondary,
    subtleFill: isDark ? "rgba(245, 225, 219, 0.03)" : "rgba(74, 50, 40, 0.03)",
  };
}

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
  onTrailingPress,
  ...props
}: Readonly<
  TextInputProps & {
    icon: keyof typeof Ionicons.glyphMap;
    trailingIcon?: keyof typeof Ionicons.glyphMap;
    onTrailingPress?: () => void;
  }
>) {
  const { theme } = useTheme();
  const pal = formPalette(theme);

  return (
    <View
      style={{
        minHeight: 58,
        borderRadius: radii.lg,
        backgroundColor: pal.surface,
        borderWidth: 1,
        borderColor: pal.border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
    >
      <Ionicons name={icon} size={24} color={theme.colors.primaryLight} />
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textSecondary}
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
        <Pressable
          accessibilityRole="button"
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={12}
        >
          <Ionicons name={trailingIcon} size={24} color={theme.colors.primaryLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function OrderForm({ order, onSuccess }: OrderFormProps) {
  const { theme } = useTheme();
  const pal = formPalette(theme);
  const [title, setTitle] = useState(order?.title ?? "");
  const [dateText, setDateText] = useState(
    order?.deliveryDate ? isoToBR(order.deliveryDate) : offsetIsoBr(0),
  );
  const [time, setTime] = useState(order?.deliveryTime ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const DateTimePicker = showDatePicker ? getNativeDatePicker() : null;
  const [amount, setAmount] = useState(
    order?.amount != null ? currencyInput(order.amount) : "",
  );
  const [deposit, setDeposit] = useState(
    order?.deposit != null ? currencyInput(order.deposit) : "",
  );
  const [orderTheme, setOrderTheme] = useState(order?.theme ?? "");
  const [honoree, setHonoree] = useState(order?.honoree ?? "");
  const [colors, setColors] = useState(order?.colors ?? "");
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

  function openDatePicker() {
    if (!getNativeDatePicker()) {
      showAlert({
        title: "Calendario indisponivel",
        message: "Digite a data no formato DD/MM/AAAA.",
      });
      return;
    }
    setShowDatePicker(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      alertValidation("Dê um nome para a encomenda.");
      return;
    }
    const iso = brToIso(dateText);
    if (!iso) {
      alertValidation("Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }
    if (time.trim() && !isValidTimeBR(time)) {
      alertValidation("Horário inválido. Use HH:MM, ex.: 14:30.");
      return;
    }

    const parsedAmount = amount.trim() ? parseCurrencyInput(amount) : undefined;
    const parsedDeposit = deposit.trim() ? parseCurrencyInput(deposit) : undefined;
    if (
      parsedDeposit !== undefined &&
      parsedAmount !== undefined &&
      parsedDeposit > parsedAmount
    ) {
      alertValidation("O sinal não pode ser maior que o valor combinado.");
      return;
    }
    let photoUrl: string | null | undefined = savedPhotoUrl;
    if (imageUri && !imageUri.startsWith("http")) {
      try {
        setUploading(true);
        photoUrl = await uploadOrderImage(imageUri);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message:
            "Não consegui enviar a imagem. A encomenda não foi salva para evitar ficar sem a foto.",
        });
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
      deposit:
        parsedDeposit !== undefined && !Number.isNaN(parsedDeposit)
          ? parsedDeposit
          : null,
      theme: orderTheme.trim() || null,
      honoree: honoree.trim() || null,
      colors: colors.trim() || null,
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
        showAlert({
          title: isEditing ? "Imagem não atualizada" : "Encomenda não salva",
          message:
            "A API que está rodando ainda não aceita imagem de encomenda. Publique a API nova e aplique a migration photo_url.",
        });
        return;
      }
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a encomenda. Tente novamente.";
      showAlert({ title: "Erro ao salvar", message });
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <Typography variant="body" color={pal.muted} style={{ fontSize: 17 }}>
              Preencha os dados da encomenda
            </Typography>
          </View>
        </View>

        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: pal.border,
            backgroundColor: pal.panel,
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
                  backgroundColor: pal.subtleFill,
                  borderWidth: 1,
                  borderStyle: currentPhotoUrl ? "solid" : "dashed",
                  borderColor: currentPhotoUrl ? pal.border : "rgba(184, 160, 144, 0.45)",
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
                  color={pal.muted}
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

          <View style={{ height: 1, backgroundColor: pal.border }} />

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
                      backgroundColor: active ? theme.colors.primary : pal.surface,
                    }}
                  >
                    <Ionicons
                      name={chip.icon}
                      size={21}
                      color={active ? theme.colors.textOnPrimary : pal.muted}
                    />
                    <Typography
                      variant="bodyBold"
                      color={active ? theme.colors.textOnPrimary : pal.muted}
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
              onTrailingPress={openDatePicker}
              value={dateText}
              onChangeText={(v) => setDateText(maskDateBR(v))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
            />
            {showDatePicker && DateTimePicker && (
              <DateTimePicker
                value={(() => {
                  const iso = brToIso(dateText);
                  return iso ? new Date(`${iso}T12:00:00`) : new Date();
                })()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, picked) => {
                  setShowDatePicker(false);
                  if (event.type === "dismissed" || !picked) return;
                  setDateText(
                    `${pad(picked.getDate())}/${pad(picked.getMonth() + 1)}/${picked.getFullYear()}`,
                  );
                }}
              />
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Horário (opcional)
            </Typography>
            <Field
              icon="time-outline"
              placeholder="Ex: 14:30"
              value={time}
              onChangeText={(v) => setTime(maskTimeBR(v))}
              keyboardType="number-pad"
              maxLength={5}
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
              onChangeText={(value) => setAmount(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Sinal recebido (opcional)
            </Typography>
            <Field
              icon="wallet-outline"
              placeholder="Ex: 60,00, entrada já paga"
              value={deposit}
              onChangeText={(value) => setDeposit(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </View>

          <FormSection
            title="Personalização"
            subtitle="Tema, homenageado e cores (festas e encomendas personalizadas)"
            icon="sparkles-outline"
            initiallyOpen={!!(orderTheme || honoree || colors)}
          >
            <Field
              icon="balloon-outline"
              placeholder="Tema, ex.: Safari, Princesas"
              value={orderTheme}
              onChangeText={setOrderTheme}
            />
            <Field
              icon="person-outline"
              placeholder="Nome e idade, ex.: Alice, 5 anos"
              value={honoree}
              onChangeText={setHonoree}
            />
            <Field
              icon="color-palette-outline"
              placeholder="Cores, ex.: rosa e dourado"
              value={colors}
              onChangeText={setColors}
            />
          </FormSection>
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
          <Ionicons name="shield-checkmark-outline" size={17} color={pal.muted} />
          <Typography variant="caption" color={pal.muted} style={{ fontSize: 14 }}>
            Seus dados estão seguros
          </Typography>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
