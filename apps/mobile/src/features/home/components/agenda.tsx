import type { Order } from "@lucro-caseiro/contracts";
import { Card, Typography, spacing } from "@lucro-caseiro/ui";
import { useRouter, type Href } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  agendaCommitted,
  homeAttention,
  nextAppointments,
  dayAppointments,
} from "../domain";
import { useHomeProducts } from "../hooks";
import { HomeSection, Link, QueryNotice, money, type Query } from "./parts";

// ---------------------------------------------------------------------------
// Agenda e estoque (abaixo das fases 2 e 3)
// ---------------------------------------------------------------------------

function ActionRow({
  title,
  detail,
  icon,
  onPress,
}: Readonly<{
  title: string;
  detail: string;
  icon: AppIconName;
  onPress: () => void;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 64,
        paddingVertical: spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppIcon name={icon} size={22} color={colors.wine} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Typography variant="homeCardLead">{title}</Typography>
        <Typography variant="homeBody">{detail}</Typography>
      </View>
      <AppIcon name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function deadline(order: Order, today: string) {
  const date = order.deliveryDate.slice(0, 10);
  let day = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
  if (date === today) day = "Hoje";
  if (date < today) day = `Prazo passou · ${day}`;
  return [day, order.deliveryTime?.slice(0, 5), order.clientName]
    .filter(Boolean)
    .join(" · ");
}

export function HomeDay({
  query,
  today,
  service,
}: Readonly<{
  query: Query<Order[]>;
  today: string;
  service: boolean;
}>) {
  const router = useRouter();
  const colors = useBrandScreenPalette();
  const appointments = nextAppointments(query.data ?? []);
  const committed = agendaCommitted(query.data ?? []);
  return (
    <HomeSection
      title="Agenda"
      action={{ label: "Ver agenda", onPress: () => router.push("/tabs/agenda") }}
    >
      <Card padding="lg" style={{ borderColor: colors.border }}>
        <QueryNotice query={query} label="sua agenda" />
        {query.data && appointments.length === 0 && (
          <View>
            <Typography variant="homeBody">
              Nenhum compromisso em aberto na sua agenda.
            </Typography>
            <Link
              label={service ? "Agendar atendimento" : "Agendar encomenda"}
              onPress={() => router.push("/tabs/agenda?create=home")}
            />
          </View>
        )}
        {dayAppointments(query.data ?? [], today).map((order, index) => (
          <View
            key={order.id}
            style={{ borderTopWidth: index ? 1 : 0, borderColor: colors.border }}
          >
            <ActionRow
              title={order.title}
              detail={deadline(order, today)}
              icon="calendar-outline"
              onPress={() =>
                router.push({ pathname: "/tabs/agenda", params: { orderId: order.id } })
              }
            />
          </View>
        ))}
        {query.data && committed > 0 ? (
          <View style={{ borderTopWidth: 1, borderColor: colors.border }}>
            <ActionRow
              title={`${money(committed)} previstos na agenda`}
              detail="Valor restante de compromissos ainda não registrados como venda, descontando os sinais recebidos."
              icon="cash-outline"
              onPress={() => router.push("/tabs/agenda")}
            />
          </View>
        ) : null}
      </Card>
    </HomeSection>
  );
}

export function HomeAttention({ enabled }: Readonly<{ enabled: boolean }>) {
  const query = useHomeProducts(enabled);
  const router = useRouter();
  const colors = useBrandScreenPalette();
  if (!enabled) return null;
  const alerts = homeAttention(query.data?.items ?? []);
  if (query.data && !query.isError && !alerts.length) return null;
  return (
    <HomeSection title="Precisa de atenção">
      <Card padding="lg" style={{ borderColor: colors.border }}>
        <QueryNotice query={query} label="alertas do negócio" />
        {alerts.map((alert, index) => (
          <View
            key={alert.id}
            style={{ borderTopWidth: index ? 1 : 0, borderColor: colors.border }}
          >
            <ActionRow {...alert} onPress={() => router.push(alert.route as Href)} />
          </View>
        ))}
      </Card>
    </HomeSection>
  );
}
