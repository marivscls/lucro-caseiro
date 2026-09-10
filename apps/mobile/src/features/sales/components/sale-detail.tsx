import type { Sale } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  radii,
  spacing,
  Typography,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Image, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName, productInitial } from "../../products/display";
import { isValidBrazilPhone } from "../../../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../../../shared/utils/whatsapp";
import { useProfile } from "../../subscription/hooks";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useUpdateSaleStatus } from "../hooks";
import { paymentLabel } from "../payment";
import { buildReceiptMessage } from "../receipt";
import { exportReceiptPdf } from "../receipt-pdf";
import { ReceiptPreviewModal } from "./receipt-preview-modal";
import { showAlert } from "../../../shared/components/alert-store";
import { alertError } from "../../../shared/utils/alerts";

interface SaleDetailProps {
  readonly sale: Sale;
  readonly clientPhone?: string | null;
  readonly onStatusUpdated?: () => void;
  readonly onEditPress?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Pago", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

export function SaleDetail({
  sale,
  clientPhone,
  onStatusUpdated,
  onEditPress,
}: SaleDetailProps) {
  const { theme, mode } = useTheme();
  const updateStatus = useUpdateSaleStatus();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((st) => st.show);
  const [exporting, setExporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const businessName = profile?.businessName ?? profile?.name ?? "Meu negócio";

  // Recibo em PDF e recurso de exportacao — exclusivo do Premium.
  // Free ve um vislumbre do recibo (com cadeado) antes do paywall.
  async function handleReceiptPdf() {
    if (!profile || !hasActiveFeature(profile.plan, profile.planExpiresAt, "export")) {
      setPreviewVisible(true);
      return;
    }
    setExporting(true);
    try {
      await exportReceiptPdf(sale, { name: businessName, phone: profile?.phone });
    } catch {
      alertError("Não foi possível gerar o recibo. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleSendReceipt() {
    const message = buildReceiptMessage(sale);
    if (clientPhone && isValidBrazilPhone(clientPhone)) {
      void openWhatsApp(clientPhone, message);
    } else {
      void openWhatsAppShare(message);
    }
  }

  const status = STATUS_MAP[sale.status] ?? {
    label: sale.status,
    variant: "neutral" as const,
  };
  const payment = paymentLabel(sale.paymentMethod);

  function handleMarkAsPaid() {
    showAlert({
      title: "Confirmar",
      message: "Deseja marcar esta venda como paga?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, marcar como paga",
          onPress: () => {
            void (async () => {
              try {
                await updateStatus.mutateAsync({ id: sale.id, status: "paid" });
                showAlert({ title: "Pronto!", message: "Venda marcada como paga." });
                onStatusUpdated?.();
              } catch {
                alertError("Não foi possível atualizar o status.");
              }
            })();
          },
        },
      ],
    });
  }

  function handleCancel() {
    showAlert({
      title: "Cancelar venda",
      message: "Tem certeza que deseja cancelar esta venda?",
      buttons: [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await updateStatus.mutateAsync({ id: sale.id, status: "cancelled" });
                showAlert({ title: "Pronto!", message: "Venda cancelada." });
                onStatusUpdated?.();
              } catch {
                alertError("Não foi possível cancelar a venda.");
              }
            })();
          },
        },
      ],
    });
  }

  return (
    <View style={{ flexShrink: 1, gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <Typography variant="caption">Total da venda</Typography>
          <Badge label={status.label} variant={status.variant} />
        </View>
        <Typography variant="moneyHero" color={theme.colors.text}>
          {formatCurrency(sale.total)}
        </Typography>
        <Typography variant="caption">{formatDate(sale.soldAt)}</Typography>
      </View>

      <View
        style={{
          gap: spacing.md,
          paddingVertical: spacing.lg,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <AppIcon name="person-outline" size={18} color={theme.colors.textSecondary} />
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="caption">Cliente</Typography>
            <Typography variant="bodyBold">
              {sale.clientName ?? "Cliente avulso"}
            </Typography>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <AppIcon name="wallet-outline" size={18} color={theme.colors.textSecondary} />
          <Typography variant="caption" style={{ flex: 1 }}>
            Pagamento
          </Typography>
          <Typography variant="bodyBold" style={{ flexShrink: 1, textAlign: "right" }}>
            {payment}
          </Typography>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <Typography variant="h3">Itens da venda</Typography>
          <Typography variant="caption">
            {sale.items.length} {sale.items.length === 1 ? "item" : "itens"}
          </Typography>
        </View>
        <Card padding="md" style={{ borderRadius: radii.xl }}>
          {sale.items.length === 0 ? (
            <Typography variant="body">Nenhum item nesta venda.</Typography>
          ) : (
            sale.items.map((item, index) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingVertical: spacing.sm,
                  ...(index > 0
                    ? {
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                        marginTop: spacing.sm,
                        paddingTop: spacing.md,
                      }
                    : {}),
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.sm,
                    overflow: "hidden",
                    backgroundColor: theme.colors.surfaceElevated,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.productPhotoUrl ? (
                    <>
                      <Image
                        source={{ uri: item.productPhotoUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: radii.sm,
                          borderWidth: 1,
                          borderColor:
                            mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                        }}
                      />
                    </>
                  ) : (
                    <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                      {productInitial(item.productName)}
                    </Typography>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                  <Typography variant="bodyBold">
                    {displayProductName(item.productName)}
                  </Typography>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      columnGap: spacing.sm,
                      rowGap: spacing.xs,
                    }}
                  >
                    <Typography variant="caption">
                      {item.quantity.toLocaleString("pt-BR")} ×{" "}
                      {formatCurrency(item.unitPrice)}
                    </Typography>
                    <Typography
                      variant="bodyBold"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatCurrency(item.subtotal)}
                    </Typography>
                  </View>
                </View>
              </View>
            ))
          )}
          {sale.discount > 0 ? (
            <View
              style={{
                gap: spacing.sm,
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="caption">Subtotal</Typography>
                <Typography variant="body">{formatCurrency(sale.subtotal)}</Typography>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="caption">Desconto</Typography>
                <Typography variant="body">− {formatCurrency(sale.discount)}</Typography>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="bodyBold">Total</Typography>
                <Typography variant="bodyBold">{formatCurrency(sale.total)}</Typography>
              </View>
            </View>
          ) : null}
        </Card>
      </View>

      {sale.notes ? (
        <View style={{ gap: spacing.xs }}>
          <Typography variant="captionBold">Observações</Typography>
          <Typography variant="body">{sale.notes}</Typography>
        </View>
      ) : null}

      {sale.status !== "cancelled" ? (
        <View style={{ gap: spacing.md }}>
          {sale.status === "pending" ? (
            <Button
              title="Marcar como pago"
              size="lg"
              icon={
                <AppIcon
                  name="checkmark-circle-outline"
                  size={20}
                  color={theme.colors.textOnPrimary}
                />
              }
              onPress={handleMarkAsPaid}
              loading={updateStatus.isPending}
            />
          ) : null}
          <Button
            title="Enviar recibo no WhatsApp"
            variant={sale.status === "paid" ? "success" : "successOutline"}
            size="lg"
            titleLines={2}
            fitTitle={false}
            icon={
              <AppIcon
                name="logo-whatsapp"
                size={20}
                color={
                  sale.status === "paid"
                    ? theme.colors.textOnPrimary
                    : theme.colors.success
                }
              />
            }
            onPress={handleSendReceipt}
          />
          <Button
            title="Recibo em PDF"
            variant="outline"
            size="lg"
            icon={
              <AppIcon
                name="document-text-outline"
                size={20}
                color={theme.colors.primaryStrong}
              />
            }
            onPress={() => void handleReceiptPdf()}
            loading={exporting}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            {onEditPress ? (
              <Button
                title="Editar venda"
                variant="ghost"
                icon={
                  <AppIcon
                    name="create-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                }
                style={{ flexGrow: 1, flexBasis: 130 }}
                onPress={onEditPress}
                disabled={updateStatus.isPending}
              />
            ) : null}
            <Button
              title="Cancelar venda"
              variant="alertOutline"
              style={{ flexGrow: 1, flexBasis: 130 }}
              onPress={handleCancel}
              loading={updateStatus.isPending}
            />
          </View>
        </View>
      ) : null}

      <ReceiptPreviewModal
        visible={previewVisible}
        sale={sale}
        businessName={businessName}
        onUpgrade={() => {
          setPreviewVisible(false);
          showPaywall("export");
        }}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}
