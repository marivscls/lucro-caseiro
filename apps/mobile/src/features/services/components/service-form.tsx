import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type {
  CreateService,
  Service,
  ServiceAddOnInput,
  ServiceLocationMode,
  ServicePackageInput,
  ServiceVariationInput,
} from "@lucro-caseiro/contracts";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Switch, View } from "react-native";

import { FormSection } from "../../../shared/components/form-section";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { StandardModal } from "../../../shared/components/standard-modal";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  ChoiceField,
  FieldLinkAction,
  FormField,
  TextField,
  type ChoiceOption,
  OptionChip,
  ChipRow,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import {
  calculateServicePricing,
  findServiceItemValidationError,
  type ServiceItemValidationError,
} from "../domain";
import { useCreateService, useServices, useUpdateService } from "../hooks";

interface ServiceFormProps {
  readonly visible: boolean;
  readonly service?: Service | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const SERVICE_FORM_STEPS = [
  { label: "Serviço", title: "Serviço e agenda" },
  { label: "Opções", title: "Opções, adicionais e pacotes" },
  { label: "Preço", title: "Custos e preço sugerido" },
] as const;

function moneyValue(value: string): number {
  return parseCurrencyInput(value) || 0;
}

function numberValue(value: string): number {
  return Number(value.replace(",", ".")) || 0;
}

function percentageInput(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, "").replace(".", ",");
  const [integer = "", ...decimals] = cleaned.split(",");
  return decimals.length > 0 ? `${integer},${decimals.join("").slice(0, 2)}` : integer;
}

function initialMoney(value?: number | null): string {
  return value == null || value === 0 ? "" : currencyInput(value);
}

function replaceListItem<T>(items: T[], index: number, replacement: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? replacement : item));
}

function removeListItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

const DURATION_PRESETS = [
  { label: "30 min", value: "30" },
  { label: "1 hora", value: "60" },
  { label: "1h30", value: "90" },
  { label: "2 horas", value: "120" },
] as const;

const LOCATION_OPTIONS: readonly ChoiceOption<ServiceLocationMode>[] = [
  { label: "Meu espaço", value: "business" },
  { label: "Endereço do cliente", value: "client" },
  { label: "Online", value: "online" },
  { label: "Flexível", value: "flexible" },
];

const AVAILABILITY_OPTIONS: readonly ChoiceOption<"active" | "paused">[] = [
  { label: "Disponível", value: "active" },
  { label: "Pausado", value: "paused" },
];

function itemKey(
  kind: ServiceItemValidationError["kind"],
  index: number,
  field: ServiceItemValidationError["field"],
): string {
  return `${kind}-${index}-${field}`;
}

/** Um item de lista (variação, adicional ou pacote): título, remover e campos. */
function ListItemCard({
  title,
  removeLabel,
  onRemove,
  children,
}: Readonly<{
  title: string;
  removeLabel: string;
  onRemove: () => void;
  children: React.ReactNode;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        gap: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Typography variant="bodyBold">{title}</Typography>
        <FieldLinkAction
          label="Remover"
          icon="trash-outline"
          accessibilityLabel={`${removeLabel} ${title}`}
          onPress={onRemove}
        />
      </View>
      {children}
    </View>
  );
}

function AddItemButton({
  title,
  onPress,
}: Readonly<{ title: string; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <View style={{ alignSelf: "flex-start" }}>
      <Button
        title={title}
        variant="outline"
        icon={<AppIcon name="add" size={20} color={theme.colors.primaryStrong} />}
        onPress={onPress}
      />
    </View>
  );
}

