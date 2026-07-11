import type { Material } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii, fonts } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showAlert } from "../../../shared/components/alert-store";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import {
  FieldLabel,
  TextFieldCard,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { MaterialIconField } from "./material-icon-field";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { formatCost } from "../domain";
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useUpdateMaterial,
} from "../hooks";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { duplicateKey } from "../../../shared/utils/duplicates";

interface MaterialFormProps {
  readonly material?: Material | null;
  readonly existingMaterials?: Material[];
  readonly onSuccess?: () => void;
}

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "un", "dz"];
const CONTENT_UNITS = ["ml", "l", "g", "kg", "un"];

function parseNum(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? undefined : n;
}

function SubLabel({ children }: Readonly<{ children: string }>) {
  const { theme } = useTheme();
  return (
    <Typography
      variant="caption"
      color={theme.colors.textSecondary}
      style={{ marginTop: spacing.xs }}
    >
      {children}
    </Typography>
  );
}

/** Cabeçalho de resumo do insumo em edição (avatar + nome + unidade + preço). */
function SummaryCard({
  name,
  unit,
  cost,
  icon,
}: Readonly<{ name: string; unit: string; cost: string; icon: string | null }>) {
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
      <IngredientAvatar name={name} emoji={icon} size={56} />
      <View style={{ flex: 1, gap: 6 }}>
        <Typography variant="h3" color={theme.colors.text} numberOfLines={1}>
          {name}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
              borderRadius: radii.full,
            }}
          >
            <Typography
              variant="bodyBold"
              color={theme.colors.textOnPrimary}
              style={{ fontSize: 14 }}
            >
              {unit}
            </Typography>
          </View>
          {hasPrice ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {formatCost(price, unit)}
            </Typography>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ContentUnitField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Escolher unidade do conteúdo"
        style={{
          minHeight: 60,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
      >
        <Typography
          variant="body"
          color={value ? theme.colors.text : pal.placeholder}
          style={{ flex: 1, fontSize: 16 }}
        >
          {value || "Ex: ml"}
        </Typography>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              backgroundColor: pal.sheetBg,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg + insets.bottom,
              gap: spacing.sm,
            }}
          >
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Unidade do conteúdo
            </Typography>
            {CONTENT_UNITS.map((u) => (
              <Pressable
                key={u}
                onPress={() => {
                  onChange(u);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: value === u ? theme.colors.primary : pal.border,
                  backgroundColor: pal.fieldBg,
                }}
              >
                <Typography variant="bodyBold" color={theme.colors.text}>
                  {u}
                </Typography>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function NotesField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const MAX = 200;
  return (
    <View
      style={{
        minHeight: 100,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        flexDirection: "row",
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
      <View style={{ flex: 1 }}>
        <TextInput
          value={value}
          onChangeText={(t) => onChange(t.slice(0, MAX))}
          placeholder="Ex: Informações importantes sobre o insumo..."
          placeholderTextColor={pal.placeholder}
          multiline
          maxLength={MAX}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: 16,
            textAlignVertical: "top",
            padding: 0,
            minHeight: 56,
          }}
        />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ alignSelf: "flex-end" }}
        >
          {value.length}/{MAX}
        </Typography>
      </View>
    </View>
  );
}

export function MaterialForm({
  material,
  existingMaterials = [],
  onSuccess,
}: MaterialFormProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const [name, setName] = useState(material?.name ?? "");
  const [unit, setUnit] = useState(material?.unit ?? "kg");
  const [stock, setStock] = useState(
    material ? String(material.stockQuantity).replace(".", ",") : "",
  );
  const [alertThreshold, setAlertThreshold] = useState(
    material?.stockAlertThreshold != null
      ? String(material.stockAlertThreshold).replace(".", ",")
      : "",
  );
  const [cost, setCost] = useState(
    material?.costPerUnit != null ? currencyInput(material.costPerUnit) : "",
  );
  const [contentPerUnit, setContentPerUnit] = useState(
    material?.contentPerUnit != null
      ? String(material.contentPerUnit).replace(".", ",")
      : "",
  );
  const [contentUnit, setContentUnit] = useState(material?.contentUnit ?? "");
  const [notes, setNotes] = useState(material?.notes ?? "");
  const [icon, setIcon] = useState<string | null>(material?.icon ?? null);
  const [supplierId, setSupplierId] = useState<string | null>(
    material?.supplierId ?? null,
  );

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const { data: matchingMaterials } = useMaterials({
    search: name.trim() || "__sem_nome__",
  });
  const isEditing = !!material;
  const saving = createMaterial.isPending || updateMaterial.isPending;

  // Inclui a unidade atual do insumo se ela não estiver entre as opções padrão.
  const unitOptions = UNIT_OPTIONS.includes(unit)
    ? UNIT_OPTIONS
    : [unit, ...UNIT_OPTIONS];

  function showContentInfo() {
    showAlert({
      title: "Conteúdo por unidade",
      message:
        "Diz quanto vem em 1 unidade do insumo (ex.: 1 lata = 350 ml). Assim dá para usar este insumo em g/ml nas receitas.",
    });
  }

  function showUnitInfo() {
    showAlert({
      title: "Unidade",
      message: "Selecione a unidade padrão deste insumo (ex.: kg, ml, un).",
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      alertValidation("Dê um nome ao insumo (ex.: Farinha de trigo).");
      return;
    }
    const contentValue = parseNum(contentPerUnit);
    const contentUnitTrimmed = contentUnit.trim();
    if ((contentValue != null) !== contentUnitTrimmed.length > 0) {
      showAlert({
        title: "Conteúdo por unidade",
        message:
          "Preencha a quantidade e a unidade do conteúdo (ex.: 350 e ml), ou deixe os dois em branco.",
      });
      return;
    }

    const normalizedName = duplicateKey(name);
    const normalizedUnit = duplicateKey(unit);
    const duplicateCandidates = [
      ...existingMaterials,
      ...(matchingMaterials?.items ?? []),
    ];
    const duplicate = duplicateCandidates.find(
      (item) =>
        item.id !== material?.id &&
        duplicateKey(item.name) === normalizedName &&
        duplicateKey(item.unit) === normalizedUnit,
    );
    if (duplicate) {
      showAlert({
        title: "Insumo já cadastrado",
        message:
          "Esse insumo já existe. Abra o cadastro existente para ajustar o estoque.",
      });
      return;
    }

    const data = {
      name: name.trim(),
      unit: unit.trim() || "un",
      stockQuantity: parseNum(stock) ?? 0,
      stockAlertThreshold: parseNum(alertThreshold),
      costPerUnit: cost.trim() ? parseCurrencyInput(cost) : undefined,
      contentPerUnit: contentValue ?? null,
      contentUnit: contentUnitTrimmed || null,
      notes: notes.trim() || undefined,
      icon,
      supplierId,
    };
    try {
      if (isEditing && material) {
        await updateMaterial.mutateAsync({ id: material.id, data });
      } else {
        await createMaterial.mutateAsync(data);
      }
      onSuccess?.();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alertError(e.message);
        return;
      }
      alertError("Não foi possível salvar o insumo. Tente novamente.");
    }
  }

  function handleDelete() {
    if (!material) return;
    showAlert({
      title: "Excluir insumo",
      message: "Tem certeza?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteMaterial.mutate(material.id, { onSuccess });
          },
        },
      ],
    });
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
        <SummaryCard name={name} unit={unit} cost={cost} icon={icon} />
      ) : (
        <>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ marginTop: -spacing.sm }}
          >
            Cadastre um novo insumo para controlar seu estoque e usar nas receitas.
          </Typography>
          <View>
            <FieldLabel label="Nome do insumo" required />
            <TextFieldCard
              icon="pricetag-outline"
              placeholder="Ex: Farinha de trigo"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </>
      )}

      <View>
        <FieldLabel label="Ícone (opcional)" />
        <MaterialIconField name={name} value={icon} onChange={setIcon} />
      </View>

      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginBottom: spacing.sm,
          }}
        >
          <Typography variant="bodyBold" color={theme.colors.text}>
            Unidade
          </Typography>
          {isEditing ? (
            <Pressable
              onPress={showUnitInfo}
              hitSlop={8}
              accessibilityLabel="Sobre a unidade"
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          ) : (
            <Typography variant="bodyBold" color={theme.colors.primary}>
              *
            </Typography>
          )}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {unitOptions.map((u) => {
            const active = unit === u;
            return (
              <Pressable
                key={u}
                onPress={() => setUnit(u)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={u}
                style={{
                  flex: 1,
                  minWidth: 48,
                  minHeight: 46,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : pal.border,
                  backgroundColor: active ? theme.colors.primary : pal.fieldBg,
                }}
              >
                <Typography
                  variant="bodyBold"
                  color={active ? theme.colors.textOnPrimary : theme.colors.text}
                >
                  {u}
                </Typography>
              </Pressable>
            );
          })}
        </View>
        {!isEditing ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: spacing.sm,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.success}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Selecione a unidade padrão deste insumo.
            </Typography>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Quantidade em estoque" />
          <TextFieldCard
            icon="cube-outline"
            placeholder="Ex: 10"
            value={stock}
            onChangeText={setStock}
            keyboardType="decimal-pad"
          />
          <SubLabel>Quantidade atual disponível.</SubLabel>
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel label="Alerta de estoque baixo (opcional)" />
          <TextFieldCard
            icon="notifications-outline"
            placeholder="Ex: 3"
            value={alertThreshold}
            onChangeText={setAlertThreshold}
            keyboardType="decimal-pad"
          />
          <SubLabel>Quando atingir, você será avisado.</SubLabel>
        </View>
      </View>

      <View>
        <FieldLabel label="Custo por unidade (opcional)" />
        <TextFieldCard
          icon="cash-outline"
          placeholder="Ex: 4,50"
          value={cost}
          onChangeText={(value) => setCost(maskCurrencyInput(value))}
          keyboardType="numeric"
        />
        <SubLabel>Valor gasto para adquirir 1 unidade.</SubLabel>
      </View>

      <View>
        <FieldLabel label="Fornecedor (opcional)" />
        <SupplierSelector value={supplierId} onChange={setSupplierId} />
        <SubLabel>De quem você compra este insumo.</SubLabel>
      </View>

      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: spacing.sm,
          }}
        >
          <Typography variant="bodyBold" color={theme.colors.text}>
            Conteúdo por unidade (opcional)
          </Typography>
          <Pressable
            onPress={showContentInfo}
            hitSlop={8}
            accessibilityLabel="O que é conteúdo por unidade"
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              color={theme.colors.text}
              style={{ fontSize: 14, marginBottom: spacing.xs }}
            >
              Quantidade
            </Typography>
            <TextFieldCard
              icon="beaker-outline"
              placeholder="Ex: 350"
              value={contentPerUnit}
              onChangeText={setContentPerUnit}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              color={theme.colors.text}
              style={{ fontSize: 14, marginBottom: spacing.xs }}
            >
              Unidade
            </Typography>
            <ContentUnitField value={contentUnit} onChange={setContentUnit} />
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: `${theme.colors.success}40`,
            backgroundColor: `${theme.colors.success}14`,
          }}
        >
          <Ionicons name="bulb-outline" size={20} color={theme.colors.success} />
          <View style={{ flex: 1 }}>
            <Typography
              variant="caption"
              color={theme.colors.success}
              style={{ fontFamily: fonts.bold }}
            >
              Ex.: 1 {unit.trim() || "kg"} = {contentPerUnit.trim() || "350"}{" "}
              {contentUnit.trim() || "ml"}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Permite usar este insumo em g/ml nas receitas.
            </Typography>
          </View>
        </View>
      </View>

      <View>
        <FieldLabel label="Observações (opcional)" />
        <NotesField value={notes} onChange={setNotes} />
      </View>

      <Pressable
        onPress={() => {
          void handleSave();
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
          <Ionicons
            name="checkmark-circle-outline"
            size={24}
            color={theme.colors.textOnPrimary}
          />
        )}
        <Typography
          variant="bodyBold"
          color={theme.colors.textOnPrimary}
          style={{ fontSize: 18 }}
        >
          {isEditing ? "Salvar alterações" : "Salvar insumo"}
        </Typography>
      </Pressable>

      {isEditing ? (
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 50,
            borderRadius: radii.lg,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Typography variant="bodyBold" color={theme.colors.alert}>
            Excluir insumo
          </Typography>
        </Pressable>
      ) : null}
    </KeyboardAwareScrollView>
  );
}
