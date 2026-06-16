import type { SaleUnit } from "@lucro-caseiro/contracts";
import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadProductImage } from "../../../shared/utils/upload-image";
import { useCreateProduct, useProducts } from "../hooks";
import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "./component-picker";
import { validateProductDraft } from "../kit";
import { CompositeToggle } from "./composite-toggle";
import { SaleUnitToggle } from "./sale-unit-toggle";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import {
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

interface CreateProductFormProps {
  readonly onSuccess?: () => void;
}

/** Cores derivadas do tema para os campos (funciona em claro e escuro). */
function useFieldPalette() {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  return {
    border: isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)",
    fieldBg: isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface,
    placeholder: isDark ? "rgba(184, 160, 144, 0.7)" : "rgba(139, 115, 85, 0.7)",
    sheetBg: isDark ? "#2C2420" : theme.colors.surfaceElevated,
  };
}

function FieldLabel({
  label,
  required,
}: Readonly<{ label: string; required?: boolean }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4, marginBottom: spacing.sm }}>
      <Typography variant="bodyBold" color={theme.colors.text} style={{ fontSize: 15 }}>
        {label}
      </Typography>
      {required ? (
        <Typography
          variant="bodyBold"
          color={theme.colors.primary}
          style={{ fontSize: 15 }}
        >
          *
        </Typography>
      ) : null}
    </View>
  );
}

type TextFieldCardProps = Readonly<{ icon: keyof typeof Ionicons.glyphMap }> &
  TextInputProps;

function TextFieldCard({ icon, ...inputProps }: TextFieldCardProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
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
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <TextInput
        placeholderTextColor={pal.placeholder}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 16,
          paddingVertical: spacing.md,
        }}
        {...inputProps}
      />
    </View>
  );
}