export function ServiceForm({ visible, service, onClose, onSuccess }: ServiceFormProps) {
  const { theme } = useTheme();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const servicesQuery = useServices();
  const submittingRef = useRef(false);
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    String(service?.durationMinutes ?? 60),
  );
  const [defaultPrice, setDefaultPrice] = useState(initialMoney(service?.defaultPrice));
  const [materialCost, setMaterialCost] = useState(initialMoney(service?.materialCost));
  const [hourlyRate, setHourlyRate] = useState(initialMoney(service?.hourlyRate));
  const [otherCost, setOtherCost] = useState(initialMoney(service?.otherCost));
  const [fixedCostShare, setFixedCostShare] = useState(
    initialMoney(service?.fixedCostShare),
  );
  const [markupPercent, setMarkupPercent] = useState(
    service?.markupPercent ? String(service.markupPercent).replace(".", ",") : "",
  );
  const [feesPercent, setFeesPercent] = useState(
    service?.feesPercent ? String(service.feesPercent).replace(".", ",") : "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [formStep, setFormStep] = useState(1);
  const [locationMode, setLocationMode] = useState<ServiceLocationMode>(
    service?.locationMode ?? "business",
  );
  const [bufferMinutes, setBufferMinutes] = useState(String(service?.bufferMinutes ?? 0));
  const [publicEnabled, setPublicEnabled] = useState(service?.publicEnabled ?? false);
  const bookingInstructions = service?.bookingInstructions ?? "";
  const [variations, setVariations] = useState<ServiceVariationInput[]>(
    service?.variations.map(({ id, name, durationMinutes, price, active }) => ({
      id,
      name,
      durationMinutes,
      price,
      active,
    })) ?? [],
  );
  const [addOns, setAddOns] = useState<ServiceAddOnInput[]>(
    service?.addOns.map(({ id, name, durationMinutes, price, active }) => ({
      id,
      name,
      durationMinutes,
      price,
      active,
    })) ?? [],
  );
  const [packages, setPackages] = useState<ServicePackageInput[]>(
    service?.packages.map(
      ({ id, name, sessions, price, validityDays, recurrenceDays, active }) => ({
        id,
        name,
        sessions,
        price,
        validityDays,
        recurrenceDays,
        active,
      }),
    ) ?? [],
  );
  const itemValidationError = useMemo(
    () => findServiceItemValidationError({ variations, addOns, packages }),
    [addOns, packages, variations],
  );

  const pricing = useMemo(
    () =>
      calculateServicePricing({
        durationMinutes: Number.parseInt(durationMinutes, 10) || 0,
        materialCost: moneyValue(materialCost),
        hourlyRate: moneyValue(hourlyRate),
        otherCost: moneyValue(otherCost),
        fixedCostShare: moneyValue(fixedCostShare),
        markupPercent: numberValue(markupPercent),
        feesPercent: numberValue(feesPercent),
      }),
    [
      durationMinutes,
      feesPercent,
      fixedCostShare,
      hourlyRate,
      markupPercent,
      materialCost,
      otherCost,
    ],
  );
  const priceAfterFees =
    moneyValue(defaultPrice) * (1 - Math.min(numberValue(feesPercent), 95) / 100);

  const saving = createService.isPending || updateService.isPending;

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [service?.id, visible]);

  const price = defaultPrice ? moneyValue(defaultPrice) : null;
  const markup = numberValue(markupPercent);
  const fees = numberValue(feesPercent);
  const buffer = Number.parseInt(bufferMinutes, 10) || 0;

  // Cada etapa valida só os próprios campos, com o erro no campo.
  const serviceStepValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome do serviço.",
      durationMinutes:
        (!durationMinutes.trim() ||
          !(Number(durationMinutes) >= 5 && Number(durationMinutes) <= 1440)) &&
        "Informe uma duração entre 5 minutos e 24 horas.",
      defaultPrice:
        price !== null && price <= 0 && "O preço padrão deve ser maior que zero.",
      bufferMinutes:
        (buffer < 0 || buffer > 1440) &&
        "O intervalo entre atendimentos deve ficar entre 0 e 1440 minutos.",
    },
    visible,
  );

  // Variações, adicionais e pacotes: o primeiro problema aparece no campo dele.
  const itemErrorKey = itemValidationError
    ? itemKey(
        itemValidationError.kind,
        itemValidationError.index,
        itemValidationError.field,
      )
    : "none";
  const itemsStepValidation = useFormValidation<string>(
    { [itemErrorKey]: itemValidationError?.message ?? false },
    visible,
  );

  const pricingStepValidation = useFormValidation(
    {
      markupPercent:
        (markup < 0 || markup > 1000) &&
        "O acréscimo sobre o custo deve ficar entre 0% e 1000%.",
      feesPercent:
        (fees < 0 || fees > 95) && "As taxas sobre a venda devem ficar entre 0% e 95%.",
    },
    visible,
  );

  const stepValidations = [
    serviceStepValidation,
    itemsStepValidation,
    pricingStepValidation,
  ] as const;

  function itemField(
    kind: ServiceItemValidationError["kind"],
    index: number,
    field: ServiceItemValidationError["field"],
  ) {
    return itemsStepValidation.field(itemKey(kind, index, field));
  }

  function goToNextStep() {
    if (!stepValidations[formStep - 1].validate()) return;
    setFormStep((current) => current + 1);
  }

  async function submit() {
    for (const [index, validation] of stepValidations.entries()) {
      if (!validation.validate()) {
        setFormStep(index + 1);
        return;
      }
    }
    const normalizedName = name.trim();
    const duration = Number.parseInt(durationMinutes, 10);
    if (!normalizedName || !Number.isInteger(duration)) return;

    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const refreshed = await servicesQuery.refetch();
      const duplicate = refreshed.data?.some(
        (item) =>
          item.id !== service?.id &&
          item.name.trim().toLocaleLowerCase("pt-BR") ===
            normalizedName.toLocaleLowerCase("pt-BR"),
      );
      if (duplicate) {
        alertValidation("Já existe um serviço com esse nome.");
        return;
      }

      const data: CreateService = {
        name: normalizedName,
        description: description.trim() || null,
        durationMinutes: duration,
        defaultPrice: price,
        materialCost: moneyValue(materialCost),
        hourlyRate: moneyValue(hourlyRate),
        otherCost: moneyValue(otherCost),
        fixedCostShare: moneyValue(fixedCostShare),
        markupPercent: markup,
        feesPercent: fees,
        locationMode,
        bufferMinutes: buffer,
        publicEnabled,
        bookingInstructions: bookingInstructions.trim() || null,
        variations,
        addOns,
        packages,
        active,
      };

      if (service) {
        await updateService.mutateAsync({ id: service.id, data });
      } else {
        await createService.mutateAsync(data);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      alertError(error);
    } finally {
      submittingRef.current = false;
    }
  }

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

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title={service ? "Editar serviço" : "Novo serviço"}
      size="form"
      footer={
        <FormActions>
          {formStep > 1 ? (
            <Button
              title="Voltar"
              variant="outline"
              onPress={() => setFormStep((current) => current - 1)}
              disabled={saving}
            />
          ) : (
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onClose}
              disabled={saving}
            />
          )}
          {formStep < SERVICE_FORM_STEPS.length ? (
            <Button title="Continuar" onPress={goToNextStep} disabled={saving} />
          ) : (
            <Button
              title={service ? "Salvar alterações" : "Cadastrar serviço"}
              onPress={() => void submit()}
              loading={saving}
            />
          )}
        </FormActions>
      }
    >
      <FormStepProgress
        compact
        current={formStep}
        steps={SERVICE_FORM_STEPS}
        onStepPress={setFormStep}
      />

      <View {...stepProps(1)}>
        <FormBody>
          <FormSection
            collapsible={false}
            title="Dados do serviço"
            subtitle="Preço variável? Deixe o preço em branco e combine ao agendar."
          >
            <FormGrid>
              <FormField
                label="Nome do serviço"
                span="full"
                validation={serviceStepValidation.field("name")}
              >
                <TextField
                  icon="briefcase-outline"
                  placeholder="Ex.: Consulta, corte, instalação ou aula"
                  accessibilityLabel="Nome do serviço"
                  value={name}
                  onChangeText={setName}
                  maxLength={120}
                />
              </FormField>
              <FormField label="Descrição" optional span="full">
                <TextField
                  placeholder="Explique o que está incluído, o formato e onde acontece"
                  accessibilityLabel="Descrição do serviço"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                />
              </FormField>
              <FormField
                label="Duração"
                validation={serviceStepValidation.field("durationMinutes")}
              >
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
                label="Preço"
                optional
                validation={serviceStepValidation.field("defaultPrice")}
              >
                <TextField
                  prefix="R$"
                  placeholder="0,00"
                  accessibilityLabel="Preço, em reais"
                  value={defaultPrice}
                  onChangeText={(value) => setDefaultPrice(maskCurrencyInput(value))}
                  keyboardType="numeric"
                />
              </FormField>
              <FormField span="full">
                <ChipRow>
                  {DURATION_PRESETS.map((preset) => (
                    <OptionChip
                      key={preset.value}
                      label={preset.label}
                      accessibilityLabel={`Duração de ${preset.label}`}
                      selected={durationMinutes === preset.value}
                      onPress={() => setDurationMinutes(preset.value)}
                    />
                  ))}
                </ChipRow>
              </FormField>
              <FormField label="Disponibilidade" span="full">
                <ChoiceField
                  value={active ? "active" : "paused"}
                  options={AVAILABILITY_OPTIONS}
                  onChange={(value) => setActive(value === "active")}
                  accessibilityLabel="Disponibilidade"
                />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection
            collapsible={false}
            title="Agenda"
            subtitle="Local e intervalo entre atendimentos"
          >
            <FormField label="Onde o atendimento acontece">
              <ChoiceField
                value={locationMode}
                options={LOCATION_OPTIONS}
                onChange={setLocationMode}
                accessibilityLabel="Onde o atendimento acontece"
              />
            </FormField>
            <FormGrid>
              <FormField
                label="Intervalo após cada atendimento"
                hint="Evita horários colados e considera limpeza, deslocamento ou preparação."
                validation={serviceStepValidation.field("bufferMinutes")}
                span="full"
              >
                <View style={{ maxWidth: 320 }}>
                  <TextField
                    icon="time-outline"
                    placeholder="0"
                    suffix="min"
                    accessibilityLabel="Intervalo após cada atendimento, em minutos"
                    value={bufferMinutes}
                    onChangeText={(value) =>
                      setBufferMinutes(value.replace(/\D/g, "").slice(0, 4))
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </FormField>
            </FormGrid>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="desktopFieldLabel">Exibir no catálogo</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  A curadoria e o compartilhamento ficam em Catálogo online.
                </Typography>
              </View>
              <Switch
                value={publicEnabled}
                onValueChange={setPublicEnabled}
                trackColor={{ true: theme.colors.primary }}
                accessibilityLabel="Exibir serviço no catálogo"
              />
            </View>
          </FormSection>
        </FormBody>
      </View>

      <View {...stepProps(2)}>
        <FormBody>
          <FormSection
            collapsible={false}
            title="Variações"
            subtitle="Use quando o cliente escolhe uma versão, como curta, completa ou premium."
          >
            {variations.map((variation, index) => (
              <ListItemCard
                key={variation.id ?? `variation-${index}`}
                title={`Opção ${index + 1}`}
                removeLabel="Remover opção"
                onRemove={() => setVariations(removeListItem(variations, index))}
              >
                <FormGrid>
                  <FormField
                    label="Nome da opção"
                    span="full"
                    validation={itemField("variation", index, "name")}
                  >
                    <TextField
                      placeholder="Ex.: Sessão completa"
                      accessibilityLabel={`Nome da opção ${index + 1}`}
                      value={variation.name}
                      onChangeText={(value) =>
                        setVariations(
                          replaceListItem(variations, index, {
                            ...variation,
                            name: value,
                          }),
                        )
                      }
                    />
                  </FormField>
                  <FormField
                    label="Duração"
                    validation={itemField("variation", index, "durationMinutes")}
                  >
                    <TextField
                      suffix="min"
                      accessibilityLabel={`Duração da opção ${index + 1}, em minutos`}
                      value={String(variation.durationMinutes)}
                      onChangeText={(value) =>
                        setVariations(
                          replaceListItem(variations, index, {
                            ...variation,
                            durationMinutes: Number(value.replace(/\D/g, "")) || 0,
                          }),
                        )
                      }
                      keyboardType="number-pad"
                    />
                  </FormField>
                  <FormField
                    label="Preço"
                    validation={itemField("variation", index, "price")}
                  >
                    <TextField
                      prefix="R$"
                      accessibilityLabel={`Preço da opção ${index + 1}, em reais`}
                      value={currencyInput(variation.price)}
                      onChangeText={(value) =>
                        setVariations(
                          replaceListItem(variations, index, {
                            ...variation,
                            price: parseCurrencyInput(value) || 0,
                          }),
                        )
                      }
                      keyboardType="numeric"
                    />
                  </FormField>
                </FormGrid>
              </ListItemCard>
            ))}
            <AddItemButton
              title="Adicionar variação"
              onPress={() =>
                setVariations((current) => [
                  ...current,
                  {
                    name: "",
                    durationMinutes: Number.parseInt(durationMinutes, 10) || 60,
                    price: moneyValue(defaultPrice),
                    active: true,
                  },
                ])
              }
            />
          </FormSection>

          <FormSection
            collapsible={false}
            title="Adicionais"
            subtitle="Use para extras opcionais, como deslocamento, finalização ou material especial."
          >
            {addOns.map((addOn, index) => (
              <ListItemCard
                key={addOn.id ?? `addon-${index}`}
                title={`Adicional ${index + 1}`}
                removeLabel="Remover adicional"
                onRemove={() => setAddOns(removeListItem(addOns, index))}
              >
                <FormGrid>
                  <FormField
                    label="Nome do adicional"
                    span="full"
                    validation={itemField("addOn", index, "name")}
                  >
                    <TextField
                      placeholder="Ex.: Deslocamento"
                      accessibilityLabel={`Nome do adicional ${index + 1}`}
                      value={addOn.name}
                      onChangeText={(value) =>
                        setAddOns(
                          replaceListItem(addOns, index, { ...addOn, name: value }),
                        )
                      }
                    />
                  </FormField>
                  <FormField
                    label="Minutos extras"
                    validation={itemField("addOn", index, "durationMinutes")}
                  >
                    <TextField
                      suffix="min"
                      accessibilityLabel={`Minutos extras do adicional ${index + 1}`}
                      value={String(addOn.durationMinutes)}
                      onChangeText={(value) =>
                        setAddOns(
                          replaceListItem(addOns, index, {
                            ...addOn,
                            durationMinutes: Number(value.replace(/\D/g, "")) || 0,
                          }),
                        )
                      }
                      keyboardType="number-pad"
                    />
                  </FormField>
                  <FormField
                    label="Valor adicional"
                    validation={itemField("addOn", index, "price")}
                  >
                    <TextField
                      prefix="R$"
                      accessibilityLabel={`Valor do adicional ${index + 1}, em reais`}
                      value={currencyInput(addOn.price)}
                      onChangeText={(value) =>
                        setAddOns(
                          replaceListItem(addOns, index, {
                            ...addOn,
                            price: parseCurrencyInput(value) || 0,
                          }),
                        )
                      }
                      keyboardType="numeric"
                    />
                  </FormField>
                </FormGrid>
              </ListItemCard>
            ))}
            <AddItemButton
              title="Adicionar adicional"
              onPress={() =>
                setAddOns((current) => [
                  ...current,
                  { name: "", durationMinutes: 0, price: 0, active: true },
                ])
              }
            />
          </FormSection>

          <FormSection
            collapsible={false}
            title="Pacotes e recorrência"
            subtitle="Venda várias sessões juntas e controle o saldo usado por cliente."
          >
            {packages.map((servicePackage, index) => (
              <ListItemCard
                key={servicePackage.id ?? `package-${index}`}
                title={`Pacote ${index + 1}`}
                removeLabel="Remover pacote"
                onRemove={() => setPackages(removeListItem(packages, index))}
              >
                <FormGrid>
                  <FormField
                    label="Nome do pacote"
                    span="full"
                    validation={itemField("package", index, "name")}
                  >
                    <TextField
                      placeholder="Ex.: Plano mensal"
                      accessibilityLabel={`Nome do pacote ${index + 1}`}
                      value={servicePackage.name}
                      onChangeText={(value) =>
                        setPackages(
                          replaceListItem(packages, index, {
                            ...servicePackage,
                            name: value,
                          }),
                        )
                      }
                    />
                  </FormField>
                  <FormField
                    label="Sessões"
                    validation={itemField("package", index, "sessions")}
                  >
                    <TextField
                      accessibilityLabel={`Sessões do pacote ${index + 1}`}
                      value={String(servicePackage.sessions)}
                      onChangeText={(value) =>
                        setPackages(
                          replaceListItem(packages, index, {
                            ...servicePackage,
                            sessions: Number(value.replace(/\D/g, "")) || 0,
                          }),
                        )
                      }
                      keyboardType="number-pad"
                    />
                  </FormField>
                  <FormField
                    label="Valor do pacote"
                    validation={itemField("package", index, "price")}
                  >
                    <TextField
                      prefix="R$"
                      accessibilityLabel={`Valor do pacote ${index + 1}, em reais`}
                      value={currencyInput(servicePackage.price)}
                      onChangeText={(value) =>
                        setPackages(
                          replaceListItem(packages, index, {
                            ...servicePackage,
                            price: parseCurrencyInput(value) || 0,
                          }),
                        )
                      }
                      keyboardType="numeric"
                    />
                  </FormField>
                  <FormField
                    label="Validade"
                    validation={itemField("package", index, "validityDays")}
                  >
                    <TextField
                      suffix="dias"
                      accessibilityLabel={`Validade do pacote ${index + 1}, em dias`}
                      value={String(servicePackage.validityDays)}
                      onChangeText={(value) =>
                        setPackages(
                          replaceListItem(packages, index, {
                            ...servicePackage,
                            validityDays: Number(value.replace(/\D/g, "")) || 0,
                          }),
                        )
                      }
                      keyboardType="number-pad"
                    />
                  </FormField>
                  <FormField
                    label="Repetir a cada"
                    optional
                    validation={itemField("package", index, "recurrenceDays")}
                  >
                    <TextField
                      suffix="dias"
                      placeholder="7"
                      accessibilityLabel={`Repetir o pacote ${index + 1} a cada, em dias`}
                      value={
                        servicePackage.recurrenceDays
                          ? String(servicePackage.recurrenceDays)
                          : ""
                      }
                      onChangeText={(value) =>
                        setPackages(
                          replaceListItem(packages, index, {
                            ...servicePackage,
                            recurrenceDays: Number(value.replace(/\D/g, "")) || null,
                          }),
                        )
                      }
                      keyboardType="number-pad"
                    />
                  </FormField>
                </FormGrid>
              </ListItemCard>
            ))}
            <AddItemButton
              title="Adicionar pacote"
              onPress={() =>
                setPackages((current) => [
                  ...current,
                  {
                    name: "",
                    sessions: 4,
                    price: Math.max(moneyValue(defaultPrice) * 4, 0),
                    validityDays: 90,
                    recurrenceDays: 7,
                    active: true,
                  },
                ])
              }
            />
          </FormSection>
        </FormBody>
      </View>

      <View {...stepProps(3)}>
        <FormBody>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Preencha só o que se aplica ao seu trabalho. Campos vazios valem zero.
          </Typography>
          <FormGrid>
            <FormField label="Materiais e insumos" optional>
              <TextField
                prefix="R$"
                placeholder="0,00"
                accessibilityLabel="Materiais e insumos, em reais"
                value={materialCost}
                onChangeText={(value) => setMaterialCost(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Sua hora de trabalho" optional>
              <TextField
                prefix="R$"
                placeholder="0,00"
                accessibilityLabel="Valor da sua hora de trabalho, em reais"
                value={hourlyRate}
                onChangeText={(value) => setHourlyRate(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Deslocamento e outros custos" optional>
              <TextField
                prefix="R$"
                placeholder="0,00"
                accessibilityLabel="Deslocamento e outros custos, em reais"
                value={otherCost}
                onChangeText={(value) => setOtherCost(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Rateio de custos fixos" optional>
              <TextField
                prefix="R$"
                placeholder="0,00"
                accessibilityLabel="Rateio de custos fixos, em reais"
                value={fixedCostShare}
                onChangeText={(value) => setFixedCostShare(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
            <FormField
              label="Acréscimo sobre o custo"
              optional
              validation={pricingStepValidation.field("markupPercent")}
            >
              <TextField
                suffix="%"
                placeholder="0"
                accessibilityLabel="Acréscimo desejado sobre o custo, em porcentagem"
                value={markupPercent}
                onChangeText={(value) => setMarkupPercent(percentageInput(value))}
                keyboardType="numeric"
              />
            </FormField>
            <FormField
              label="Taxas de pagamento"
              optional
              validation={pricingStepValidation.field("feesPercent")}
            >
              <TextField
                suffix="%"
                placeholder="0"
                accessibilityLabel="Taxas de pagamento ou plataforma, em porcentagem"
                value={feesPercent}
                onChangeText={(value) => setFeesPercent(percentageInput(value))}
                keyboardType="numeric"
              />
            </FormField>
          </FormGrid>

          <View
            style={{
              gap: spacing.sm,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primaryBg,
              padding: spacing.lg,
            }}
          >
            <Typography variant="bodyBold">Estimativa com os dados informados</Typography>
            <Typography variant="body">
              Seu tempo de trabalho: {formatCurrency(pricing.laborCost)}
            </Typography>
            <Typography variant="body">
              Custo estimado do atendimento: {formatCurrency(pricing.totalCost)}
            </Typography>
            <Typography variant="h3" color={theme.colors.primaryStrong}>
              Preço sugerido: {formatCurrency(pricing.suggestedPrice)}
            </Typography>
            {pricing.feesAmount > 0 ? (
              <Typography variant="caption">
                Inclui {formatCurrency(pricing.feesAmount)} para cobrir as taxas
                informadas.
              </Typography>
            ) : null}
            {defaultPrice &&
            pricing.totalCost > 0 &&
            priceAfterFees < pricing.totalCost ? (
              <Typography variant="caption" color={theme.colors.alert}>
                Depois das taxas, o preço cobrado fica abaixo do custo estimado.
              </Typography>
            ) : null}
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Esta estimativa não inclui valores que você deixou em branco.
            </Typography>
            <View style={{ alignSelf: "flex-start", marginTop: spacing.sm }}>
              <Button
                title="Usar como preço padrão"
                variant="outline"
                disabled={pricing.suggestedPrice <= 0}
                onPress={() => setDefaultPrice(currencyInput(pricing.suggestedPrice))}
              />
            </View>
          </View>
        </FormBody>
      </View>
    </StandardModal>
  );
}
