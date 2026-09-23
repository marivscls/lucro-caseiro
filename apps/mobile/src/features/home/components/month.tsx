import type { FinanceSummary, ProlaboreStatus } from "@lucro-caseiro/contracts";
import { spacing } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { AppIcon } from "../../../shared/components/app-icon";
import { formatIntBR } from "../../../shared/utils/format";
import { displayProductName } from "../../products/display";
import { groupFiados } from "../../sales/fiado";
import {
  bestWeekday,
  capitalize,
  costLookup,
  daysSince,
  goalPace,
  lastSevenDays,
  monthChampions,
  monthComparison,
  monthName,
  pendingReceipts,
  priceAlert,
  returningClients,
  salesInMonth,
  salesStreak,
  weekBars,
} from "../domain";
import { useHomePendingSales } from "../hooks";
import {
  GhostLink,
  HomeCard,
  IconBox,
  ProgressBar,
  QueryNotice,
  Segments,
  T,
  heroMoney,
  money,
  useHomeColors,
  valueOrState,
  type ProductsPage,
  type Query,
  type SalesPage,
} from "./parts";
import { styles } from "./styles";

// ---------------------------------------------------------------------------
// Fase 3 — mês em uso
// ---------------------------------------------------------------------------

export function HomeMonthHero({
  history,
  finance,
  now,
  desktop,
}: Readonly<{
  history: Query<SalesPage>;
  finance: Query<FinanceSummary>;
  now: Date;
  desktop: boolean;
}>) {
  const colors = useHomeColors();
  const sales = history.data?.items;
  const comparison = sales ? monthComparison(sales, now) : undefined;
  const bars = sales ? weekBars(sales, now) : [];
  const best = sales ? bestWeekday(sales) : null;
  const max = Math.max(1, ...bars.map((bar) => bar.total));
  const barHeight = desktop ? 64 : 52;
  const valueStyle = desktop ? styles.heroValueDesk : styles.heroValue;
  let pill: React.ReactNode = null;
  if (comparison && comparison.pct !== null) {
    const up = comparison.pct > 0;
    const same = comparison.pct === 0;
    let text = `Igual a ${comparison.previousMonth}`;
    if (!same)
      text = `${Math.abs(comparison.pct)}% a ${up ? "mais" : "menos"} que ${comparison.previousMonth}`;
    pill = (
      <View
        accessible
        accessibilityLabel={`${text}, comparando com os dias 1 a ${comparison.limit} de ${comparison.previousMonth}`}
        style={[
          styles.pill,
          { backgroundColor: up || same ? colors.lime : colors.wineDivider },
        ]}
      >
        {!same ? (
          <AppIcon
            name={up ? "trending-up-outline" : "trending-down-outline"}
            size={16}
            color={up ? colors.onLime : colors.onWine}
          />
        ) : null}
        <T style={styles.pillLabel} color={up || same ? colors.onLime : colors.onWine}>
          {text}
        </T>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.wine,
        { backgroundColor: colors.wineFill, padding: desktop ? 26 : spacing.xl, gap: 16 },
      ]}
    >
      <View
        style={
          desktop
            ? [styles.rowBetween, { gap: 10 }]
            : { alignItems: "flex-start", gap: spacing.sm }
        }
      >
        <T style={styles.heroTitle} color={colors.onWineMuted} accessibilityRole="header">
          {capitalize(monthName(now))} até hoje
        </T>
        {pill}
      </View>
      <View style={[styles.heroValues, { columnGap: desktop ? 36 : 20 }]}>
        <View style={{ gap: 2 }}>
          <T style={styles.heroLabel} color={colors.onWineMuted}>
            Vendi
          </T>
          <T style={valueStyle} color={colors.onWine}>
            {comparison ? heroMoney(comparison.current) : "…"}
          </T>
        </View>
        <View style={{ gap: 2 }}>
          <T style={styles.heroLabel} color={colors.onWineMuted}>
            Sobrou no bolso
          </T>
          <T style={valueStyle} color={colors.lime}>
            {valueOrState(finance, (data) => heroMoney(data.profit))}
          </T>
        </View>
      </View>
      <QueryNotice light query={history} label="as vendas do mês" />
      <QueryNotice light query={finance} label="entradas e despesas do mês" />
      {sales ? (
        <View style={[styles.heroWeek, { borderColor: colors.wineDivider }]}>
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <T style={styles.heroLabel} color={colors.onWineMuted}>
              Esta semana
            </T>
            {best ? (
              <T style={styles.heroLabel} color={colors.onWineMuted}>
                <Text style={[styles.heroLabelStrong, { color: colors.onWine }]}>
                  {best}
                </Text>{" "}
                é o seu melhor dia
              </T>
            ) : null}
          </View>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Vendas por dia nesta semana. ${bars
              .filter((bar) => !bar.future)
              .map((bar) => `${bar.label}: ${money(bar.total)}`)
              .join(", ")}`}
            style={styles.bars}
          >
            {bars.map((bar) => (
              <View key={bar.day} style={[styles.barCol, { height: barHeight + 26 }]}>
                <View
                  style={{
                    width: "100%",
                    maxWidth: 34,
                    height: Math.max(4, Math.round((bar.total / max) * barHeight)),
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    borderBottomLeftRadius: 3,
                    borderBottomRightRadius: 3,
                    backgroundColor: bar.today ? colors.lime : colors.wineBar,
                  }}
                />
                <T
                  style={bar.today ? styles.barLabelToday : styles.barLabel}
                  color={colors.onWineMuted}
                >
                  {bar.label}
                </T>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function StatBox({ label, value }: Readonly<{ label: string; value: string }>) {
  const colors = useHomeColors();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface }]}>
      <T style={styles.caption} color={colors.muted}>
        {label}
      </T>
      <T style={styles.statValue}>{value}</T>
    </View>
  );
}

export function HomeHabitGoal({
  history,
  goal,
  now,
  full,
  onEditGoal,
}: Readonly<{
  history: Query<SalesPage>;
  goal: Query<ProlaboreStatus>;
  now: Date;
  full: boolean;
  onEditGoal: () => void;
}>) {
  const colors = useHomeColors();
  const sales = history.data?.items;
  const streak = sales ? salesStreak(sales, now) : 0;
  const month = monthName(now);
  const config = goal.data?.config;
  const progress = goal.data?.progress;
  const pace =
    progress && config
      ? goalPace({
          currentRevenue: progress.currentRevenue,
          requiredRevenue: progress.requiredRevenue,
          now,
        })
      : undefined;
  let goalCaption = "Você bateu a meta de entradas deste mês.";
  if (progress && !progress.reached) {
    const days = pace?.daysLeft ?? 0;
    goalCaption = `Faltam ${heroMoney(Math.max(0, progress.remainingRevenue))} em entradas em ${days} ${days === 1 ? "dia" : "dias"}.`;
    if (pace?.onTrack) goalCaption += " No ritmo atual, você chega lá.";
  }
  let streakTitle = "Anote a venda de hoje";
  let streakDetail = "e comece uma nova sequência.";
  if (streak > 0) {
    streakTitle = `${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}`;
    streakDetail = "anotando vendas.";
  }
  return (
    <HomeCard
      style={[
        { padding: full ? 22 : 18, gap: full ? 14 : spacing.md },
        full ? { flex: 2 } : null,
      ]}
    >
      <View style={[styles.row, { gap: spacing.md }]}>
        <IconBox name="flame-outline" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T style={styles.h3} accessibilityRole="header">
            {sales ? streakTitle : "Sua sequência"}
          </T>
          <T style={styles.caption15} color={colors.muted}>
            {sales ? streakDetail : "carregando…"}
          </T>
        </View>
      </View>
      {full && sales ? (
        <>
          <Segments
            label="Dias com venda na última semana"
            filled={lastSevenDays(sales, now)}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <StatBox
              label="Vendas no mês"
              value={formatIntBR(salesInMonth(sales, now).length)}
            />
            <StatBox
              label="Clientes que voltaram"
              value={formatIntBR(returningClients(sales, now))}
            />
          </View>
        </>
      ) : null}
      <View
        style={[
          { gap: spacing.sm },
          full && {
            marginTop: "auto",
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        <QueryNotice query={goal} label="sua meta" />
        {goal.data && config && progress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Meta de ${month}: ${money(progress.currentRevenue)} de ${money(progress.requiredRevenue)} em entradas. Editar meta`}
            onPress={onEditGoal}
            style={({ pressed }) => ({ gap: spacing.sm, opacity: pressed ? 0.75 : 1 })}
          >
            <View style={[styles.rowBetween, { alignItems: "baseline" }]}>
              <T style={styles.sectionTitle}>Meta de {month}</T>
              <T style={styles.goalValue} color={colors.muted}>
                {heroMoney(progress.currentRevenue)} de{" "}
                {heroMoney(progress.requiredRevenue)}
              </T>
            </View>
            <ProgressBar
              pct={progress.progressPct}
              label={`Progresso da meta de ${month}`}
            />
            <T style={styles.caption15} color={colors.muted}>
              {goalCaption}
            </T>
          </Pressable>
        ) : null}
        {goal.data && !config ? (
          <View style={{ gap: 2 }}>
            <T style={styles.sectionTitle}>Meta de {month}</T>
            <T style={styles.caption15} color={colors.muted}>
              Defina quanto quer retirar por mês para acompanhar as entradas.
            </T>
            <GhostLink label="Definir meta" onPress={onEditGoal} />
          </View>
        ) : null}
      </View>
    </HomeCard>
  );
}

