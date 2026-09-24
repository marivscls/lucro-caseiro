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
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import {
  ChipChoiceField,
  ChipRow,
  FormField,
  OptionChip,
} from "../../../shared/components/form-field";
import { FormActions } from "../../../shared/components/form-layout";
import { FormSection } from "../../../shared/components/form-section";
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

const PAYMENT_OPTIONS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "cash", label: "Dinheiro" },
  { value: "card", label: "Cartão" },
  { value: "transfer", label: "Transferência" },
  { value: "credit", label: "Fiado" },
];

const BOOKING_ACTIONS: ReadonlyArray<{
  status: ServiceBookingRequestStatus;
  label: string;
}> = [
  { status: "contacted", label: "Contato feito" },
  { status: "confirmed", label: "Confirmar" },
  { status: "declined", label: "Recusar" },
];

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
          <FormActions>
            <Button title="Editar serviço" variant="outline" onPress={onEdit} />
            <Button
              title="Novo atendimento"
              icon={
                // No celular o ícone não cabe junto do texto inteiro.
                isDesktop ? (
                  <AppIcon name="add" size={18} color={theme.colors.textOnPrimary} />
                ) : undefined
              }
              onPress={onNewAppointment}
            />
          </FormActions>
        }
      >
        <FormSection title="Resumo do serviço" collapsible={false}>
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
        </FormSection>

        <FormSection
          title="Solicitações de horário"
          collapsible={false}
          titleAccessory={
            bookings.data?.length ? (
              <Badge label={String(bookings.data.length)} variant="neutral" />
            ) : null
          }
        >
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
                <View
                  style={[
                    styles.bookingActions,
                    isDesktop ? styles.bookingActionsDesktop : null,
                  ]}
                >
                  <ChipRow
                    accessibilityLabel={`Situação da solicitação de ${booking.clientName}`}
                  >
                    {BOOKING_ACTIONS.map((action) => (
                      <OptionChip
                        key={action.status}
                        label={action.label}
                        selected={booking.status === action.status}
                        disabled={updateBooking.isPending}
                        onPress={() =>
                          void changeBookingStatus(booking.id, action.status)
                        }
                      />
                    ))}
                  </ChipRow>
                  <Button
                    title="Chamar no WhatsApp"
                    variant="successOutline"
                    style={isDesktop ? styles.inlineAction : undefined}
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
                </View>
                {updateBooking.isPending &&
                updatingBookingIdRef.current === booking.id ? (
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Salvando status...
                  </Typography>
                ) : null}
              </Card>
            ))
          )}
        </FormSection>

        {service.packages.length > 0 ? (
          <FormSection
            title="Vender pacote"
            subtitle="A venda entra no financeiro; se for fiado, fica pendente para cobrança."
            collapsible={false}
          >
            <FormField label="Pacote">
              <ChipChoiceField
                accessibilityLabel="Pacote"
                value={selectedPackageId}
                options={service.packages
                  .filter((item) => item.active)
                  .map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${item.sessions} sessões`,
                  }))}
                onChange={setSelectedPackageId}
              />
            </FormField>
            <FormField label="Forma de pagamento">
              <ChipChoiceField
                accessibilityLabel="Forma de pagamento"
                value={packagePaymentMethod}
                options={PAYMENT_OPTIONS}
                onChange={setPackagePaymentMethod}
              />
            </FormField>
            <View style={isDesktop ? styles.inlineActionRow : undefined}>
              <Button
                title="Escolher cliente e vender"
                disabled={!selectedPackageId}
                loading={purchasePackage.isPending}
                style={isDesktop ? styles.inlineAction : undefined}
                onPress={() => setShowClientPicker(true)}
              />
            </View>
          </FormSection>
        ) : null}

        <FormSection title="Pacotes ativos" collapsible={false}>
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
        </FormSection>

        <FormSection title="Histórico recente" collapsible={false}>
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
        </FormSection>
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
  bookingActions: { gap: spacing.md },
  bookingActionsDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineActionRow: { flexDirection: "row", justifyContent: "flex-end" },
  inlineAction: { minWidth: 200 },
});
