import type { Order } from "@lucro-caseiro/contracts";
import {
  Typography,
  fontSizes,
  fonts,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { CalendarModal } from "../../../shared/components/calendar-modal";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import {
  brToIso,
  isoToBR,
  isValidTimeBR,
  maskDateBR,
  maskTimeBR,
} from "../../../shared/utils/date";
import { uploadOrderImage } from "../../../shared/utils/upload-image";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import { useCreateOrder, useDeleteOrder, useUpdateOrder } from "../hooks";
import { FormSection } from "../../../shared/components/form-section";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

interface OrderFormProps {
  readonly order?: Order | null;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

// Paleta derivada do tema ativo (antes eram constantes fixas de dark, que
// deixavam o formulario de encomenda com cores erradas no modo claro).
function formPalette(theme: { mode: string; colors: Record<string, string> }) {
  return {
    surface: theme.colors.surfaceElevated,
    panel: theme.colors.surface,
    border: theme.colors.border,
    muted: theme.colors.textSecondary,
    subtleFill: theme.colors.surface,
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
  trailingLabel,
  onTrailingPress,
  ...props
}: Readonly<
  TextInputProps & {
    icon: AppIconName;
    trailingIcon?: AppIconName;
    trailingLabel?: string;
    onTrailingPress?: () => void;
  }
>) {
  const { theme } = useTheme();
  const pal = formPalette(theme);
  const isMultiline = !!props.multiline;

  return (
    <View
      style={{
        minHeight: isMultiline ? 96 : 58,
        borderRadius: radii.lg,
        backgroundColor: pal.surface,
        borderWidth: 1,
        borderColor: pal.border,
        flexDirection: "row",
        alignItems: isMultiline ? "flex-start" : "center",
        paddingHorizontal: spacing.md,
        paddingVertical: isMultiline ? spacing.md : 0,
        gap: spacing.md,
      }}
    >
      <AppIcon
        name={icon}
        size={24}
        color={theme.colors.primaryLight}
        style={isMultiline ? { marginTop: 2 } : undefined}
      />
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textSecondary}
        style={[
          {
            flex: 1,
            color: theme.colors.text,
            fontSize: 18,
            paddingVertical: 0,
            minHeight: isMultiline ? 78 : 48,
            textAlignVertical: isMultiline ? "top" : "center",
          },
          props.style,
        ]}
      />
      {trailingIcon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={trailingLabel}
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={12}
        >
          <AppIcon name={trailingIcon} size={24} color={theme.colors.primaryLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

const THEME_SUGGESTIONS = [
  "Safari",
  "Princesas",
  "Super-heróis",
  "Unicórnio",
  "Futebol",
  "Jardim encantado",
  "Astronauta",
  "Fazendinha",
];

const COLOR_PALETTE: { name: string; hex: string }[] = [
  { name: "Rosa", hex: "#E8A0BF" },
  { name: "Azul", hex: "#7FA9D1" },
  { name: "Dourado", hex: "#D4A054" },
  { name: "Verde", hex: "#7FC29B" },
  { name: "Lilás", hex: "#B79BD1" },
  { name: "Vermelho", hex: "#D96B6B" },
  { name: "Amarelo", hex: "#EBC55C" },
  { name: "Branco", hex: "#F2EDE7" },
];

/** Lista de cores digitadas ("rosa, dourado") -> nomes normalizados. */
function parseColorNames(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isColorSelected(value: string, name: string): boolean {
  return parseColorNames(value).some((c) => c.toLowerCase() === name.toLowerCase());
}

/** Adiciona/remove uma cor da lista, preservando o que a pessoa digitou à mão. */
function toggleColorName(value: string, name: string): string {
  const parts = parseColorNames(value);
  const idx = parts.findIndex((c) => c.toLowerCase() === name.toLowerCase());
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(name);
  return parts.join(", ");
}

/** Campo somente-toque que abre o seletor de cliente (mesmo visual do Field). */
function ClientField({
  clientName,
  onPress,
  onClear,
}: Readonly<{ clientName: string; onPress: () => void; onClear: () => void }>) {
  const { theme } = useTheme();
  const pal = formPalette(theme);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
      <AppIcon name="person-outline" size={24} color={theme.colors.primaryLight} />
      <Typography
        variant="body"
        color={clientName ? theme.colors.text : theme.colors.textSecondary}
        numberOfLines={1}
        style={{ flex: 1, fontSize: 18 }}
      >
        {clientName || "Nenhum cliente selecionado"}
      </Typography>
      {clientName ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remover cliente"
          onPress={onClear}
          hitSlop={12}
        >
          <AppIcon name="close-circle" size={22} color={pal.muted} />
        </Pressable>
      ) : null}
      <AppIcon name="chevron-down" size={20} color={pal.muted} />
    </Pressable>
  );
}

function FieldLabel({ text }: Readonly<{ text: string }>) {
  const { theme } = useTheme();
  return (
    <Typography variant="bodyBold" color={theme.colors.text}>
      {text}
    </Typography>
  );
}

/**
 * Campos de personalização enriquecidos: rótulos + chips de tema sugeridos
 * (toque preenche) + paleta de cores visual (toque adiciona/remove a cor).
 */
function PersonalizationFields({
  orderTheme,
  setOrderTheme,
  honoree,
  setHonoree,
  colors,
  setColors,
}: Readonly<{
  orderTheme: string;
  setOrderTheme: (v: string) => void;
  honoree: string;
  setHonoree: (v: string) => void;
  colors: string;
  setColors: (v: string) => void;
}>) {
  const { theme } = useTheme();
  const pal = formPalette(theme);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <FieldLabel text="Tema da festa" />
        <Field
          icon="balloon-outline"
          placeholder="Ex.: Safari, Princesas"
          value={orderTheme}
          onChangeText={setOrderTheme}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {THEME_SUGGESTIONS.map((suggestion) => {
            const active = orderTheme.trim().toLowerCase() === suggestion.toLowerCase();
            return (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => setOrderTheme(active ? "" : suggestion)}
                style={{
                  minHeight: 38,
                  justifyContent: "center",
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.full,
                  backgroundColor: active ? theme.colors.primary : pal.surface,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : pal.border,
                }}
              >
                <Typography
                  variant="caption"
                  color={active ? theme.colors.textOnPrimary : pal.muted}
                  style={{ fontFamily: fonts.bold }}
                >
                  {suggestion}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <FieldLabel text="Homenageado" />
        <Field
          icon="person-outline"
          placeholder="Nome e idade, ex.: Alice, 5 anos"
          value={honoree}
          onChangeText={setHonoree}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <FieldLabel text="Cores" />
        <Field
          icon="color-palette-outline"
          placeholder="Ex.: rosa e dourado"
          value={colors}
          onChangeText={setColors}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {COLOR_PALETTE.map((color) => {
            const selected = isColorSelected(colors, color.name);
            return (
              <Pressable
                key={color.name}
                accessibilityRole="button"
                accessibilityLabel={color.name}
                accessibilityState={{ selected }}
                onPress={() => setColors(toggleColorName(colors, color.name))}
                style={{ alignItems: "center", gap: 4, width: 54 }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.full,
                    backgroundColor: color.hex,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? theme.colors.primary : pal.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected ? (
                    <AppIcon name="checkmark" size={20} color="#4A3228" />
                  ) : null}
                </View>
                <Typography
                  variant="caption"
                  color={selected ? theme.colors.text : pal.muted}
                  numberOfLines={1}
                  style={{ fontSize: fontSizes.xs }}
                >
                  {color.name}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function OrderForm({ order, visible, onClose, onSuccess }: OrderFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = formPalette(theme);
  const [title, setTitle] = useState(order?.title ?? "");
  const [dateText, setDateText] = useState(
    order?.deliveryDate ? isoToBR(order.deliveryDate) : offsetIsoBr(0),
  );
  const [time, setTime] = useState(order?.deliveryTime ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState(
    order?.amount != null ? currencyInput(order.amount) : "",
  );
  const [deposit, setDeposit] = useState(
    order?.deposit != null ? currencyInput(order.deposit) : "",
  );
  const [orderTheme, setOrderTheme] = useState(order?.theme ?? "");
  const [honoree, setHonoree] = useState(order?.honoree ?? "");
  const [colors, setColors] = useState(order?.colors ?? "");
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [clientId, setClientId] = useState<string | undefined>(
    order?.clientId ?? undefined,
  );
  const [clientName, setClientName] = useState(order?.clientName ?? "");
  const [showClientPicker, setShowClientPicker] = useState(false);
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
      clientId: clientId || undefined,
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
    <StandardModal
      title={isEditing ? "Editar encomenda" : "Nova encomenda"}
      visible={visible}
      onClose={onClose}
      footer={
        <Pressable
          disabled={isSaving}
          onPress={() => {
            void handleSave();
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minHeight: 62,
              borderRadius: radii.xl,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: spacing.md,
              opacity: pressed || isSaving ? 0.82 : 1,
            },
            { flex: 1 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <AppIcon
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
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="cube-outline" size={34} color={theme.colors.primaryLight} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="body" color={pal.muted}>
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
            <Typography variant="h3" color={theme.colors.text}>
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
                  borderColor: pal.border,
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
                  <AppIcon
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
                  <AppIcon
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
                  >
                    {currentPhotoUrl ? "Trocar imagem" : "Adicionar imagem"}
                  </Typography>
                </Pressable>
                <Typography variant="caption" color={pal.muted}>
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

          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="h3" color={theme.colors.text}>
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

            <View style={{ flex: 1, gap: spacing.sm, justifyContent: "flex-end" }}>
              <Typography variant="h3" color={theme.colors.text}>
                Cliente (opcional)
              </Typography>
              <ClientField
                clientName={clientName}
                onPress={() => setShowClientPicker(true)}
                onClear={() => {
                  setClientId(undefined);
                  setClientName("");
                }}
              />
              <ClientPickerModal
                visible={showClientPicker}
                onClose={() => setShowClientPicker(false)}
                onSelect={(client) => {
                  setClientId(client?.id);
                  setClientName(client?.name ?? "");
                }}
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="h3" color={theme.colors.text}>
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
                      <AppIcon
                        name={chip.icon}
                        size={21}
                        color={active ? theme.colors.textOnPrimary : pal.muted}
                      />
                      <Typography
                        variant="bodyBold"
                        color={active ? theme.colors.textOnPrimary : pal.muted}
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
                trailingLabel="Abrir calendário"
                onTrailingPress={openDatePicker}
                value={dateText}
                onChangeText={(v) => setDateText(maskDateBR(v))}
                keyboardType="number-pad"
                placeholder="DD/MM/AAAA"
              />
              <CalendarModal
                visible={showDatePicker}
                value={dateText}
                onSelect={setDateText}
                onClose={() => setShowDatePicker(false)}
              />
            </View>

            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="h3" color={theme.colors.text}>
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
          </View>

          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: spacing.lg,
            }}
          >
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="h3" color={theme.colors.text}>
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

            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="h3" color={theme.colors.text}>
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
          </View>

          <FormSection
            title="Personalização"
            subtitle="Tema, homenageado e cores (festas e encomendas personalizadas)"
            icon="sparkles-outline"
            initiallyOpen={!!(orderTheme || honoree || colors)}
          >
            <PersonalizationFields
              orderTheme={orderTheme}
              setOrderTheme={setOrderTheme}
              honoree={honoree}
              setHonoree={setHonoree}
              colors={colors}
              setColors={setColors}
            />
          </FormSection>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3" color={theme.colors.text}>
              Observações (opcional)
            </Typography>
            <Field
              icon="document-text-outline"
              placeholder="Anotações sobre a encomenda..."
              value={notes}
              onChangeText={(value) => setNotes(value.slice(0, 500))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <AppIcon name="shield-checkmark-outline" size={17} color={pal.muted} />
          <Typography variant="caption" color={pal.muted}>
            Seus dados estão seguros
          </Typography>
        </View>
      </View>
    </StandardModal>
  );
}