export function HomeChampions({
  history,
  products,
  now,
  style,
}: Readonly<{
  history: Query<SalesPage>;
  products: Query<ProductsPage>;
  now: Date;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useHomeColors();
  const router = useRouter();
  const champions =
    history.data && products.data
      ? monthChampions(history.data.items, costLookup(products.data.items), now)
      : undefined;
  return (
    <HomeCard style={[{ padding: spacing.xl, gap: 4 }, style]}>
      <View style={styles.rowBetween}>
        <T style={styles.sectionTitle} accessibilityRole="header">
          Campeões do mês
        </T>
        <GhostLink small label="Relatório" onPress={() => router.push("/insights")} />
      </View>
      <QueryNotice query={history} label="as vendas do mês" />
      {history.data ? (
        <QueryNotice query={products} label="os custos dos produtos" />
      ) : null}
      {champions && champions.length === 0 ? (
        <View style={{ gap: 2, paddingTop: spacing.sm }}>
          <T style={styles.caption15} color={colors.muted}>
            Cadastre o custo dos produtos para ver quais dão mais lucro.
          </T>
          <GhostLink label="Ver produtos" onPress={() => router.push("/products")} />
        </View>
      ) : null}
      {champions?.map((champion, index) => (
        <View
          key={champion.productId}
          style={[styles.listRow, { borderColor: colors.border }]}
        >
          <View
            style={[
              styles.rank,
              { backgroundColor: index === 0 ? colors.wineFill : colors.surface },
            ]}
          >
            <T style={styles.rankLabel} color={index === 0 ? colors.onWine : colors.text}>
              {index + 1}
            </T>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T style={styles.bodyBold} numberOfLines={2}>
              {displayProductName(champion.name)}
            </T>
            <T style={styles.caption} color={colors.muted}>
              {formatIntBR(champion.quantity)}{" "}
              {champion.quantity === 1 ? "vendido" : "vendidos"}
            </T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T style={styles.bodyStrong} color={colors.green}>
              {heroMoney(champion.profit)}
            </T>
            <T style={styles.tileNote} color={colors.muted}>
              de lucro
            </T>
          </View>
        </View>
      ))}
    </HomeCard>
  );
}

export function HomeFiado({ style }: Readonly<{ style?: StyleProp<ViewStyle> }>) {
  const colors = useHomeColors();
  const router = useRouter();
  const pending = useHomePendingSales();
  const receipts = pending.data ? pendingReceipts(pending.data.items) : undefined;
  const groups = pending.data ? groupFiados(pending.data.items).slice(0, 2) : [];
  const now = new Date();
  return (
    <HomeCard style={[{ padding: spacing.xl, gap: 4 }, style]}>
      <View style={[styles.rowBetween, { minHeight: 40 }]}>
        <T style={styles.sectionTitle} accessibilityRole="header">
          Fiado para receber
        </T>
        {receipts ? (
          <T style={styles.bodyStrong} color={colors.strong}>
            {money(receipts.total)}
          </T>
        ) : null}
      </View>
      <QueryNotice query={pending} label="o fiado a receber" />
      {receipts && receipts.count === 0 ? (
        <T style={[styles.caption15, { paddingTop: spacing.sm }]} color={colors.muted}>
          Ninguém está devendo. Tudo recebido.
        </T>
      ) : null}
      {groups.map((group) => {
        const oldest = group.sales.reduce(
          (min, sale) => (sale.soldAt < min.soldAt ? sale : min),
          group.sales[0],
        );
        const days = daysSince(oldest.soldAt, now);
        let since = `há ${days} dias`;
        if (days === 0) since = "hoje";
        else if (days === 1) since = "há 1 dia";
        return (
          <View
            key={group.clientId ?? "avulso"}
            style={[styles.listRow, { borderColor: colors.border }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.softRose }]}>
              <T style={styles.bodyStrong} color={colors.wine}>
                {group.clientName.charAt(0).toUpperCase()}
              </T>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T style={styles.bodyBold} numberOfLines={1}>
                {group.clientName}
              </T>
              <T style={styles.caption} color={colors.muted}>
                {since}
              </T>
            </View>
            <T style={styles.bodyStrong}>{money(group.total)}</T>
          </View>
        );
      })}
      {receipts && receipts.count > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Abre a lista de fiado para mandar a cobrança"
          onPress={() => router.push("/fiado")}
          style={({ pressed }) => [
            styles.whatsapp,
            {
              borderColor: colors.border,
              backgroundColor: colors.white,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <AppIcon name="logo-whatsapp" size={18} color={colors.green} />
          <T style={styles.bodyBold} color={colors.green}>
            Cobrar pelo WhatsApp
          </T>
        </Pressable>
      ) : null}
    </HomeCard>
  );
}

export function HomePriceAlert({
  history,
  products,
  now,
  style,
}: Readonly<{
  history: Query<SalesPage>;
  products: Query<ProductsPage>;
  now: Date;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useHomeColors();
  const router = useRouter();
  if (!history.data || !products.data) return null;
  const alert = priceAlert(products.data.items, history.data.items, now);
  if (!alert) return null;
  const name = displayProductName(alert.name);
  const detail =
    alert.margin < 0
      ? `Cada venda de ${name} dá prejuízo de ${money(-alert.margin)}: o custo cadastrado passa do preço de ${money(alert.salePrice)}.`
      : `Cada venda de ${name} deixa ${money(alert.margin)}, só ${Math.round(alert.ratio * 100)}% do preço de ${money(alert.salePrice)}.`;
  return (
    <HomeCard style={[{ padding: spacing.xl, gap: 10 }, style]}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <IconBox name="notifications-outline" />
        <T style={[styles.sectionTitle, { flex: 1 }]} accessibilityRole="header">
          Hora de rever o preço de {name}
        </T>
      </View>
      <T style={styles.body} color={colors.muted}>
        {detail}
      </T>
      <View style={{ marginTop: "auto" }}>
        <GhostLink label="Recalcular o preço" onPress={() => router.push("/pricing")} />
      </View>
    </HomeCard>
  );
}
