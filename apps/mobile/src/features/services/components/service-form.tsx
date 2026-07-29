import type {
  CreateService,
  Service,
  ServiceAddOnInput,
  ServiceLocationMode,
  ServicePackageInput,
  ServiceVariationInput,
} from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Chip,
  Input,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { FormSection } from "../../../shared/components/form-section";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { calculateServicePricing } from "../domain";
import { useCreateService, useServices, useUpdateService } from "../hooks";

interface ServiceFormProps {
  readonly visible: boolean;
  readonly service?: Service | null;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

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

const LOCATION_OPTIONS: {
  label: string;
  value: ServiceLocationMode;
}[] = [
  { label: "Meu espaço", value: "business" },
  { label: "Endereço do cliente", value: "client" },
  { label: "Online", value: "online" },
  { label: "Flexível", value: "flexible" },
];

export function ServiceForm({ visible, service, onClose, onSuccess }: ServiceFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
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
  const [locationMode, setLocationMode] = useState<ServiceLocationMode>(
    service?.locationMode ?? "business",
  );
  const [bufferMinutes, setBufferMinutes] = useState(String(service?.bufferMinutes ?? 0));
  const [publicEnabled, setPublicEnabled] = useState(service?.publicEnabled ?? false);
  const [bookingInstructions, setBookingInstructions] = useState(
    service?.bookingInstructions ?? "",
  );
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

  const hasPricingData = !!(
    service?.materialCost ||
    service?.hourlyRate ||
    service?.otherCost ||
    service?.fixedCostShare ||
    service?.markupPercent ||
    service?.feesPercent
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

  async function submit() {
    const normalizedName = name.trim();
    const duration = Number.parseInt(durationMinutes, 10);
    if (!normalizedName) {
      alertValidation("Informe o nome do serviço.");
      return;
    }
    if (!Number.isInteger(duration) || duration < 5 || duration > 1440) {
      alertValidation("Informe uma duração entre 5 minutos e 24 horas.");
      return;
    }
    const price = defaultPrice ? moneyValue(defaultPrice) : null;
    if (price !== null && price <= 0) {
      alertValidation("O preço padrão deve ser maior que zero.");
      return;
    }
    const markup = numberValue(markupPercent);
    const fees = numberValue(feesPercent);
    if (markup < 0 || markup > 1000) {
      alertValidation("O acréscimo sobre o custo deve ficar entre 0% e 1000%.");
      return;
    }
    if (fees < 0 || fees > 95) {
      alertValidation("As taxas sobre a venda devem ficar entre 0% e 95%.");
      return;
    }
    const buffer = Number.parseInt(bufferMinutes, 10) || 0;
    if (buffer < 0 || buffer > 1440) {
      alertValidation(
        "O intervalo entre atendimentos deve ficar entre 0 e 1440 minutos.",
      );
      return;
    }
    if (
      variations.some(
        (item) => !item.name.trim() || item.durationMinutes < 5 || item.price <= 0,
      ) ||
      addOns.some(
        (item) => !item.name.trim() || item.durationMinutes < 0 || item.price <= 0,
      ) ||
      packages.some(
        (item) =>
          !item.name.trim() ||
          item.sessions < 2 ||
          item.price <= 0 ||
          item.validityDays < 1,
      )
    ) {
      alertValidation(
        "Revise nomes, durações e valores das opções, adicionais e pacotes.",
      );
      return;
    }

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

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title={service ? "Editar serviço" : "Novo serviço"}
      subtitle="Organize o que você oferece, o tempo e o preço"
      wide
      footer={
        <>
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={onClose}
            disabled={saving}
            style={{ flex: 1 }}
          />
          <Button
            title={service ? "Salvar" : "Cadastrar"}
            onPress={() => void submit()}
            loading={saving}
            disabled={saving}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      <Card
        variant="elevated"
        style={{
          backgroundColor: theme.colors.surface,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="bodyBold">
            Serve para diferentes tipos de trabalho
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Cadastre atendimentos presenciais, online ou no endereço do cliente:
            consultas, aulas, beleza, manutenção, instalação, criação e outros.
          </Typography>
        </View>
      </Card>

      <FormSection
        title="Como o serviço funciona"
        subtitle="O que a pessoa recebe, quanto tempo leva e quanto custa"
        icon="briefcase-outline"
        initiallyOpen
      >
        <Input
          label="Nome do serviço"
          placeholder="Ex.: Consulta, corte, instalação ou aula"
          value={name}
          onChangeText={setName}
          maxLength={120}
        />
        <Input
          label="Descrição (opcional)"
          placeholder="Explique o que está incluído, o formato e onde acontece"
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          multiline
          textAlignVertical="top"
          style={{ height: 88, paddingVertical: spacing.md }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          <Input
            label="Duração em minutos"
            placeholder="60"
            value={durationMinutes}
            onChangeText={(value) =>
              setDurationMinutes(value.replace(/\D/g, "").slice(0, 4))
            }
            keyboardType="number-pad"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Preço cobrado (opcional)"
            placeholder="R$ 0,00"
            value={defaultPrice}
            onChangeText={(value) => setDefaultPrice(maskCurrencyInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Atalhos de duração
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {DURATION_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                selected={durationMinutes === preset.value}
                onPress={() => setDurationMinutes(preset.value)}
              />
            ))}
          </View>
        </View>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Se o preço variar conforme o atendimento, deixe em branco e combine o valor ao
          criar o agendamento.
        </Typography>
        <Typography variant="bodyBold">Disponibilidade</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Serviços disponíveis aparecem para novos agendamentos. Pausar preserva o
          histórico.
        </Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Chip label="Disponível" selected={active} onPress={() => setActive(true)} />
          <Chip label="Pausado" selected={!active} onPress={() => setActive(false)} />
        </View>
      </FormSection>

      <FormSection
        title="Agenda e divulgação"
        subtitle="Defina onde acontece, o respiro entre horários e o que aparece na vitrine"
        icon="calendar-outline"
        initiallyOpen={!!service?.publicEnabled}
      >
        <Typography variant="bodyBold">Onde o atendimento acontece</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {LOCATION_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={locationMode === option.value}
              onPress={() => setLocationMode(option.value)}
            />
          ))}
        </View>
        <Input
          label="Intervalo após cada atendimento"
          placeholder="0 minutos"
          value={bufferMinutes}
          onChangeText={(value) => setBufferMinutes(value.replace(/\D/g, "").slice(0, 4))}
          keyboardType="number-pad"
          containerStyle={isDesktop ? { maxWidth: 320 } : undefined}
        />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Evita horários colados e considera limpeza, deslocamento ou preparação.
        </Typography>
        <Typography variant="bodyBold">Vitrine pública</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Ao publicar, clientes podem conhecer este serviço e solicitar um horário. A
          solicitação só vira agendamento depois da sua confirmação.
        </Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Chip
            label="Visível na vitrine"
            selected={publicEnabled}
            onPress={() => setPublicEnabled(true)}
          />
          <Chip
            label="Somente interno"
            selected={!publicEnabled}
            onPress={() => setPublicEnabled(false)}
          />
        </View>
        {publicEnabled ? (
          <Input
            label="Orientações para agendamento (opcional)"
            placeholder="Ex.: traga uma foto de referência ou informe o bairro"
            value={bookingInstructions}
            onChangeText={setBookingInstructions}
            maxLength={500}
            multiline
            textAlignVertical="top"
            style={{ height: 88, paddingVertical: spacing.md }}
          />
        ) : null}
      </FormSection>

      <FormSection
        title="Opções e adicionais"
        subtitle="Crie versões do serviço e complementos que alteram tempo e valor"
        icon="options-outline"
        initiallyOpen={variations.length > 0 || addOns.length > 0}
      >
        <Typography variant="bodyBold">Variações</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Use quando o cliente escolhe uma versão, como curta, completa ou premium.
        </Typography>
        {variations.map((variation, index) => (
          <Card key={variation.id ?? `variation-${index}`} style={{ gap: spacing.md }}>
            <Input
              label="Nome da opção"
              placeholder="Ex.: Sessão completa"
              value={variation.name}
              onChangeText={(value) =>
                setVariations(
                  replaceListItem(variations, index, { ...variation, name: value }),
                )
              }
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <Input
                label="Duração"
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
                containerStyle={{ flex: 1, minWidth: 140 }}
              />
              <Input
                label="Preço"
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
                containerStyle={{ flex: 1, minWidth: 140 }}
              />
            </View>
            <Button
              title="Remover opção"
              variant="secondary"
              onPress={() => setVariations(removeListItem(variations, index))}
            />
          </Card>
        ))}
        <Button
          title="Adicionar variação"
          variant="secondary"
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

        <Typography variant="bodyBold" style={{ marginTop: spacing.md }}>
          Adicionais
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Use para extras opcionais, como deslocamento, finalização ou material especial.
        </Typography>
        {addOns.map((addOn, index) => (
          <Card key={addOn.id ?? `addon-${index}`} style={{ gap: spacing.md }}>
            <Input
              label="Nome do adicional"
              placeholder="Ex.: Deslocamento"
              value={addOn.name}
              onChangeText={(value) =>
                setAddOns(replaceListItem(addOns, index, { ...addOn, name: value }))
              }
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <Input
                label="Minutos extras"
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
                containerStyle={{ flex: 1, minWidth: 140 }}
              />
              <Input
                label="Valor adicional"
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
                containerStyle={{ flex: 1, minWidth: 140 }}
              />
            </View>
            <Button
              title="Remover adicional"
              variant="secondary"
              onPress={() => setAddOns(removeListItem(addOns, index))}
            />
          </Card>
        ))}
        <Button
          title="Adicionar adicional"
          variant="secondary"
          onPress={() =>
            setAddOns((current) => [
              ...current,
              { name: "", durationMinutes: 0, price: 0, active: true },
            ])
          }
        />
      </FormSection>

      <FormSection
        title="Pacotes e recorrência"
        subtitle="Venda várias sessões juntas e controle o saldo usado por cliente"
        icon="repeat-outline"
        initiallyOpen={packages.length > 0}
      >
        {packages.map((servicePackage, index) => (
          <Card key={servicePackage.id ?? `package-${index}`} style={{ gap: spacing.md }}>
            <Input
              label="Nome do pacote"
              placeholder="Ex.: Plano mensal"
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <Input
                label="Sessões"
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
                containerStyle={{ flex: 1, minWidth: 130 }}
              />
              <Input
                label="Valor do pacote"
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
                containerStyle={{ flex: 1, minWidth: 160 }}
              />
              <Input
                label="Validade (dias)"
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
                containerStyle={{ flex: 1, minWidth: 150 }}
              />
              <Input
                label="Repetir a cada (dias)"
                placeholder="Opcional"
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
                containerStyle={{ flex: 1, minWidth: 170 }}
              />
            </View>
            <Button
              title="Remover pacote"
              variant="secondary"
              onPress={() => setPackages(removeListItem(packages, index))}
            />
          </Card>
        ))}
        <Button
          title="Adicionar pacote"
          variant="secondary"
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

      <FormSection
        title="Custos e preço sugerido"
        subtitle="Opcional; preencha somente o que se aplica ao seu trabalho"
        icon="calculator-outline"
        initiallyOpen={hasPricingData}
      >
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Campos vazios valem zero. O cálculo usa apenas os valores que você informar.
        </Typography>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: isDesktop ? "flex-end" : "stretch",
            gap: spacing.md,
          }}
        >
          <Input
            label="Materiais e insumos"
            placeholder="R$ 0,00"
            value={materialCost}
            onChangeText={(value) => setMaterialCost(maskCurrencyInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Valor da sua hora de trabalho"
            placeholder="R$ 0,00"
            value={hourlyRate}
            onChangeText={(value) => setHourlyRate(maskCurrencyInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Deslocamento e outros custos"
            placeholder="R$ 0,00"
            value={otherCost}
            onChangeText={(value) => setOtherCost(maskCurrencyInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Rateio de custos fixos"
            placeholder="R$ 0,00"
            value={fixedCostShare}
            onChangeText={(value) => setFixedCostShare(maskCurrencyInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Acréscimo desejado sobre o custo (%)"
            placeholder="0"
            value={markupPercent}
            onChangeText={(value) => setMarkupPercent(percentageInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
          <Input
            label="Taxas de pagamento ou plataforma (%)"
            placeholder="0"
            value={feesPercent}
            onChangeText={(value) => setFeesPercent(percentageInput(value))}
            keyboardType="numeric"
            containerStyle={{ flex: 1, minWidth: 180 }}
          />
        </View>

        <Card
          style={{
            gap: spacing.sm,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primaryBg,
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
              Inclui {formatCurrency(pricing.feesAmount)} para cobrir as taxas informadas.
            </Typography>
          ) : null}
          {defaultPrice && pricing.totalCost > 0 && priceAfterFees < pricing.totalCost ? (
            <Typography variant="caption" color={theme.colors.alert}>
              Depois das taxas, o preço cobrado fica abaixo do custo estimado.
            </Typography>
          ) : null}
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Esta estimativa não inclui valores que você deixou em branco.
          </Typography>
          <Button
            title="Usar como preço padrão"
            variant="secondary"
            disabled={pricing.suggestedPrice <= 0}
            onPress={() => setDefaultPrice(currencyInput(pricing.suggestedPrice))}
          />
        </Card>
      </FormSection>
    </StandardModal>
  );
}
