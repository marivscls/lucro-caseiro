import type { Order, ProlaboreStatus } from "@lucro-caseiro/contracts";
import { Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { AppIcon } from "../../shared/components/app-icon";
import { formatCurrency } from "../../shared/utils/format";
import { useFinanceRangeSummary, useFinanceSummary } from "../finance/hooks";
import { useInsights } from "../insights/hooks";
import { useTodaySummary } from "../sales/hooks";
import {
  homeAttention,
  dayAppointments,
  nextAppointments,
  pendingReceipts,
  queryState,
  quickActions,
  type HomeAction,
} from "./domain";
import { useHomePendingSales, useHomeProducts } from "./hooks";

type Query<T> = { data: T | undefined; isError: boolean; refetch: () => unknown };

function Link({ label, onPress }: Readonly<{ label: string; onPress: () => void }>) {
  const colors = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        justifyContent: "center",
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Typography variant="homeLink" color={colors.wine}>
        {label}
      </Typography>
    </Pressable>
  );
}

export function HomeSection({
  title,
  children,
  action,
}: Readonly<{
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
}>) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          columnGap: spacing.md,
        }}
      >
        <Typography variant="homeTitle" style={{ flexShrink: 1 }}>
          {title}
        </Typography>
        {action && <Link {...action} />}
      </View>
      {children}
    </View>
  );
}

export function QueryNotice<T>({
  query,
  label,
}: Readonly<{ query: Query<T>; label: string }>) {
  const state = queryState(query);
  if (state === "ready") return null;
  const messages = {
    loading: `Carregando ${label}…`,
    stale: `Não foi possível atualizar ${label}. Exibindo a última informação disponível.`,
    error: `Não foi possível carregar ${label}.`,
  };
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>
      <Typography variant="homeBody">{messages[state]}</Typography>
      {query.isError && (
        <Link
          label={`Tentar novamente: ${label}`}
          onPress={() => {
            query.refetch();
          }}
        />
      )}
    </View>
  );
}

