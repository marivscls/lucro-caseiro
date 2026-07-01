import type { Sale } from "@lucro-caseiro/contracts";
import { Badge, Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { isValidBrazilPhone } from "../../../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../../../shared/utils/whatsapp";
import { isProfilePremiumActive, useProfile } from "../../subscription/hooks";
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
    month: "long",
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
  const { theme } = useTheme();
  const updateStatus = useUpdateSaleStatus();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((st) => st.show);
  const [exporting, setExporting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const businessName = profile?.businessName ?? profile?.name ?? "Meu negócio";

  // Recibo em PDF e recurso de exportacao — exclusivo do Premium.
  // Free ve um vislumbre do recibo (com cadeado) antes do paywall.
  async function handleReceiptPdf() {
    if (!isProfilePremiumActive(profile)) {
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
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h2">Detalhes da venda</Typography>
        <Badge label={status.label} variant={status.variant} />
      </View>

      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Cliente</Typography>
            <Typography variant="body">{sale.clientName ?? "Cliente avulso"}</Typography>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Pagamento</Typography>
            <Badge label={payment} variant="info" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Data</Typography>
            <Typography variant="body">{formatDate(sale.soldAt)}</Typography>
          </View>
          {sale.notes && (
            <View style={{ marginTop: 4 }}>
              <Typography variant="caption">Observações</Typography>
              <Typography variant="body">{sale.notes}</Typography>
            </View>
          )}
        </View>
      </Card>

      <Typography variant="h3">Itens</Typography>
      {sale.items.map((item) => (
        <Card key={item.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.productPhotoUrl ? (
                <Image
                  source={{ uri: item.productPhotoUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <Typography variant="h3" color={theme.colors.textSecondary}>
                  {item.productName.charAt(0).toUpperCase()}
                </Typography>
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="body">{item.productName}</Typography>
              <Typography variant="caption">
                {item.quantity}x {formatCurrency(item.unitPrice)}
              </Typography>
            </View>
            <Typography variant="h3" color={theme.colors.success}>
              {formatCurrency(item.subtotal)}
            </Typography>
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: theme.colors.successBg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h3">Total</Typography>
          <Typography variant="h2" color={theme.colors.success}>
            {formatCurrency(sale.total)}
          </Typography>
        </View>
      </Card>

      <View style={{ gap: 12, marginTop: 8 }}>
        {sale.status !== "cancelled" && (
          <Button
            title="Enviar recibo no WhatsApp"
            variant="success"
            size="lg"
            icon={<Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />}
            onPress={handleSendReceipt}
          />
        )}
        {sale.status !== "cancelled" && (
          <Button
            title="Recibo em PDF"
            variant="secondary"
            size="lg"
            icon={
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.primary}
              />
            }
            onPress={() => void handleReceiptPdf()}
            loading={exporting}
          />
        )}
        {sale.status !== "cancelled" && onEditPress && (
          <Button
            title="Editar venda"
            variant="secondary"
            size="lg"
            onPress={onEditPress}
          />
        )}
        {sale.status === "pending" && (
          <Button
            title="Marcar como pago"
            size="lg"
            onPress={handleMarkAsPaid}
            loading={updateStatus.isPending}
          />
        )}
        {sale.status !== "cancelled" && (
          <Button
            title="Cancelar venda"
            variant="outline"
            size="lg"
            onPress={handleCancel}
            loading={updateStatus.isPending}
          />
        )}
      </View>

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
    </ScrollView>
  );
}
