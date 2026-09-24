import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { guidanceEvent } from "../../../shared/guidance/guidance-events";
import { useAuth } from "../../../shared/hooks/use-auth";
import type { Order } from "@lucro-caseiro/contracts";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { DateField } from "../../../shared/components/date-field";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import {
  ChoiceField,
  FieldLinkAction,
  FormField,
  SelectField,
  TextField,
  fieldMetrics,
  useFieldPalette,
  type ChoiceOption,
  OptionChip,
  ChipRow,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { brToIso, isoToBR, isValidTimeBR, maskTimeBR } from "../../../shared/utils/date";
import { uploadOrderImage } from "../../../shared/utils/upload-image";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import { useCreateOrder, useDeleteOrder, useUpdateOrder } from "../hooks";
import { createOrderRequestId } from "../request-id";
import {
  useCreateService,
  useServicePackagePurchases,
  useServices,
} from "../../services/hooks";
import { FormSection } from "../../../shared/components/form-section";
import { alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { useBusinessCopy } from "../../subscription/business-copy";

interface OrderFormProps {
  readonly order?: Order | null;
  readonly initialServiceId?: string | null;
  readonly mode?: "order" | "appointment";
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const ORDER_FORM_STEPS = [
  { label: "Pedido", title: "Pedido, serviço e cliente" },
  { label: "Agenda", title: "Data, horário e valores" },
  { label: "Detalhes", title: "Detalhes e confirmação" },
] as const;

type LocationMode = "business" | "client" | "online";

const LOCATION_OPTIONS: readonly ChoiceOption<LocationMode | "">[] = [
  { value: "business", label: "Meu espaço" },
  { value: "client", label: "Cliente" },
  { value: "online", label: "Online" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function offsetIsoBr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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

function withoutValue(items: string[], value: string): string[] {
  return items.filter((item) => item !== value);
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

/** Campo que abre o seletor de cliente; "Remover" fica ao lado do rótulo. */
function ClientField({
  clientName,
  onPress,
  onClear,
}: Readonly<{
  clientName: string;
  onPress: () => void;
  onClear: () => void;
}>) {
  return (
    <FormField
      label="Cliente"
      optional
      labelAction={
        clientName ? (
          <FieldLinkAction
            label="Remover"
            icon="close-circle-outline"
            accessibilityLabel="Remover cliente"
            onPress={onClear}
          />
        ) : null
      }
    >
      <SelectField
        icon="person-outline"
        value={clientName}
        placeholder="Escolher cliente"
        accessibilityLabel="Escolher cliente"
        onPress={onPress}
      />
    </FormField>
  );
}

/** Imagem opcional do cadastro, com a mesma caixa tracejada da foto de produto. */
function OrderPhotoField({
  photoUrl,
  onPick,
  onRemove,
}: Readonly<{
  photoUrl: string | null;
  onPick: () => void;
  onRemove: () => void;
  span?: "full";
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <FormField
      label="Imagem"
      optional
      hint="Foto para identificar este cadastro."
      labelAction={
        photoUrl ? (
          <FieldLinkAction
            label="Remover imagem"
            icon="trash-outline"
            onPress={onRemove}
          />
        ) : null
      }
    >
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={photoUrl ? "Trocar imagem" : "Adicionar imagem"}
        style={({ pressed }) => ({
          borderRadius: fieldMetrics.radius,
          borderWidth: 1,
          borderStyle: photoUrl ? "solid" : "dashed",
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          gap: spacing.lg,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radii.md,
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 64, height: 64 }} />
          ) : (
            <AppIcon name="image-outline" size={24} color={theme.colors.textSecondary} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            {photoUrl ? "Trocar imagem" : "Adicionar imagem"}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            PNG ou JPG
          </Typography>
        </View>
      </Pressable>
    </FormField>
  );
}

/**
 * Personalização: tema (com sugestões), homenageado e cores (com paleta
 * visual; o toque adiciona/remove a cor sem apagar o que foi digitado).
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
  const pal = useFieldPalette();

  return (
    <>
      <FormField label="Tema da festa" optional>
        <View style={{ gap: spacing.md }}>
          <TextField
            icon="balloon-outline"
            placeholder="Ex.: Safari, Princesas"
            value={orderTheme}
            onChangeText={setOrderTheme}
          />
          <ChipRow>
            {THEME_SUGGESTIONS.map((suggestion) => {
              const active = orderTheme.trim().toLowerCase() === suggestion.toLowerCase();
              return (
                <OptionChip
                  key={suggestion}
                  label={suggestion}
                  selected={active}
                  onPress={() => setOrderTheme(active ? "" : suggestion)}
                />
              );
            })}
          </ChipRow>
        </View>
      </FormField>

      <FormField label="Homenageado" optional>
        <TextField
          icon="person-outline"
          placeholder="Nome e idade, ex.: Alice, 5 anos"
          value={honoree}
          onChangeText={setHonoree}
        />
      </FormField>

      <FormField label="Cores" optional>
        <View style={{ gap: spacing.md }}>
          <TextField
            icon="color-palette-outline"
            placeholder="Ex.: rosa e dourado"
            value={colors}
            onChangeText={setColors}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {COLOR_PALETTE.map((color) => {
              const selected = isColorSelected(colors, color.name);
              return (
                <Pressable
                  key={color.name}
                  accessibilityRole="button"
                  accessibilityLabel={color.name}
                  accessibilityState={{ selected }}
                  onPress={() => setColors(toggleColorName(colors, color.name))}
                  style={{ alignItems: "center", gap: spacing.xs, width: 56 }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radii.full,
                      backgroundColor: color.hex,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? theme.colors.primaryStrong : pal.border,
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
                    color={selected ? theme.colors.text : theme.colors.textSecondary}
                    numberOfLines={1}
                  >
                    {color.name}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>
      </FormField>
    </>
  );
}

export function OrderForm({
  order,
  initialServiceId,
  mode = "order",
  visible,
  onClose,
  onSuccess,
}: OrderFormProps) {
  const guidanceUserId = useAuth((state) => state.userId);
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const submittingRef = React.useRef(false);
  const requestIdRef = React.useRef(createOrderRequestId());
  const [title, setTitle] = useState(order?.title ?? "");
  const [dateText, setDateText] = useState(
    order?.deliveryDate ? isoToBR(order.deliveryDate) : offsetIsoBr(0),
  );
  const [time, setTime] = useState(order?.deliveryTime ?? "");
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
  const [serviceId, setServiceId] = useState<string | null>(
    order?.serviceId ?? initialServiceId ?? null,
  );
  const [serviceVariationId, setServiceVariationId] = useState<string | null>(
    order?.serviceVariationId ?? null,
  );
  const [serviceAddOnIds, setServiceAddOnIds] = useState<string[]>(
    order?.serviceAddOnIds ?? [],
  );
  const [servicePackagePurchaseId, setServicePackagePurchaseId] = useState<string | null>(
    order?.servicePackagePurchaseId ?? null,
  );
  const [locationMode, setLocationMode] = useState<LocationMode | null>(
    order?.locationMode ?? null,
  );
  const [locationDetails, setLocationDetails] = useState(order?.locationDetails ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    order?.durationMinutes ? String(order.durationMinutes) : "60",
  );
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("60");
  const [savedPhotoUrl, setSavedPhotoUrl] = useState(order?.photoUrl ?? null);
  const { imageUri, showPicker, clear } = useImagePicker();
  const [uploading, setUploading] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const createOrder = useCreateOrder();
  const createService = useCreateService();
  const { data: services = [] } = useServices();
  const { data: packagePurchases = [] } = useServicePackagePurchases(serviceId);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const isEditing = !!order;
  const isAppointment = mode === "appointment";
  const currentPhotoUrl = imageUri ?? savedPhotoUrl;
  const isSaving =
    createOrder.isPending || updateOrder.isPending || deleteOrder.isPending || uploading;
  const selectedService = services.find((service) => service.id === serviceId);

  useEffect(() => {
    if (order || !initialServiceId || services.length === 0) return;
    const initialService = services.find((service) => service.id === initialServiceId);
    if (!initialService) return;
    setServiceId(initialService.id);
    setDurationMinutes(String(initialService.durationMinutes));
    setTitle((current) => current || initialService.name);
    let initialLocationMode: LocationMode | null = null;
    if (initialService.locationMode !== "flexible") {
      initialLocationMode = initialService.locationMode;
    } else if (!isAppointment) {
      initialLocationMode = "business";
    }
    setLocationMode(initialLocationMode);
    if (initialService.defaultPrice !== null) {
      setAmount(currencyInput(initialService.defaultPrice));
    }
  }, [initialServiceId, isAppointment, order, services]);

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [order?.id, visible]);

  const serviceValidation = useFormValidation(
    {
      newServiceName: !newServiceName.trim() && "Informe o nome do serviço.",
      newServiceDuration:
        (!Number.isFinite(Number(newServiceDuration)) ||
          Number(newServiceDuration) < 5) &&
        "Informe uma duração de pelo menos 5 minutos.",
    },
    visible,
  );

  async function handleCreateService() {
    if (!serviceValidation.validate()) return;
    const duration = Number.parseInt(newServiceDuration, 10);
    if (!Number.isInteger(duration)) return;
    try {
      const service = await createService.mutateAsync({
        name: newServiceName.trim(),
        durationMinutes: duration,
      });
      setServiceId(service.id);
      if (guidanceUserId) guidanceEvent("agenda", "prerequisite_resumed", guidanceUserId);
      setDurationMinutes(String(service.durationMinutes));
      setTitle((current) => current || service.name);
      setNewServiceName("");
    } catch (error) {
      showAlert({
        title: "Erro ao cadastrar serviço",
        message: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  }

  // Cada etapa valida só os próprios campos, com o erro no campo.
  const stepOneValidation = useFormValidation(
    {
      title: !isAppointment && !title.trim() && "Dê um nome para este cadastro.",
      serviceId: isAppointment && !serviceId && "Selecione o serviço deste atendimento.",
      locationMode:
        isAppointment &&
        !!serviceId &&
        !locationMode &&
        "Escolha o local do atendimento.",
    },
    visible,
  );

  const parsedAmount = amount.trim() ? parseCurrencyInput(amount) : undefined;
  const parsedDeposit = deposit.trim() ? parseCurrencyInput(deposit) : undefined;
  let timeError: string | false = false;
  if (isAppointment && !time.trim()) timeError = "Informe o horário do atendimento.";
  else if (time.trim() && !isValidTimeBR(time))
    timeError = "Horário inválido. Use HH:MM, ex.: 14:30.";

  const stepTwoValidation = useFormValidation(
    {
      dateText: !brToIso(dateText) && "Informe uma data válida no formato DD/MM/AAAA.",
      time: timeError,
      deposit:
        parsedDeposit !== undefined &&
        parsedAmount !== undefined &&
        parsedDeposit > parsedAmount &&
        "O sinal não pode ser maior que o valor combinado.",
    },
    visible,
  );

  function goToNextStep() {
    if (formStep === 1 && !stepOneValidation.validate()) return;
    if (formStep === 2 && !stepTwoValidation.validate()) return;
    setFormStep((current) => current + 1);
  }

  async function saveOrder() {
    if (!stepOneValidation.validate()) {
      setFormStep(1);
      return;
    }
    if (!stepTwoValidation.validate()) {
      setFormStep(2);
      return;
    }
    // No atendimento o nome vem do serviço; não há campo para mostrar o erro.
    if (!title.trim()) {
      alertValidation("Dê um nome para este cadastro.");
      return;
    }
    const iso = brToIso(dateText);
    if (!iso) {
      setFormStep(2);
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
            "Não consegui enviar a imagem. O cadastro não foi salvo para evitar ficar sem a foto.",
        });
        return;
      } finally {
        setUploading(false);
      }
    } else if (imageUri?.startsWith("http")) {
      photoUrl = imageUri;
    }

    const data = {
      requestId: isEditing ? undefined : requestIdRef.current,
      title: title.trim(),
      deliveryDate: iso,
      deliveryTime: time.trim() || undefined,
      serviceId: serviceId ?? undefined,
      serviceVariationId: serviceVariationId ?? undefined,
      serviceAddOnIds,
      servicePackagePurchaseId: servicePackagePurchaseId ?? undefined,
      durationMinutes: serviceId ? Number.parseInt(durationMinutes, 10) || 60 : undefined,
      locationMode: serviceId ? locationMode : undefined,
      locationDetails: serviceId ? locationDetails.trim() || null : undefined,
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
          title: isEditing ? "Imagem não atualizada" : "Cadastro não salvo",
          message:
            "A API que está rodando ainda não aceita a imagem deste cadastro. Publique a API nova e aplique a migration photo_url.",
        });
        return;
      }
      requestIdRef.current = createOrderRequestId();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar. Tente novamente.";
      showAlert({ title: "Erro ao salvar", message });
    }
  }

  async function handleSave() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await saveOrder();
    } finally {
      submittingRef.current = false;
    }
  }

  function clearService() {
    setServiceId(null);
    setServiceVariationId(null);
    setServiceAddOnIds([]);
    setServicePackagePurchaseId(null);
    setLocationMode(null);
    setLocationDetails("");
  }

  function selectService(service: (typeof services)[number]) {
    setServiceId(service.id);
    setServiceVariationId(null);
    setServiceAddOnIds([]);
    setServicePackagePurchaseId(null);
    setDurationMinutes(String(service.durationMinutes));
    setLocationMode(
      service.locationMode === "flexible" ? "business" : service.locationMode,
    );
    setTitle((current) => current || service.name);
    if (service.defaultPrice !== null) {
      setAmount(currencyInput(service.defaultPrice));
    }
  }

  function toggleAddOn(addOn: { id: string; price: number; durationMinutes: number }) {
    const selected = serviceAddOnIds.includes(addOn.id);
    setServiceAddOnIds(
      selected ? withoutValue(serviceAddOnIds, addOn.id) : [...serviceAddOnIds, addOn.id],
    );
    const currentAmount = parseCurrencyInput(amount) || 0;
    setAmount(
      currencyInput(Math.max(0, currentAmount + (selected ? -addOn.price : addOn.price))),
    );
    setDurationMinutes((current) =>
      String(
        Math.max(
          5,
          (Number.parseInt(current, 10) || 0) +
            (selected ? -addOn.durationMinutes : addOn.durationMinutes),
        ),
      ),
    );
  }

  let modalTitle = isEditing
    ? `Editar ${experienceCopy.orderNoun}`
    : `Adicionar ${experienceCopy.orderNoun}`;
  if (isAppointment) {
    modalTitle = isEditing ? "Editar atendimento" : "Novo atendimento";
  }

  let saveLabel = `Salvar ${experienceCopy.orderNoun}`;
  if (isAppointment) saveLabel = "Salvar atendimento";
  if (uploading) saveLabel = "Enviando imagem...";

  function stepProps(step: number) {
    const stepVisible = formStep === step;
    return {
      style: { display: stepVisible ? ("flex" as const) : ("none" as const) },
      accessibilityElementsHidden: !stepVisible,
      importantForAccessibility: stepVisible
        ? ("auto" as const)
        : ("no-hide-descendants" as const),
    };
  }

  const availableServices = services.filter(
    (service) =>
      service.active &&
      (!isAppointment || !initialServiceId || service.id === initialServiceId),
  );
  const activeVariations =
    selectedService?.variations.filter((item) => item.active) ?? [];
  const activeAddOns = selectedService?.addOns.filter((item) => item.active) ?? [];
  const activePackages = packagePurchases.filter(
    (purchase) =>
      purchase.status === "active" && (!clientId || purchase.clientId === clientId),
  );

  const clientField = (
    <ClientField
      clientName={clientName}
      onPress={() => setShowClientPicker(true)}
      onClear={() => {
        setClientId(undefined);
        setClientName("");
      }}
    />
  );

  const serviceSection = (
    <FormSection
      collapsible={false}
      title="Serviço"
      subtitle={
        isAppointment
          ? "Confirme a opção, os adicionais e a duração."
          : "Opcional. Use para bloquear o horário certo na agenda."
      }
    >
      {availableServices.length > 0 || isAppointment ? (
        <FormField validation={stepOneValidation.field("serviceId")}>
          <ChipRow>
            {!isAppointment ? (
              <OptionChip
                label="Sem serviço"
                selected={serviceId === null}
                onPress={clearService}
              />
            ) : null}
            {availableServices.map((service) => (
              <OptionChip
                key={service.id}
                label={service.name}
                selected={serviceId === service.id}
                onPress={() => selectService(service)}
              />
            ))}
          </ChipRow>
        </FormField>
      ) : null}

      {activeVariations.length > 0 ? (
        <FormField label="Opção do serviço">
          <ChipRow>
            {activeVariations.map((variation) => (
              <OptionChip
                key={variation.id}
                label={`${variation.name} · ${variation.durationMinutes} min`}
                selected={serviceVariationId === variation.id}
                onPress={() => {
                  setServiceVariationId(variation.id);
                  setDurationMinutes(String(variation.durationMinutes));
                  setAmount(currencyInput(variation.price));
                }}
              />
            ))}
          </ChipRow>
        </FormField>
      ) : null}

      {activeAddOns.length > 0 ? (
        <FormField label="Adicionais" optional>
          <ChipRow>
            {activeAddOns.map((addOn) => (
              <OptionChip
                key={addOn.id}
                label={`${addOn.name} · +${currencyInput(addOn.price)}`}
                selected={serviceAddOnIds.includes(addOn.id)}
                onPress={() => toggleAddOn(addOn)}
              />
            ))}
          </ChipRow>
        </FormField>
      ) : null}

      {packagePurchases.length > 0 ? (
        <FormField label="Usar sessão de pacote">
          <ChipRow>
            <OptionChip
              label="Cobrança avulsa"
              selected={servicePackagePurchaseId === null}
              onPress={() => setServicePackagePurchaseId(null)}
            />
            {activePackages.map((purchase) => (
              <OptionChip
                key={purchase.id}
                label={`${purchase.clientName} · ${purchase.sessionsTotal - purchase.sessionsUsed} sessões`}
                selected={servicePackagePurchaseId === purchase.id}
                onPress={() => {
                  setServicePackagePurchaseId(purchase.id);
                  setClientId(purchase.clientId);
                  setClientName(purchase.clientName);
                }}
              />
            ))}
          </ChipRow>
        </FormField>
      ) : null}

      {serviceId ? (
        <FormGrid>
          <FormField label="Duração do atendimento">
            <TextField
              icon="time-outline"
              placeholder="60"
              suffix="min"
              accessibilityLabel="Duração em minutos"
              value={durationMinutes}
              onChangeText={(value) =>
                setDurationMinutes(value.replace(/\D/g, "").slice(0, 4))
              }
              keyboardType="number-pad"
            />
          </FormField>
          <FormField
            label="Local do atendimento"
            optional={!isAppointment}
            validation={stepOneValidation.field("locationMode")}
            span="full"
          >
            <ChoiceField
              value={locationMode ?? ""}
              options={LOCATION_OPTIONS}
              onChange={(value) => setLocationMode(value || null)}
              accessibilityLabel="Local do atendimento"
            />
          </FormField>
          <FormField
            label={locationMode === "online" ? "Link da chamada" : "Detalhes do local"}
            optional
            span="full"
          >
            <TextField
              icon="location-outline"
              placeholder={
                locationMode === "online" ? "Ex: link do Meet" : "Ex: endereço, sala"
              }
              value={locationDetails}
              onChangeText={setLocationDetails}
            />
          </FormField>
        </FormGrid>
      ) : null}

      {!isAppointment ? (
        <FormSection
          title="Cadastrar serviço rápido"
          subtitle="Se a opção ainda não estiver na lista, informe nome e duração."
          initiallyOpen={availableServices.length === 0}
        >
          <FormGrid>
            <FormField
              label="Nome do serviço"
              validation={serviceValidation.field("newServiceName")}
            >
              <TextField
                icon="add-circle-outline"
                placeholder="Ex: Corte e escova"
                value={newServiceName}
                onChangeText={setNewServiceName}
              />
            </FormField>
            <FormField
              label="Duração"
              validation={serviceValidation.field("newServiceDuration")}
            >
              <TextField
                icon="time-outline"
                placeholder="60"
                suffix="min"
                accessibilityLabel="Duração do serviço em minutos"
                value={newServiceDuration}
                onChangeText={(value) =>
                  setNewServiceDuration(value.replace(/\D/g, "").slice(0, 4))
                }
                keyboardType="number-pad"
              />
            </FormField>
          </FormGrid>
          <View style={{ alignSelf: "flex-start" }}>
            <Button
              title="Cadastrar serviço"
              variant="outline"
              loading={createService.isPending}
              onPress={() => void handleCreateService()}
            />
          </View>
        </FormSection>
      ) : null}
    </FormSection>
  );

  const secondaryAction =
    formStep === 1 ? (
      <Button title="Cancelar" variant="outline" disabled={isSaving} onPress={onClose} />
    ) : (
      <Button
        title="Voltar"
        variant="outline"
        disabled={isSaving}
        onPress={() => setFormStep((current) => current - 1)}
      />
    );

  return (
    <StandardModal
      title={modalTitle}
      subtitle={
        isAppointment
          ? "Organize cliente, horário, local e valores"
          : "Organize cliente, atendimento, prazo e valores em um só lugar"
      }
      visible={visible}
      onClose={onClose}
      size="form"
      footer={
        <FormActions>
          {secondaryAction}
          {formStep < ORDER_FORM_STEPS.length ? (
            <Button title="Continuar" disabled={isSaving} onPress={goToNextStep} />
          ) : (
            <Button
              title={saveLabel}
              loading={isSaving}
              onPress={() => {
                void handleSave();
              }}
            />
          )}
        </FormActions>
      }
    >
      <FormStepProgress
        current={formStep}
        steps={ORDER_FORM_STEPS}
        onStepPress={setFormStep}
      />

      <View {...stepProps(1)}>
        <FormBody>
          {isAppointment ? (
            <>
              {serviceSection}
              {clientField}
            </>
          ) : (
            <>
              <FormGrid>
                <FormField label="O que é?" validation={stepOneValidation.field("title")}>
                  <TextField
                    icon="cube-outline"
                    placeholder={`Ex: ${experienceCopy.productExample}`}
                    accessibilityLabel="Nome da encomenda"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus={!isEditing}
                  />
                </FormField>
                {clientField}
                <OrderPhotoField
                  span="full"
                  photoUrl={currentPhotoUrl}
                  onPick={showPicker}
                  onRemove={() => {
                    setSavedPhotoUrl(null);
                    clear();
                  }}
                />
              </FormGrid>
              {serviceSection}
            </>
          )}
        </FormBody>
        <ClientPickerModal
          visible={showClientPicker}
          onClose={() => setShowClientPicker(false)}
          onSelect={(client) => {
            setClientId(client?.id);
            setClientName(client?.name ?? "");
          }}
        />
      </View>

      <View {...stepProps(2)}>
        <FormBody>
          <FormGrid>
            <View>
              <ValidationField {...stepTwoValidation.field("dateText")}>
                <DateField
                  label={isAppointment ? "Data do atendimento" : "Data de entrega"}
                  value={dateText}
                  onChange={setDateText}
                />
              </ValidationField>
              <View style={{ marginTop: spacing.md }}>
                <ChipRow>
                  {[
                    { label: "Hoje", value: offsetIsoBr(0) },
                    { label: "Amanhã", value: offsetIsoBr(1) },
                  ].map((chip) => (
                    <OptionChip
                      key={chip.label}
                      label={chip.label}
                      selected={dateText === chip.value}
                      onPress={() => setDateText(chip.value)}
                    />
                  ))}
                </ChipRow>
              </View>
            </View>
            <FormField
              label="Horário"
              optional={!isAppointment}
              validation={stepTwoValidation.field("time")}
            >
              <TextField
                icon="time-outline"
                placeholder="Ex: 14:30"
                value={time}
                onChangeText={(v) => setTime(maskTimeBR(v))}
                keyboardType="number-pad"
                maxLength={5}
              />
            </FormField>
          </FormGrid>

          <FormSection
            collapsible={false}
            title="Valores"
            subtitle="O sinal é a entrada que já foi paga."
          >
            <FormGrid>
              <FormField label="Valor combinado" optional>
                <TextField
                  prefix="R$"
                  placeholder="120,00"
                  accessibilityLabel="Valor combinado, em reais"
                  value={amount}
                  onChangeText={(value) => setAmount(maskCurrencyInput(value))}
                  keyboardType="numeric"
                />
              </FormField>
              <FormField
                label="Sinal recebido"
                optional
                validation={stepTwoValidation.field("deposit")}
              >
                <TextField
                  prefix="R$"
                  placeholder="60,00"
                  accessibilityLabel="Sinal recebido, em reais"
                  value={deposit}
                  onChangeText={(value) => setDeposit(maskCurrencyInput(value))}
                  keyboardType="numeric"
                />
              </FormField>
            </FormGrid>
          </FormSection>
        </FormBody>
      </View>

      <View {...stepProps(3)}>
        <FormBody>
          <FormField label="Observações" optional>
            <TextField
              placeholder={
                isAppointment
                  ? "Anotações sobre o atendimento..."
                  : `Anotações: ${experienceCopy.orderNoun}...`
              }
              value={notes}
              onChangeText={(value) => setNotes(value.slice(0, 500))}
              multiline
              numberOfLines={3}
            />
          </FormField>

          {!isAppointment ? (
            <FormSection
              title="Personalização"
              subtitle={`Tema, homenageado e cores para ${experienceCopy.orderNounPlural}`}
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
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            }}
          >
            <AppIcon
              name="shield-checkmark-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Seus dados estão seguros
            </Typography>
          </View>
        </FormBody>
      </View>
    </StandardModal>
  );
}