function ActionRow({
  title,
  detail,
  icon,
  onPress,
}: Readonly<{
  title: string;
  detail: string;
  icon: HomeAction["icon"];
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
  return (
    <HomeSection
      title="Seu dia"
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
      </Card>
    </HomeSection>
  );
}

export function HomeQuickActions({
  service,
  scheduling,
}: Readonly<{
  service: boolean;
  scheduling: boolean;
}>) {
  const router = useRouter();
  const colors = useBrandScreenPalette();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 380 || fontScale > 1.15 || (service && width < 600) ? 2 : 4;
  return (
    <HomeSection
      title="Ações rápidas"
      action={{ label: "Ver todas", onPress: () => router.push("/tabs/more") }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {quickActions(service, scheduling).map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            onPress={() => router.push(action.route as Href)}
            style={({ pressed }) => ({
              flexBasis: columns === 2 ? "47%" : "22%",
              flexGrow: 1,
              minHeight: 92,
              padding: spacing.md,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppIcon name={action.icon} size={24} color={colors.wine} />
            <Typography
              variant="homeShortcut"
              style={{ textAlign: "center", flexShrink: 1 }}
            >
              {action.label}
            </Typography>
          </Pressable>
        ))}
      </View>
    </HomeSection>
  );
}

function MoneyValue({
  label,
  value,
  light = false,
}: Readonly<{
  label: string;
  value: number;
  light?: boolean;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        flexGrow: light ? 0 : 1,
        flexBasis: light ? undefined : 130,
        minWidth: 0,
        gap: 5,
      }}
    >
      <Typography variant="homeBody" color={light ? colors.onWine : colors.muted}>
        {label}
      </Typography>
      <Typography
        variant="homeFinancialValue"
        color={light ? colors.onWine : colors.wine}
      >
        {formatCurrency(value)}
      </Typography>
    </View>
  );
}

export function HomeMoney({
  today,
  orders,
  scheduling,
}: Readonly<{
  today: string;
  orders: Query<Order[]>;
  scheduling: boolean;
}>) {
  const [period, setPeriod] = useState<"today" | "month">("today");
  const colors = useBrandScreenPalette();
  const router = useRouter();
  const todaySales = useTodaySummary();
  const monthSales = useInsights(1);
  const dayFinance = useFinanceRangeSummary(today, today);
  const monthFinance = useFinanceSummary();
  const pending = useHomePendingSales();
  const sales = period === "today" ? todaySales : monthSales;
  const finance = period === "today" ? dayFinance : monthFinance;
  const amount =
    period === "today" ? todaySales.data?.totalAmount : monthSales.data?.totalRevenue;
  const receipts = pending.data ? pendingReceipts(pending.data.items) : undefined;
  const pendingLabel = receipts?.count === 1 ? "venda" : "vendas";
  // Agenda commitments remain separate from sale receivables. Linked sales are
  // represented only by the sales endpoint, avoiding duplicate collection.
  const commitments = nextAppointments(orders.data ?? []).filter(
    (order) =>
      !order.saleId && order.amount != null && order.amount > (order.deposit ?? 0),
  );
  const committedAmount = commitments.reduce(
    (sum, order) => sum + order.amount! - (order.deposit ?? 0),
    0,
  );
  return (
    <HomeSection
      title="Dinheiro"
      action={{ label: "Ver financeiro", onPress: () => router.push("/finance") }}
    >
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Período do resumo"
        style={{ flexDirection: "row", gap: spacing.sm, alignSelf: "flex-start" }}
      >
        {(["today", "month"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: period === option }}
            onPress={() => setPeriod(option)}
            style={({ pressed }) => ({
              minHeight: 48,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.sm,
              justifyContent: "center",
              borderRadius: radii.md,
              backgroundColor: period === option ? colors.wineFill : colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              variant="homeLink"
              color={period === option ? colors.onWine : colors.wine}
            >
              {option === "today" ? "Hoje" : "Mês"}
            </Typography>
          </Pressable>
        ))}
      </View>
      <View
        style={{
          backgroundColor: colors.wineFill,
          borderRadius: radii["2xl"],
          padding: spacing.xl,
          gap: spacing.lg,
        }}
      >
        {amount !== undefined ? (
          <MoneyValue
            label={period === "today" ? "Vendido hoje" : "Vendido no mês"}
            value={amount}
            light
          />
        ) : (
          <Typography variant="homeBody" color={colors.onWine}>
            {sales.isError ? "Vendas indisponíveis" : "Carregando vendas…"}
          </Typography>
        )}
        <Typography variant="homeBody" color={colors.onWine}>
          Vendido é o valor das vendas, mesmo quando ainda não foi recebido.
        </Typography>
      </View>
      <QueryNotice query={sales as Query<unknown>} label="vendas" />
      <Card padding="lg" style={{ borderColor: colors.border }}>
        <QueryNotice query={finance} label="entradas e despesas" />
        {finance.data && (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
              <MoneyValue label="Entradas recebidas" value={finance.data.totalIncome} />
              <MoneyValue
                label="Despesas registradas"
                value={finance.data.totalExpenses}
              />
            </View>
            <Typography variant="homeBody">
              Saldo dos lançamentos:{" "}
              {formatCurrency(finance.data.totalIncome - finance.data.totalExpenses)}
            </Typography>
            <Typography variant="homeBody">
              Entradas menos despesas registradas{" "}
              {period === "today" ? "hoje" : "neste mês"}. Não é o saldo bancário nem o
              lucro completo do negócio.
            </Typography>
          </View>
        )}
      </Card>
      <Card padding="lg" style={{ borderColor: colors.border }}>
        <Typography variant="homeGoalTitle">A receber · todos os períodos</Typography>
        <QueryNotice query={pending} label="valores das vendas a receber" />
        {receipts && (
          <ActionRow
            title={`${formatCurrency(receipts.total)} em vendas`}
            detail={
              receipts.count
                ? `${receipts.count} ${pendingLabel} com pagamento pendente. Ver recebimentos.`
                : "Nenhuma venda com valor pendente."
            }
            icon="cash-outline"
            onPress={() => router.push("/fiado")}
          />
        )}
        {scheduling && (
          <>
            <QueryNotice query={orders} label="recebimentos previstos na agenda" />
            {orders.data && committedAmount > 0 && (
              <ActionRow
                title={`${formatCurrency(committedAmount)} previstos na agenda`}
                detail="Valor restante de compromissos ainda não registrados como venda, descontando os sinais recebidos."
                icon="calendar-outline"
                onPress={() => router.push("/tabs/agenda")}
              />
            )}
          </>
        )}
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

export function HomeGoal({
  query,
  onEdit,
}: Readonly<{
  query: Query<ProlaboreStatus>;
  onEdit: () => void;
}>) {
  const colors = useBrandScreenPalette();
  const { theme } = useTheme();
  const config = query.data?.config;
  const progress = query.data?.progress;
  return (
    <HomeSection title="Meta do mês">
      <Card padding="lg" style={{ borderColor: colors.border, gap: spacing.sm }}>
        <QueryNotice query={query} label="sua meta" />
        {query.data && (
          <>
            <Typography variant="homeGoalTitle">
              Entradas para sua retirada ·{" "}
              {new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
                progress?.period
                  ? new Date(`${progress.period}-15T12:00:00`)
                  : new Date(),
              )}
            </Typography>
            {config && progress ? (
              <>
                <Typography variant="homeGoalValue">
                  {formatCurrency(progress.currentRevenue)} de{" "}
                  {formatCurrency(progress.requiredRevenue)}
                </Typography>
                <Typography variant="homeBody">
                  {progress.reached
                    ? "Você atingiu a meta de entradas deste mês."
                    : `Faltam ${formatCurrency(Math.max(0, progress.remainingRevenue))} em entradas.`}
                </Typography>
                <View
                  accessibilityRole="progressbar"
                  accessibilityLabel="Progresso da meta mensal"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.round(Math.min(100, Math.max(0, progress.progressPct))),
                  }}
                  style={{ gap: spacing.xs }}
                >
                  <View
                    style={{
                      height: 8,
                      borderRadius: radii.full,
                      overflow: "hidden",
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${Math.min(100, Math.max(0, progress.progressPct))}%`,
                        backgroundColor: colors.lime,
                      }}
                    />
                  </View>
                  <Typography variant="homeBody">
                    {Math.round(progress.progressPct)}% da meta
                  </Typography>
                </View>
                <Typography variant="homeBody">
                  O progresso considera as entradas registradas no mês. O alvo cobre os
                  custos e sua retirada desejada de{" "}
                  {formatCurrency(config.monthlyProlaboreGoal)}. Vendas ainda não
                  recebidas não entram neste progresso.
                </Typography>
              </>
            ) : (
              <Typography variant="homeBody">
                Defina quanto quer retirar por mês para calcular a meta de entradas.
              </Typography>
            )}
            <Link label={config ? "Editar meta" : "Definir meta"} onPress={onEdit} />
          </>
        )}
      </Card>
    </HomeSection>
  );
}
