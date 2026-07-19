import type { ProductVariationInput } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Pressable, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";

export function VariationEditor({
  value,
  onChange,
}: Readonly<{
  value: ProductVariationInput[];
  onChange: (next: ProductVariationInput[]) => void;
}>) {
  const { theme } = useTheme();

  function update(index: number, patch: Partial<ProductVariationInput>) {
    onChange(
      value.map((variation, i) => (i === index ? { ...variation, ...patch } : variation)),
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Typography variant="label">VARIAÇÕES (OPCIONAL)</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Use uma linha por cor, tamanho ou modelo. Cada variação controla seu estoque.
        </Typography>
      </View>

      {value.map((variation, index) => (
        <View
          key={variation.id ?? `nova-${index}`}
          style={{
            gap: spacing.sm,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography variant="bodyBold" style={{ flex: 1 }}>
              Variação {index + 1}
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remover variação ${index + 1}`}
              onPress={() => onChange(value.filter((_, i) => i !== index))}
              hitSlop={8}
            >
              <AppIcon name="trash-outline" size={20} color={theme.colors.alert} />
            </Pressable>
          </View>
          <Input
            label="Nome"
            placeholder="Ex: Azul / A4"
            value={variation.name}
            onChangeText={(name) => update(index, { name })}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Cor (opcional)"
                placeholder="Azul"
                value={variation.color ?? ""}
                onChangeText={(color) => update(index, { color: color || undefined })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Tamanho/modelo"
                placeholder="A4"
                value={variation.size ?? ""}
                onChangeText={(size) => update(index, { size: size || undefined })}
              />
            </View>
          </View>
          <Input
            label="Estoque"
            placeholder="0"
            keyboardType="number-pad"
            value={
              variation.stockQuantity === undefined ? "" : String(variation.stockQuantity)
            }
            onChangeText={(stock) =>
              update(index, {
                stockQuantity: stock.trim() === "" ? undefined : Number(stock),
              })
            }
          />
        </View>
      ))}

      <Button
        title="Adicionar variação"
        variant="secondary"
        onPress={() => onChange([...value, { name: "", stockQuantity: 0 }])}
      />
    </View>
  );
}
