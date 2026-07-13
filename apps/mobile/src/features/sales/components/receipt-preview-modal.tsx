import type { Sale } from "@lucro-caseiro/contracts";
import { Button, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { receiptNumber } from "../receipt-pdf";

interface ReceiptPreviewModalProps {
  readonly visible: boolean;
  readonly sale: Sale;
  readonly businessName: string;
  readonly onUpgrade: () => void;
  readonly onClose: () => void;
}

/**
 * Vislumbre do recibo em PDF para usuarias free: mostra o recibo real da venda
 * em miniatura, com um cadeado por cima e CTA de upgrade. Ver o que se perde
 * converte mais que um paywall seco.
 */
export function ReceiptPreviewModal({
  visible,
  sale,
  businessName,
  onUpgrade,
  onClose,
}: ReceiptPreviewModalProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: radii["2xl"],
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Typography variant="h3" style={{ textAlign: "center" }}>
            Seu recibo profissional
          </Typography>

          {/* Miniatura do recibo (dados reais da venda) */}
          <View>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.sm,
                opacity: 0.55,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderBottomWidth: 2,
                  borderBottomColor: "#8c5a45",
                  paddingBottom: spacing.sm,
                }}
              >
                <Typography variant="bodyBold" color="#6e4534" serif>
                  {businessName}
                </Typography>
                <Typography variant="caption" color="#9b8275">
                  Nº {receiptNumber(sale.id)}
                </Typography>
              </View>
              {sale.items.slice(0, 2).map((item) => (
                <View
                  key={item.id}
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Typography variant="caption" color="#3d2b22" numberOfLines={1}>
                    {item.productName}
                  </Typography>
                  <Typography variant="caption" color="#3d2b22">
                    {formatCurrency(item.subtotal)}
                  </Typography>
                </View>
              ))}
              <View
                style={{
                  backgroundColor: "#f7efe9",
                  borderRadius: radii.md,
                  padding: spacing.sm,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="caption" color="#7d6354">
                  Total
                </Typography>
                <Typography variant="bodyBold" color="#2e7d32">
                  {formatCurrency(sale.total)}
                </Typography>
              </View>
            </View>

            {/* Cadeado por cima */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: theme.colors.premium,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                }}
              >
                <Ionicons name="lock-closed" size={28} color="#ffffff" />
              </View>
            </View>
          </View>

          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Envie recibos em PDF com o nome do seu negócio e visual profissional. Sua
            cliente vai notar a diferença.
          </Typography>

          <Button
            title="Desbloquear com o Profissional"
            variant="premium"
            onPress={onUpgrade}
          />
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Typography
              variant="bodyBold"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              Agora não
            </Typography>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
