import { formatCurrency } from "../../../shared/utils/format";
import type { Product } from "@lucro-caseiro/contracts";
import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { chipLabel, draftsToComponents, kitTotalCost, type ComponentDraft } from "../kit";
import { showAlert } from "../../../shared/components/alert-store";
import { useProducts } from "../hooks";

export { draftsToComponents };
export type { ComponentDraft };

interface ComponentPickerProps {
  readonly value: ComponentDraft[];
  readonly onChange: (next: ComponentDraft[]) => void;
  /** Id do produto sendo editado (para nao se listar como componente). */
  readonly excludeProductId?: string;
}

/**
 * Seletor de componentes de um produto composto (kit/caixinha): escolhe entre
 * os produtos simples do usuario e define uma quantidade para cada. Mostra os
 * itens como chips removiveis + o custo total do kit ao vivo.
 */
export function ComponentPicker({
  value,
  onChange,
  excludeProductId,
}: ComponentPickerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useProducts();
  const [pickerOpen, setPickerOpen] = useState(false);

  const isDark = theme.mode === "dark";
  const border = isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)";
  const fieldBg = isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface;
  const sheetBg = isDark ? "#2C2420" : theme.colors.surfaceElevated;

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

  function changeQuantity(productId: string, delta: number) {
    onChange(
      value.map((c) => {
        if (c.componentProductId !== productId) return c;
        const current = parseInt(c.quantity, 10);
        const next = Math.max(1, (isNaN(current) ? 1 : current) + delta);
        return { ...c, quantity: String(next) };
      }),
    );
  }

  function showInfo() {
    showAlert({
      title: "Produto composto (kit)",
      message:
        "Um kit é montado a partir de outros produtos que você já cadastrou. O custo total do kit é a soma do custo de cada item.",
    });
  }

  // Custo total do kit ao vivo.
  const totalCost = kitTotalCost(value, (id) => productById.get(id)?.costPrice);

  const visibleChips = value.slice(0, 2);
  const overflow = value.length - visibleChips.length;

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Produtos que compõem o kit
          </Typography>
          <Pressable onPress={showInfo} hitSlop={8} accessibilityLabel="O que é um kit">
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar produto ao kit"
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
        >
          <Typography variant="bodyBold" color={theme.colors.primary}>
            Adicionar produto
          </Typography>
          <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View
        style={{
          minHeight: 56,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: fieldBg,
          padding: spacing.md,
          justifyContent: "center",
        }}
      >
        {value.length === 0 ? (
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {available.length === 0
              ? "Cadastre produtos simples primeiro para montar um kit."
              : 'Toque em "Adicionar produto" para escolher os itens.'}
          </Typography>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            {visibleChips.map((c) => {
              const product = productById.get(c.componentProductId);
              const name = product?.name ?? "Produto";
              return (
                <View
                  key={c.componentProductId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                    paddingLeft: spacing.md,
                    paddingRight: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: border,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : theme.colors.surface,
                    flexShrink: 1,
                  }}
                >
                  <Typography
                    variant="body"
                    color={theme.colors.text}
                    numberOfLines={1}
                    style={{ flexShrink: 1 }}
                  >
                    {chipLabel(name, c.quantity)}
                  </Typography>
                  <Pressable
                    onPress={() => toggle(c.componentProductId)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${name} do kit`}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={theme.colors.primary} />
                  </Pressable>
                </View>
              );
            })}
            {overflow > 0 ? (
              <Pressable
                onPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`Ver mais ${overflow} produtos do kit`}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                  +{overflow}
                </Typography>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: fieldBg,
          padding: spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: `${theme.colors.primary}22`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="calculator-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Custo total do kit
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Soma dos produtos selecionados
          </Typography>
        </View>
        <Typography variant="h3" color={theme.colors.success}>
          {formatCurrency(totalCost)}
        </Typography>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          onPress={() => setPickerOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              backgroundColor: sheetBg,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg + insets.bottom,
              maxHeight: "80%",
              gap: spacing.sm,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Typography variant="h3" color={theme.colors.text}>
                Adicionar ao kit
              </Typography>
              <Pressable
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                hitSlop={10}
              >
                <Ionicons name="close" size={26} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {isLoading ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Carregando produtos...
              </Typography>
            ) : null}

            {!isLoading && available.length === 0 ? (
              <Typography variant="body" color={theme.colors.textSecondary}>
                Cadastre produtos simples primeiro para montar um kit.
              </Typography>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: spacing.sm }}>
                {available.map((p) => {
                  const draft = value.find((c) => c.componentProductId === p.id);
                  const selected = Boolean(draft);
                  return (
                    <View
                      key={p.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: selected ? theme.colors.primary : border,
                        backgroundColor: fieldBg,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        minHeight: 60,
                      }}
                    >
                      <Pressable
                        onPress={() => toggle(p.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={p.name}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                        }}
                      >
                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={24}
                          color={
                            selected ? theme.colors.primary : theme.colors.textSecondary
                          }
                        />
                        <View style={{ flex: 1 }}>
                          <Typography
                            variant="bodyBold"
                            color={theme.colors.text}
                            numberOfLines={1}
                          >
                            {p.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={theme.colors.textSecondary}
                          >
                            {p.costPrice != null
                              ? `Custo: ${formatCurrency(p.costPrice)}`
                              : "Sem custo definido"}
                          </Typography>
                        </View>
                      </Pressable>

                      {selected ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.sm,
                          }}
                        >
                          <Pressable
                            onPress={() => changeQuantity(p.id, -1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Diminuir quantidade de ${p.name}`}
                            hitSlop={6}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: radii.full,
                              borderWidth: 1,
                              borderColor: border,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="remove" size={20} color={theme.colors.text} />
                          </Pressable>
                          <Typography
                            variant="bodyBold"
                            color={theme.colors.text}
                            style={{ minWidth: 20, textAlign: "center" }}
                          >
                            {draft?.quantity ?? "1"}
                          </Typography>
                          <Pressable
                            onPress={() => changeQuantity(p.id, 1)}
                            accessibilityRole="button"
                            accessibilityLabel={`Aumentar quantidade de ${p.name}`}
                            hitSlop={6}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: radii.full,
                              borderWidth: 1,
                              borderColor: theme.colors.primary,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="add" size={20} color={theme.colors.primary} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setPickerOpen(false)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radii.lg,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginTop: spacing.xs,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                Concluir
              </Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
