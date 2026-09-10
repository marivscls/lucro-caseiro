import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import {
  CenteredTextInput,
  Button,
  Typography,
  useTheme,
  spacing,
  radii,
  fonts,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import {
  FieldLabel,
  TextFieldCard,
  useFieldPalette,
} from "../../../shared/components/form-field";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
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
  readonly headerRight?: React.ReactNode;
}

/** Cabeçalho de resumo (avatar + nome + tipo + custo) exibido na edição. */
function SummaryHero({
  name,
  type,
  cost,
  photoUrl,
}: Readonly<{ name: string; type: string; cost: string; photoUrl?: string | null }>) {
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
        borderRadius: radii.lg,
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
        size={52}
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

/** Cabeçalho de seção: ícone rosa contornado + título. */
function SectionHeader({ icon, title }: Readonly<{ icon: AppIconName; title: string }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <AppIcon name={icon} size={20} color={theme.colors.primary} />
      <Typography variant="bodyBold" color={theme.colors.text}>
        {title}
      </Typography>
    </View>
  );
}

/** Campo com círculo de ícone à esquerda + label pequeno + input grande (estilo "stat"). */
function IconInputCard({
  icon,
  iconColor,
  label,
  ...inputProps
}: Readonly<{
  icon: AppIconName;
  iconColor: string;
  label: string;
}> &
  React.ComponentProps<typeof TextInput>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.full,
          borderWidth: 1.5,
          borderColor: `${iconColor}80`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          {label}
        </Typography>
        <CenteredTextInput
          placeholderTextColor={pal.placeholder}
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: fonts.bold,
            padding: 0,
          }}
          {...inputProps}
        />
      </View>
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
  headerRight,
}: PackagingFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const pal = useFieldPalette();
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
      unitCost:
        (!Number.isFinite(parseCurrencyInput(unitCost)) ||
          parseCurrencyInput(unitCost) <= 0) &&
        "Informe um custo maior que zero.",
    },
    visible,
  );

  async function handleSave() {
    if (!formValidation.validate()) return;
    if (!isEditing && checkPackagingLimit()) return;
    if (!name.trim()) {
      alertValidation("Coloque o nome da embalagem");
      return;
    }
    const cost = parseCurrencyInput(unitCost);
    if (isNaN(cost) || cost <= 0) {
      alertValidation("O custo precisa ser maior que zero");
      return;
    }
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
      visible={visible}
      onClose={onClose}
      right={headerRight}
      footer={
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            justifyContent: isDesktop ? "flex-end" : undefined,
            width: "100%",
          }}
        >
          <Pressable
            onPress={() => (onCancel ?? onClose)()}
            accessibilityRole="button"
            style={({ pressed }) => [
              {
                minHeight: 48,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: pal.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              },
              isDesktop ? desktopAction(isDesktop, 160) : { flex: 1 },
            ]}
          >
            <Typography variant="bodyBold" color={theme.colors.text}>
              Cancelar
            </Typography>
          </Pressable>
          <Button
            title={isEditing ? "Salvar" : "Cadastrar"}
            size="lg"
            compact
            icon={
              <AppIcon name="save-outline" size={22} color={theme.colors.textOnPrimary} />
            }
            onPress={() => {
              if (!saving) void handleSave();
            }}
            disabled={saving}
            loading={saving}
            style={isDesktop ? desktopAction(isDesktop, 220) : { flex: 1 }}
          />
        </View>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.xl }}>
        {isEditing ? (
          <SummaryHero
            name={name}
            type={type}
            cost={unitCost}
            photoUrl={packaging?.photoUrl}
          />
        ) : (
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ marginTop: -spacing.sm }}
          >
            Cadastre uma embalagem que será utilizada nos seus produtos.
          </Typography>
        )}

        <View style={{ gap: spacing.md }}>
          <View>
            <FieldLabel label="Nome" required />
            <ValidationField {...formValidation.field("name")}>
              <TextFieldCard
                icon="pricetag-outline"
                placeholder={
                  experienceCopy.profile === "food"
                    ? "Ex: Caixa kraft P, Sacola transparente..."
                    : "Ex: Caixa para envio, sacola, acabamento..."
                }
                value={name}
                onChangeText={setName}
                autoFocus={!isEditing}
              />
            </ValidationField>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader icon="albums-outline" title="Tipo de embalagem" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PACKAGING_TYPES.map((t) => {
              const active = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t.label}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.xs,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: active ? theme.colors.primary : pal.border,
                    backgroundColor: active ? theme.colors.primaryBg : pal.fieldBg,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  {active ? (
                    <AppIcon name="checkmark" size={16} color={theme.colors.primary} />
                  ) : null}
                  <Typography
                    variant="bodyBold"
                    color={active ? theme.colors.text : theme.colors.textSecondary}
                  >
                    {t.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader icon="cash-outline" title="Custo" />
          <View style={isDesktop ? desktopCompactField(isDesktop) : undefined}>
            <ValidationField {...formValidation.field("unitCost")}>
              <IconInputCard
                icon="cash-outline"
                iconColor={theme.colors.success}
                label="Quanto custa uma unidade?"
                placeholder="0,00"
                value={unitCost}
                onChangeText={(v: string) => setUnitCost(maskCurrencyInput(v))}
                keyboardType="numeric"
              />
            </ValidationField>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader icon="business-outline" title="Fornecedor (opcional)" />
          <SupplierSelector value={supplierId} onChange={setSupplierId} />
        </View>
      </View>
    </StandardModal>
  );
}
