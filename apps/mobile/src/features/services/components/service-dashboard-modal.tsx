import type {
  Client,
  PaymentMethod,
  Service,
  ServiceBookingRequestStatus,
} from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Chip,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Share, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { StandardModal } from "../../../shared/components/standard-modal";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { formatCurrency } from "../../../shared/utils/format";
import { openWhatsApp } from "../../../shared/utils/whatsapp";
import { publicCatalogUrl } from "../../catalog/api";
import { useCatalogSettings } from "../../catalog/hooks";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import {
  usePurchaseServicePackage,
  useServiceBookingRequests,
  useServiceInsights,
  useServicePackagePurchases,
  useUpdateServiceBookingRequest,
} from "../hooks";

interface ServiceDashboardModalProps {
  readonly service: Service;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onNewAppointment: () => void;
}

const BOOKING_STATUS: Record<
  ServiceBookingRequestStatus,
  { label: string; variant: "warning" | "info" | "success" | "neutral" }
> = {
  new: { label: "Nova", variant: "warning" },
  contacted: { label: "Contato feito", variant: "info" },
  confirmed: { label: "Confirmada", variant: "success" },
  declined: { label: "Recusada", variant: "neutral" },
};

export function ServiceDashboardModal({
  service,
  visible,
  onClose,
  onEdit,
  onNewAppointment,
}: ServiceDashboardModalProps) {
  const { theme } = useTheme();
  const insights = useServiceInsights(service.id);
  const bookings = useServiceBookingRequests(service.id);
  const purchases = useServicePackagePurchases(service.id);
  const catalog = useCatalogSettings();
  const updateBooking = useUpdateServiceBookingRequest();
  const purchasePackage = usePurchaseServicePackage();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packagePaymentMethod, setPackagePaymentMethod] = useState<PaymentMethod>("pix");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const bookingStatusChipStyle = {
    flexBasis: 96,
    flexGrow: 1,
    minWidth: 96,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };

  async function shareService() {
    if (!catalog.data?.enabled) {
      alertValidation("Ative a vitrine pública antes de divulgar este serviço.");
      return;
    }
    await Share.share({
      message: `Conheça o serviço ${service.name} e solicite seu horário:\n\n${publicCatalogUrl(catalog.data.slug)}`,
    });
  }

  async function sellPackage(client: Pick<Client, "id" | "name"> | null) {
    if (!client || !selectedPackageId) return;
    try {
      await purchasePackage.mutateAsync({
        packageId: selectedPackageId,
        data: { clientId: client.id, paymentMethod: packagePaymentMethod },
      });
      setSelectedPackageId(null);
    } catch (error) {
      alertError(error);
    }
  }

  return (
    <>
      <StandardModal
        visible={visible}
        onClose={onClose}
        title={service.name}
        subtitle="Atendimentos, resultado, pacotes e pedidos da vitrine"
        wide
        footer={
          <>
            <Button title="Editar serviço" variant="secondary" onPress={onEdit} />
            <Button title="Novo atendimento" onPress={onNewAppointment} />
          </>
        }
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {[
            {
              label: "Atendimentos",
              value: String(insights.data?.completedAppointments ?? 0),
            },
            {
              label: "Faturamento",
              value: formatCurrency(insights.data?.revenue ?? 0),
            },
            {
              label: "Lucro",
              value: formatCurrency(insights.data?.profit ?? 0),
            },
            {
              label: "Lucro por hora",
              value: formatCurrency(insights.data?.profitPerHour ?? 0),
            },
          ].map((metric) => (
            <Card
              key={metric.label}
              variant="elevated"
              style={{ flex: 1, minWidth: 150, gap: spacing.xs }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {metric.label}
              </Typography>
              <Typography variant="h3">{metric.value}</Typography>
            </Card>
          ))}
        </View>

        <Card style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Typography variant="bodyBold">Divulgação e agendamento</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {service.publicEnabled
                  ? "Visível na vitrine; solicitações chegam abaixo para confirmação."
                  : "Este serviço está somente no controle interno."}
              </Typography>
            </View>
            <AppIcon
              name={service.publicEnabled ? "globe-outline" : "eye-off-outline"}
              size={22}
              color={theme.colors.primaryStrong}
            />
          </View>
          <Button
            title="Compartilhar vitrine"
            variant="secondary"
            disabled={!service.publicEnabled}
            onPress={() => void shareService()}
          />
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Typography variant="h3">Solicitações de horário</Typography>
          {(bookings.data ?? []).length === 0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Nenhuma solicitação recebida para este serviço.
            </Typography>
          ) : (
            bookings.data?.map((booking) => (
              <Card key={booking.id} style={{ gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">{booking.clientName}</Typography>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {booking.desiredDate}
                      {booking.desiredTime ? ` · ${booking.desiredTime}` : ""}
                      {" · "}
                      {booking.phone}
                    </Typography>
                  </View>
                  <Badge
                    label={BOOKING_STATUS[booking.status].label}
                    variant={BOOKING_STATUS[booking.status].variant}
                  />
                </View>
                {booking.notes ? (
                  <Typography variant="caption">{booking.notes}</Typography>
                ) : null}
                <View style={{ gap: spacing.md }}>
                  <Button
                    title="Chamar no WhatsApp"
                    variant="successOutline"
                    icon={
                      <AppIcon
                        name="logo-whatsapp"
                        size={20}
                        color={theme.colors.success}
                      />
                    }
                    onPress={() => {
                      void openWhatsApp(
                        booking.phone,
                        `Olá, ${booking.clientName}! Recebi sua solicitação para ${service.name} no dia ${booking.desiredDate}. Vamos confirmar os detalhes?`,
                      );
                      updateBooking.mutate({
                        id: booking.id,
                        status: "contacted",
                      });
                    }}
                  />
                  <View style={{ gap: spacing.xs }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Atualizar status
                    </Typography>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
                    >
                      <Chip
                        label="Contato feito"
                        variant="info"
                        selected={booking.status === "contacted"}
                        style={bookingStatusChipStyle}
                        onPress={() =>
                          updateBooking.mutate({ id: booking.id, status: "contacted" })
                        }
                      />
                      <Chip
                        label="Confirmar"
                        variant="success"
                        selected={booking.status === "confirmed"}
                        style={bookingStatusChipStyle}
                        onPress={() =>
                          updateBooking.mutate({ id: booking.id, status: "confirmed" })
                        }
                      />
                      <Chip
                        label="Recusar"
                        variant="danger"
                        selected={booking.status === "declined"}
                        style={bookingStatusChipStyle}
                        onPress={() =>
                          updateBooking.mutate({ id: booking.id, status: "declined" })
                        }
                      />
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {service.packages.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3">Vender pacote</Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              A venda entra no financeiro; se for fiado, fica pendente para cobrança.
            </Typography>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {service.packages
                .filter((item) => item.active)
                .map((item) => (
                  <Chip
                    key={item.id}
                    label={`${item.name} · ${item.sessions} sessões`}
                    selected={selectedPackageId === item.id}
                    onPress={() => setSelectedPackageId(item.id)}
                  />
                ))}
            </View>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Forma de pagamento
            </Typography>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {[
                { label: "Pix", value: "pix" as const },
                { label: "Dinheiro", value: "cash" as const },
                { label: "Cartão", value: "card" as const },
                { label: "Transferência", value: "transfer" as const },
                { label: "Fiado", value: "credit" as const },
              ].map((method) => (
                <Chip
                  key={method.value}
                  label={method.label}
                  selected={packagePaymentMethod === method.value}
                  onPress={() => setPackagePaymentMethod(method.value)}
                />
              ))}
            </View>
            <Button
              title="Escolher cliente e vender pacote"
              disabled={!selectedPackageId}
              onPress={() => setShowClientPicker(true)}
            />
          </View>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Typography variant="h3">Pacotes ativos</Typography>
          {(purchases.data ?? []).filter((item) => item.status === "active").length ===
          0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Nenhum cliente com sessões disponíveis.
            </Typography>
          ) : (
            purchases.data
              ?.filter((item) => item.status === "active")
              .map((item) => (
                <Card key={item.id} style={{ gap: spacing.xs }}>
                  <Typography variant="bodyBold">{item.clientName}</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {item.packageName} · {item.sessionsTotal - item.sessionsUsed} de{" "}
                    {item.sessionsTotal} sessões restantes · vence em {item.expiresAt}
                  </Typography>
                </Card>
              ))
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Typography variant="h3">Histórico recente</Typography>
          {(insights.data?.recentAppointments ?? []).length === 0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Os atendimentos concluídos aparecerão aqui com valor, custo e cliente.
            </Typography>
          ) : (
            insights.data?.recentAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyBold">{appointment.clientName}</Typography>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {appointment.deliveryDate}
                      {appointment.deliveryTime ? ` · ${appointment.deliveryTime}` : ""}
                    </Typography>
                  </View>
                  <Typography variant="bodyBold">
                    {formatCurrency(appointment.amount)}
                  </Typography>
                </View>
              </Card>
            ))
          )}
        </View>
      </StandardModal>

      <ClientPickerModal
        visible={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        onSelect={(client) => void sellPackage(client)}
      />
    </>
  );
}
