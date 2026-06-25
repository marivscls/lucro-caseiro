import { formatCurrency } from "../../../shared/utils/format";
import type { Packaging } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import {
  FieldLabel,
  TextFieldCard,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import {
  PACKAGING_TYPES,
  type PackagingTypeValue,
  typeColor,
  typeLabel,
} from "../domain";
import { useCreatePackaging, useUpdatePackaging } from "../hooks";
import { PackagingAvatar } from "./packaging-avatar";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";

interface PackagingFormProps {
  readonly packaging?: Packaging | null;
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
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
  const tColor = typeColor(theme, type);
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
        size={64}
      />
      <View style={{ flex: 1, gap: 6 }}>
        <Typography
          variant="h3"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ fontSize: 20, fontWeight: "800" }}
        >
          {name || "Embalagem"}
        </Typography>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: `${tColor}26`,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: radii.full,
          }}
        >
          <Typography variant="caption" color={tColor} style={{ fontWeight: "700" }}>
            Tipo: {typeLabel(type)}
          </Typography>
        </View>
        {hasPrice ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.success} />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo unitário
            </Typography>
            <Typography variant="bodyBold" color={theme.colors.success}>
              {formatCurrency(price)}
            </Typography>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Cabeçalho de seção: ícone rosa contornado + título. */
function SectionHeader({
  icon,
  title,
}: Readonly<{ icon: keyof typeof Ionicons.glyphMap; title: string }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Typography variant="bodyBold" color={theme.colors.text} style={{ fontSize: 16 }}>
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
  icon: keyof typeof Ionicons.glyphMap;
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
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          {label}
        </Typography>
        <TextInput
          placeholderTextColor={pal.placeholder}
          style={{
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: "700",
            padding: 0,
          }}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const COMPOSITION_BAR = ["#E0A84E", "#7FB3D5", "#B8A9D4", "#C4707E"];

export function PackagingForm({ packaging, onSuccess, onCancel }: PackagingFormProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const isEditing = !!packaging;

  const [name, setName] = useState(packaging?.name ?? "");
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
  const { checkAndBlock: checkPackagingLimit } = useLimitCheck("packaging");
  const showPaywall = usePaywall((s) => s.show);
  const saving = createPackaging.isPending || updatePackaging.isPending;

  const costPreview = unitCost.trim() ? parseCurrencyInput(unitCost) : NaN;
  const hasCost = !isNaN(costPreview) && costPreview > 0;

  async function handleSave() {
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
    <KeyboardAwareScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["5xl"],
        gap: spacing.xl,
      }}
    >
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

      {/* Dados da embalagem */}
      <View style={{ gap: spacing.md }}>
        <SectionHeader icon="document-text-outline" title="Dados da embalagem" />
        <View>
          <FieldLabel label="Nome" required />
          <TextFieldCard
            icon="pricetag-outline"
            placeholder="Ex: Caixa kraft P, Sacola transparente..."
            value={name}
            onChangeText={setName}
            autoFocus={!isEditing}
          />
        </View>
      </View>

      {/* Tipo de embalagem */}
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
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm + 2,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : pal.border,
                  backgroundColor: active ? `${theme.colors.primary}1f` : pal.fieldBg,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Typography
                  variant="bodyBold"
                  color={active ? theme.colors.text : theme.colors.textSecondary}
                  style={{ fontSize: 15 }}
                >
                  {t.label}
                </Typography>
                {active ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={theme.colors.textOnPrimary}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Custo */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <IconInputCard
          icon="cash-outline"
          iconColor={theme.colors.success}
          label="Custo unitário (R$)"
          placeholder="0,00"
          value={unitCost}
          onChangeText={(v: string) => setUnitCost(maskCurrencyInput(v))}
          keyboardType="numeric"
        />
      </View>

      {/* Fornecedor */}
      <View style={{ gap: spacing.md }}>
        <SectionHeader icon="business-outline" title="Fornecedor (opcional)" />
        <SupplierSelector value={supplierId} onChange={setSupplierId} />
      </View>

      {/* Pré-visualização do custo */}
      <View style={{ gap: spacing.md }}>
        <SectionHeader icon="bar-chart-outline" title="Pré-visualização do custo" />
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: pal.border,
            backgroundColor: pal.fieldBg,
            padding: spacing.md,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.full,
              borderWidth: 1.5,
              borderColor: `${theme.colors.primary}80`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="bar-chart-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Impacto no custo total
            </Typography>
            <Typography
              variant="bodyBold"
              color={theme.colors.success}
              style={{ fontSize: 18 }}
            >
              {hasCost ? `+ ${formatCurrency(costPreview)}` : "+ R$ 0,00"}
            </Typography>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Composição atual
            </Typography>
            <View
              style={{
                flexDirection: "row",
                height: 12,
                borderRadius: radii.full,
                overflow: "hidden",
              }}
            >
              {COMPOSITION_BAR.map((c) => (
                <View key={c} style={{ flex: 1, backgroundColor: c }} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Ações */}
      <View style={{ gap: spacing.md }}>
        <Pressable
          onPress={() => {
            if (!saving) void handleSave();
          }}
          disabled={saving}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 58,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed || saving ? 0.85 : 1,
          })}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Ionicons name="save-outline" size={22} color={theme.colors.textOnPrimary} />
          )}
          <Typography
            variant="bodyBold"
            color={theme.colors.textOnPrimary}
            style={{ fontSize: 18 }}
          >
            {isEditing ? "Salvar" : "Cadastrar embalagem"}
          </Typography>
        </Pressable>
        <Pressable
          onPress={() => onCancel?.()}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: pal.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            style={{ fontSize: 16 }}
          >
            Cancelar
          </Typography>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}
