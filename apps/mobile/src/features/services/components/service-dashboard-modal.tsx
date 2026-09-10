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
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError } from "../../../shared/utils/alerts";
import { isoToBR } from "../../../shared/utils/date";
import { formatCurrency } from "../../../shared/utils/format";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { openWhatsApp } from "../../../shared/utils/whatsapp";
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
  const isDesktop = useDesktopLayout();
  const insights = useServiceInsights(service.id);
  const bookings = useServiceBookingRequests(service.id);
  const purchases = useServicePackagePurchases(service.id);
  const updateBooking = useUpdateServiceBookingRequest(service.id);
  const purchasePackage = usePurchaseServicePackage();
  const updatingBookingIdRef = useRef<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packagePaymentMethod, setPackagePaymentMethod] = useState<PaymentMethod>("pix");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const profitColor =
    (insights.data?.profit ?? 0) < 0 ? theme.colors.alert : theme.colors.success;

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

  async function changeBookingStatus(id: string, status: ServiceBookingRequestStatus) {
    if (updatingBookingIdRef.current) return;
    updatingBookingIdRef.current = id;
    try {
      await updateBooking.mutateAsync({ id, status });
    } catch (error) {
      alertError(error);
    } finally {
      updatingBookingIdRef.current = null;
    }
  }

  return (
    <>
      <StandardModal
        visible={visible}
        onClose={onClose}
        title={service.name}
        wide
        footer={
          <View style={[styles.footer, isDesktop && { maxWidth: 440 }]}>
            <Button
              title="Editar serviço"
              variant="outline"
              style={styles.editButton}
              onPress={onEdit}
            />
            <Button
              title="Novo atendimento"
              icon={<AppIcon name="add" size={18} color={theme.colors.textOnPrimary} />}
              style={styles.createButton}
              onPress={onNewAppointment}
            />
          </View>
        }
      >
        <View style={styles.section}>
          <Typography variant="bodyBold">Resumo do serviço</Typography>
          <View style={styles.metrics}>
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
                color: profitColor,
              },
              {
                label: "Lucro por hora",
                value: formatCurrency(insights.data?.profitPerHour ?? 0),
              },
            ].map((metric) => (
              <View
                key={metric.label}
                style={[
                  styles.metric,
                  {
                    backgroundColor: theme.colors.surface,
                    flexBasis: isDesktop ? "22%" : "45%",
                  },
                ]}
              >
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {metric.label}
                </Typography>
                <Typography
                  variant="money"
                  color={metric.color ?? theme.colors.text}
                  style={styles.metricValue}
                >
                  {insights.isPending ? "—" : metric.value}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <View style={styles.sectionHeading}>
            <Typography variant="bodyBold" style={styles.headingText}>
              Solicitações de horário
            </Typography>
            {bookings.data?.length ? (
              <Badge label={String(bookings.data.length)} variant="neutral" />
            ) : null}
          </View>
          {(bookings.data ?? []).length === 0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Nenhuma solicitação recebida para este serviço.
            </Typography>
          ) : (
            bookings.data?.map((booking) => (
              <Card
                key={booking.id}
                padding="md"
                variant="elevated"
                style={styles.bookingCard}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: spacing.sm,
                  }}
                >
                  <View style={styles.clientDetails}>
                    <Typography variant="bodyBold">{booking.clientName}</Typography>
                  </View>
                  <Badge
                    label={BOOKING_STATUS[booking.status].label}
                    variant={BOOKING_STATUS[booking.status].variant}
                  />
                </View>
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <AppIcon
                      name="calendar-outline"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Typography
                      variant="caption"
                      color={theme.colors.text}
                      style={styles.headingText}
                    >
                      {isoToBR(booking.desiredDate)}
                      {booking.desiredTime
                        ? ` às ${booking.desiredTime.slice(0, 5)}`
                        : " · Horário a combinar"}
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <AppIcon
                      name="call-outline"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Typography variant="caption" style={styles.headingText}>
                      {/^\d{10,11}$/.test(booking.phone)
                        ? maskPhoneBR(booking.phone)
                        : booking.phone}
                    </Typography>
                  </View>
                </View>
                {booking.notes ? (
                  <View style={[styles.notes, { borderLeftColor: theme.colors.border }]}>
                    <Typography variant="caption">{booking.notes}</Typography>
                  </View>
                ) : null}
                <View style={{ gap: spacing.sm }}>
                  <Button
                    title="WhatsApp"
                    variant="successOutline"
                    style={{ borderRadius: radii.sm, minHeight: 44 }}
                    icon={
                      <AppIcon
                        name="logo-whatsapp"
                        size={18}
                        color={theme.colors.success}
                      />
                    }
                    onPress={() => {
                      void openWhatsApp(
                        booking.phone,
                        `Olá, ${booking.clientName}! Recebi sua solicitação para ${service.name} no dia ${booking.desiredDate}. Vamos confirmar os detalhes?`,
                      );
                      void changeBookingStatus(booking.id, "contacted");
                    }}
                  />
                  <View style={{ gap: spacing.xs }}>
                    <View
                      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
                    >
                      <Chip
                        label="Contato feito"
                        variant="info"
                        selected={booking.status === "contacted"}
                        disabled={updateBooking.isPending}
                        style={styles.bookingStatusChip}
                        onPress={() => void changeBookingStatus(booking.id, "contacted")}
                      />
                      <Chip
                        label="Confirmar"
                        variant="success"
                        selected={booking.status === "confirmed"}
                        disabled={updateBooking.isPending}
                        style={styles.bookingStatusChip}
                        onPress={() => void changeBookingStatus(booking.id, "confirmed")}
                      />
                      <Chip
                        label="Recusar"
                        variant="danger"
                        selected={booking.status === "declined"}
                        disabled={updateBooking.isPending}
                        style={styles.bookingStatusChip}
                        onPress={() => void changeBookingStatus(booking.id, "declined")}
                      />
                    </View>
                    {updateBooking.isPending &&
                    updatingBookingIdRef.current === booking.id ? (
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Salvando status...
                      </Typography>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {service.packages.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Typography variant="bodyBold">Vender pacote</Typography>
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
          <Typography variant="bodyBold">Pacotes ativos</Typography>
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
          <Typography variant="bodyBold">Histórico recente</Typography>
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
                      {isoToBR(appointment.deliveryDate)}
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

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headingText: { flexShrink: 1, minWidth: 0 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    flexGrow: 1,
    minWidth: 0,
    padding: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  metricValue: { fontVariant: ["tabular-nums"] },
  bookingCard: { gap: spacing.sm, borderRadius: radii.lg },
  clientDetails: { flex: 1, minWidth: 0 },
  bookingDetails: { gap: spacing.xs },
  detailRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  notes: { borderLeftWidth: 2, paddingLeft: spacing.sm },
  bookingStatusChip: {
    flexBasis: 100,
    flexGrow: 1,
    minWidth: 100,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  footer: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  editButton: { flexGrow: 1, flexBasis: 112, minWidth: 112 },
  createButton: { flexGrow: 2, flexBasis: 164, minWidth: 164 },
});