function CategoryField({
  value,
  onChange,
  categories,
}: Readonly<{ value: string; onChange: (v: string) => void; categories: string[] }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function confirm(category: string) {
    onChange(category.trim());
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Escolher categoria"
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
        <Ionicons name="grid-outline" size={22} color={theme.colors.primary} />
        <Typography
          variant="body"
          color={value ? theme.colors.text : pal.placeholder}
          numberOfLines={1}
          style={{ flex: 1, fontSize: 16 }}
        >
          {value || "Ex: Doces, Salgados, Bolos..."}
        </Typography>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                maxHeight: "80%",
                gap: spacing.md,
              }}
            >
              <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
                Categoria
              </Typography>

              <View
                style={{
                  minHeight: 56,
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
                <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Digite uma categoria nova"
                  placeholderTextColor={pal.placeholder}
                  autoFocus
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: 16,
                    paddingVertical: spacing.md,
                  }}
                />
              </View>

              {categories.length > 0 ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 220 }}
                >
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
                  >
                    {categories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => confirm(cat)}
                        accessibilityRole="button"
                        style={{
                          minHeight: 40,
                          paddingHorizontal: spacing.md,
                          justifyContent: "center",
                          borderRadius: radii.full,
                          borderWidth: 1,
                          borderColor: pal.border,
                          backgroundColor: pal.fieldBg,
                        }}
                      >
                        <Typography variant="body" color={theme.colors.text}>
                          {cat}
                        </Typography>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}

              <Pressable
                onPress={() => confirm(draft)}
                disabled={!draft.trim()}
                accessibilityRole="button"
                style={({ pressed }) => {
                  let opacity = 1;
                  if (!draft.trim()) opacity = 0.5;
                  else if (pressed) opacity = 0.85;
                  return {
                    minHeight: 52,
                    borderRadius: radii.lg,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity,
                  };
                }}
              >
                <Typography
                  variant="bodyBold"
                  color={theme.colors.textOnPrimary}
                  style={{ fontSize: 16 }}
                >
                  Usar categoria
                </Typography>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function PhotoField({
  imageUri,
  onPress,
}: Readonly<{ imageUri: string | null; onPress: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();

  return (
    <View>
      <FieldLabel label="Foto do produto" />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ marginTop: -spacing.xs, marginBottom: spacing.sm }}
      >
        Uma boa foto aumenta suas vendas!
      </Typography>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Adicionar foto"
        style={{
          borderRadius: radii.lg,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          overflow: "hidden",
          minHeight: 96,
          justifyContent: "center",
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 160 }} />
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.md,
                backgroundColor: `${theme.colors.primary}22`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="camera-outline" size={28} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography
                variant="bodyBold"
                color={theme.colors.text}
                style={{ fontSize: 15 }}
              >
                Adicionar foto
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                PNG, JPG até 5MB
              </Typography>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function DescriptionField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const MAX = 300;

  return (
    <View>
      <FieldLabel label="Descrição (opcional)" />
      <View
        style={{
          minHeight: 120,
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
            placeholder="Fale um pouco sobre o produto, ingredientes, diferenciais..."
            placeholderTextColor={pal.placeholder}
            multiline
            maxLength={MAX}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 16,
              textAlignVertical: "top",
              padding: 0,
              minHeight: 72,
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
    </View>
  );
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const createProduct = useCreateProduct();
  const { data: productsData } = useProducts();

  const categories = useMemo(() => {
    const set = new Set(
      (productsData?.items ?? []).map((p) => p.category).filter((c): c is string => !!c),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [productsData]);

  const isKg = saleUnit === "kg" && !isComposite;

  async function handleSubmit() {
    const price = parseCurrencyInput(salePrice);

    const validationError = validateProductDraft({
      name,
      category,
      price,
      isComposite,
      components,
    });
    if (validationError) {
      alertValidation(validationError);
      return;
    }

    const componentsPayload = isComposite ? draftsToComponents(components) : undefined;

    // Sobe a foto (se houver) e usa a URL pública. Se falhar, salva sem a foto.
    let photoUrl: string | undefined;
    if (imageUri) {
      try {
        setUploading(true);
        photoUrl = await uploadProductImage(imageUri);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message:
            "Não consegui enviar a foto agora. Vou salvar o produto sem ela — você pode adicionar depois.",
        });
      } finally {
        setUploading(false);
      }
    }

    try {
      await createProduct.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        salePrice: price,
        saleUnit,
        description: description.trim() || undefined,
        photoUrl,
        // Estoque por unidades nao se aplica a venda por peso (kg).
        stockQuantity:
          saleUnit === "kg" || !stockQuantity ? undefined : parseInt(stockQuantity, 10),
        stockAlertThreshold:
          saleUnit === "kg" || !stockAlert ? undefined : parseInt(stockAlert, 10),
        isComposite,
        components: componentsPayload,
      });
      showAlert({
        title: "Produto cadastrado!",
        message: `${name} foi adicionado ao seu catálogo`,
      });
      onSuccess?.();
    } catch {
      alertError("Não foi possível cadastrar o produto. Tente novamente.");
    }
  }

  const loading = createProduct.isPending || uploading;

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["5xl"],
        gap: spacing.xl,
      }}
    >
      <View>
        <FieldLabel label="Nome do produto" required />
        <TextFieldCard
          icon="pricetag-outline"
          placeholder="Ex: Brigadeiro, Bolo de chocolate..."
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View>
        <FieldLabel label="Categoria" required />
        <CategoryField value={category} onChange={setCategory} categories={categories} />
      </View>

      <CompositeToggle value={isComposite} onChange={setIsComposite} />

      {isComposite && <ComponentPicker value={components} onChange={setComponents} />}

      {/* Venda por peso (kg) so faz sentido para produto simples. */}
      {!isComposite && <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />}

      <View>
        <FieldLabel label={isKg ? "Preço por kg (R$)" : "Preço de venda (R$)"} required />
        <TextFieldCard
          icon="cash-outline"
          placeholder={isKg ? "Ex: 80,00" : "Ex: 3,50"}
          value={salePrice}
          onChangeText={(value) => setSalePrice(maskCurrencyInput(value))}
          keyboardType="numeric"
        />
      </View>

      <PhotoField imageUri={imageUri} onPress={showPicker} />

      <DescriptionField value={description} onChange={setDescription} />

      {saleUnit === "unit" && !isComposite && (
        <>
          <View>
            <FieldLabel label="Quantidade em estoque (opcional)" />
            <TextFieldCard
              icon="albums-outline"
              placeholder="Ex: 50"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="number-pad"
            />
          </View>

          <View>
            <FieldLabel label="Alerta de estoque baixo (opcional)" />
            <TextFieldCard
              icon="notifications-outline"
              placeholder="Ex: 10"
              value={stockAlert}
              onChangeText={setStockAlert}
              keyboardType="number-pad"
            />
          </View>
        </>
      )}

      <Pressable
        onPress={() => {
          void handleSubmit();
        }}
        disabled={loading}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 58,
          borderRadius: radii.lg,
          backgroundColor: theme.colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed || loading ? 0.85 : 1,
        })}
      >
        {loading ? (
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
          {uploading ? "Enviando foto..." : "Cadastrar produto"}
        </Typography>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
