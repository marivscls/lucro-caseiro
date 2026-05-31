import { formatCurrency } from "../../../shared/utils/format";
import type { Product, ProductComponentInput } from "@lucro-caseiro/contracts";
import {
  Card,
  Chip,
  IconButton,
  Input,
  Typography,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";

import { useProducts } from "../hooks";

/** Linha de componente em edicao (quantidade como string para o Input). */
export interface ComponentDraft {
  componentProductId: string;
  quantity: string;
}

interface ComponentPickerProps {
  readonly value: ComponentDraft[];
  readonly onChange: (next: ComponentDraft[]) => void;
  /** Id do produto sendo editado (para nao se listar como componente). */
  readonly excludeProductId?: string;
}

/** Converte os rascunhos em payload do contrato (quantidade > 0). */
export function draftsToComponents(drafts: ComponentDraft[]): ProductComponentInput[] {
  return drafts
    .map((d) => ({
      componentProductId: d.componentProductId,
      quantity: parseFloat(d.quantity.replace(",", ".")),
    }))
    .filter((c) => !isNaN(c.quantity) && c.quantity > 0);
}

/**
 * Seletor de componentes de um produto composto (kit/caixinha): escolhe entre
 * os produtos simples do usuario e define uma quantidade para cada. Mostra o
 * custo total do kit ao vivo (soma de custo x quantidade).
 */
export function ComponentPicker({
  value,
  onChange,
  excludeProductId,
}: ComponentPickerProps) {
  const { theme } = useTheme();
  const { data, isLoading } = useProducts();

  // Apenas produtos simples (sem kit dentro de kit) e diferentes do proprio produto.
  const available: Product[] = (data?.items ?? []).filter(
    (p) => !p.isComposite && p.id !== excludeProductId,
  );

  const selectedIds = new Set(value.map((c) => c.componentProductId));
  const productById = new Map(available.map((p) => [p.id, p]));

  function toggle(productId: string) {
    if (selectedIds.has(productId)) {
      onChange(value.filter((c) => c.componentProductId !== productId));
    } else {
      onChange([...value, { componentProductId: productId, quantity: "1" }]);
    }
  }

  function setQuantity(productId: string, quantity: string) {
    onChange(
      value.map((c) => (c.componentProductId === productId ? { ...c, quantity } : c)),
    );
  }

  // Custo total do kit ao vivo.
  const totalCost = value.reduce((sum, c) => {
    const product = productById.get(c.componentProductId);
    const qty = parseFloat(c.quantity.replace(",", "."));
    if (!product || isNaN(qty)) return sum;
    return sum + (product.costPrice ?? 0) * qty;
  }, 0);

  return (
    <View style={{ gap: spacing.md }}>
      <Typography variant="caption">Produtos que compõem o kit</Typography>

      {isLoading && <Typography variant="caption">Carregando produtos...</Typography>}

      {!isLoading && available.length === 0 && (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Cadastre produtos simples primeiro para montar um kit.
        </Typography>
      )}

      {!isLoading && available.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
        >
          {available.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={selectedIds.has(p.id)}
              onPress={() => toggle(p.id)}
            />
          ))}
        </ScrollView>
      )}

      {value.map((c) => {
        const product = productById.get(c.componentProductId);
        if (!product) return null;
        return (
          <View
            key={c.componentProductId}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="bodyBold">{product.name}</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {product.costPrice != null
                  ? `Custo: ${formatCurrency(product.costPrice)}`
                  : "Sem custo definido"}
              </Typography>
            </View>
            <View style={{ width: 90 }}>
              <Input
                label="Qtd"
                value={c.quantity}
                onChangeText={(t) => setQuantity(c.componentProductId, t)}
                keyboardType="decimal-pad"
              />
            </View>
            <IconButton
              accessibilityLabel={`Remover ${product.name} do kit`}
              onPress={() => toggle(c.componentProductId)}
              icon={
                <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
              }
            />
          </View>
        );
      })}

      <Card
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: radii.lg,
        }}
      >
        <Typography variant="bodyBold">Custo total do kit</Typography>
        <Typography variant="h3" color={theme.colors.success}>
          {formatCurrency(totalCost)}
        </Typography>
      </Card>
    </View>
  );
}
