import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import {
  FormField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  isPositiveCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { duplicateKey } from "../../../shared/utils/duplicates";
import {
  PACKAGING_TYPES,
  type PackagingTypeValue,
  displayPackagingName,
  typeLabel,
} from "../domain";
import { useCreatePackaging, usePackagingList, useUpdatePackaging } from "../hooks";
import { PackagingAvatar } from "./packaging-avatar";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { useBusinessCopy } from "../../subscription/business-copy";

interface PackagingFormProps {
  readonly packaging?: Packaging | null;
  readonly existingPackaging?: Packaging[];
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
  /** Mostra "Excluir embalagem" no fim do formulário (a tela confirma). */
  readonly onDelete?: () => void;
}

/** Cabeçalho de resumo (avatar + nome + tipo + custo) exibido na edição. */
function SummaryHero({
  name,
  type,
  cost,
  photoUrl,
}: Readonly<{
  name: string;
  type: string;
  cost: string;
  photoUrl?: string | null;
  /** Lido pelo `FormGrid`: o resumo ocupa a linha inteira. */
  span?: "full";
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const price = cost.trim() ? parseCurrencyInput(cost) : NaN;
  const hasPrice = !isNaN(price) && price > 0;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderRadius: fieldMetrics.radius,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        padding: spacing.md,
      }}
    >
      <PackagingAvatar
        name={name || "Embalagem"}
        type={type}
        photoUrl={photoUrl}
        size={40}
      />
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={2}>
          {name || "Embalagem"}
        </Typography>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: spacing.xs,
          }}
        >
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {typeLabel(type)}
          </Typography>
          {hasPrice ? (
            <>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                ·
              </Typography>
              <AppIcon name="cash-outline" size={14} color={theme.colors.success} />
              <Typography variant="caption" color={theme.colors.success}>
                {formatCurrency(price)} por unidade
              </Typography>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/**
 * Tipo da embalagem: escolha única com mais de 4 opções, em fichas no mesmo
 * visual das categorias do produto.
 */
function TypeChips({
  value,
  onChange,
}: Readonly<{
  value: PackagingTypeValue;
  onChange: (value: PackagingTypeValue) => void;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Tipo de embalagem"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
    >
      {PACKAGING_TYPES.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.full,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primaryStrong : pal.border,
              backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Typography
              variant={selected ? "bodyBold" : "body"}
              color={selected ? theme.colors.primaryStrong : theme.colors.text}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PackagingForm({
  packaging,
  existingPackaging = [],
  visible,
  onClose,
  onSuccess,
  onCancel,
  onDelete,
}: PackagingFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const isEditing = !!packaging;

  const [name, setName] = useState(packaging ? displayPackagingName(packaging.name) : "");
  const [type, setType] = useState<PackagingTypeValue>(
    (packaging?.type as PackagingTypeValue) ?? "box",
  );
  const [unitCost, setUnitCost] = useState(
    packaging?.unitCost != null ? currencyInput(packaging.unitCost) : "",
  );
  const [supplierId, setSupplierId] = useState<string | null>(
    packaging?.supplierId ?? null,
  );

  const createPackaging = useCreatePackaging();
  const updatePackaging = useUpdatePackaging();
  const { data: matchingPackaging, refetch: refetchMatchingPackaging } = usePackagingList(
    {
      search: name.trim() || "__sem_nome__",
    },
  );
  const { checkAndBlock: checkPackagingLimit } = useLimitCheck("packaging");
  const showPaywall = usePaywall((s) => s.show);
  const saving = createPackaging.isPending || updatePackaging.isPending;

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome da embalagem.",
      unitCost: !isPositiveCurrency(unitCost) && "Informe um custo maior que zero.",
    },
    visible,
  );

  async function handleSave() {
    if (!formValidation.validate()) return;
    if (!isEditing && checkPackagingLimit()) return;
    const cost = parseCurrencyInput(unitCost);
    const refreshedPackaging = await refetchMatchingPackaging();
    const duplicateCandidates = [
      ...existingPackaging,
      ...(refreshedPackaging.data?.items ?? matchingPackaging?.items ?? []),
    ];
    const duplicate = duplicateCandidates.find(
      (item) =>
        item.id !== packaging?.id &&
        duplicateKey(displayPackagingName(item.name)) === duplicateKey(name) &&
        item.type === type,
    );
    if (duplicate) {
      alertValidation("Já existe um cadastro com esse nome e tipo.");
      return;
    }

    const data = {
      name: name.trim(),
      type,
      unitCost: cost,
      supplierId,
    };
    try {
      if (isEditing && packaging) {
        await updatePackaging.mutateAsync({ id: packaging.id, data });
      } else {
        await createPackaging.mutateAsync(data);
      }
      onSuccess?.();
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("packaging");
        return;
      }
      const msg = e instanceof Error ? e.message : "Tente novamente.";
      alertError(msg);
    }
  }

  return (
    <StandardModal
      title={isEditing ? "Editar embalagem" : "Nova embalagem"}
      subtitle={
        isEditing ? undefined : "Cadastre uma embalagem para usar nos seus produtos."
      }
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          <Button
            title="Cancelar"
            variant="outline"
            disabled={saving}
            onPress={() => (onCancel ?? onClose)()}
          />
          <Button
            title={isEditing ? "Salvar alterações" : "Cadastrar embalagem"}
            onPress={() => {
              if (!saving) void handleSave();
            }}
            loading={saving}
          />
        </FormActions>
      }
    >
      <FormBody>
        <FormGrid>
          {isEditing ? (
            <SummaryHero
              span="full"
              name={name}
              type={type}
              cost={unitCost}
              photoUrl={packaging?.photoUrl}
            />
          ) : null}
          <FormField span="full" label="Nome" validation={formValidation.field("name")}>
            <TextField
              icon="pricetag-outline"
              accessibilityLabel="Nome da embalagem"
              placeholder={
                experienceCopy.profile === "food"
                  ? "Ex.: Caixa kraft P"
                  : "Ex.: Caixa para envio"
              }
              value={name}
              onChangeText={setName}
              autoFocus={!isEditing}
            />
          </FormField>
          <FormField span="full" label="Tipo de embalagem">
            <TypeChips value={type} onChange={setType} />
          </FormField>
          <FormField
            label="Custo por unidade"
            validation={formValidation.field("unitCost")}
          >
            <TextField
              prefix="R$"
              accessibilityLabel="Custo por unidade, em reais"
              placeholder="0,00"
              value={unitCost}
              onChangeText={(v: string) => setUnitCost(maskCurrencyInput(v))}
              keyboardType="numeric"
            />
          </FormField>
          <FormField label="Fornecedor" optional>
            <SupplierSelector value={supplierId} onChange={setSupplierId} />
          </FormField>
        </FormGrid>

        {onDelete ? (
          <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
            <Button
              title="Excluir embalagem"
              variant="alertOutline"
              icon={<AppIcon name="trash-outline" size={18} color={theme.colors.alert} />}
              onPress={onDelete}
              disabled={saving}
            />
          </View>
        ) : null}
      </FormBody>
    </StandardModal>
  );
}
