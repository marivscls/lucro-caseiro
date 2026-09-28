import { spacing } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { paymentLabel } from "../../sales/payment";
import { useTodaySummary } from "../../sales/hooks";
import {
  costLookup,
  localDateKey,
  pendingReceipts,
  queryState,
  saleSummary,
  salesOnDay,
  salesProfit,
  validSales,
} from "../domain";
import { useHomePendingSales } from "../hooks";
import {
  GhostLink,
  HomeCard,
  money,
  QueryNotice,
  T,
  Tile,
  saleTime,
  useHomeColors,
  valueOrState,
  type ProductsPage,
  type Query,
  type SalesPage,
} from "./parts";
import { styles } from "./styles";

// ---------------------------------------------------------------------------
// Seu dia em números (fases 1 e 2)
// ---------------------------------------------------------------------------

export function HomeDayPreview({ desktop }: Readonly<{ desktop: boolean }>) {
  const colors = useHomeColors();
  const labels = desktop
    ? ["Vendido hoje", "Lucro hoje", "Fiado a receber"]
    : ["Vendido", "Lucro", "Fiado"];
  return (
    <HomeCard style={{ padding: desktop ? 18 : spacing.lg, gap: spacing.md }}>
      <View style={styles.rowBetween}>
        <T style={styles.sectionTitle} accessibilityRole="header">
          Seu dia em números
        </T>
        <T style={styles.caption} color={colors.muted}>
          aparece depois da 1ª venda
        </T>
      </View>
      <View style={[styles.tiles, !desktop && { gap: spacing.sm }]}>
        {labels.map((label) => (
          <Tile key={label} label={label} value="R$ 0,00" ghost compact={!desktop} />
        ))}
      </View>
    </HomeCard>
  );
}

export function HomeDayNumbers({
  desktop,
  history,
  products,
  now,
}: Readonly<{
  desktop: boolean;
  history: Query<SalesPage>;
  products: Query<ProductsPage>;
  now: Date;
}>) {
  const colors = useHomeColors();
  const router = useRouter();
  const today = useTodaySummary();
  const pending = useHomePendingSales();
  const todaySales = history.data
    ? salesOnDay(history.data.items, localDateKey(now))
    : undefined;
  const profit =
    todaySales && products.data
      ? salesProfit(todaySales, costLookup(products.data.items))
      : undefined;
  const profitQuery = {
    data: profit,
    isError: history.isError || products.isError,
    refetch: () => {
      history.refetch();
      products.refetch();
    },
  };
  const last = history.data ? validSales(history.data.items)[0] : undefined;
  const compact = !desktop;
  return (
    <HomeCard style={{ padding: desktop ? 18 : spacing.lg, gap: spacing.md }}>
      <View style={styles.rowBetween}>
        <T style={styles.sectionTitle} accessibilityRole="header">
          {desktop ? "Seu dia em números" : "Hoje"}
        </T>
        <GhostLink small label="Ver vendas" onPress={() => router.push("/tabs/sales")} />
      </View>
      <View style={[styles.tiles, !desktop && { gap: spacing.sm }]}>
        <Tile
          compact={compact}
          label={desktop ? "Vendido hoje" : "Vendido"}
          value={valueOrState(today, (data) => money(data.totalAmount))}
        />
        <Tile
          compact={compact}
          tone="green"
          label={desktop ? "Lucro hoje" : "Lucro"}
          value={valueOrState(profitQuery, (data) => money(data.amount))}
          note={profit && !profit.complete ? "Falta o custo de algum produto" : undefined}
        />
        <Tile
          compact={compact}
          label={desktop ? "Fiado a receber" : "Fiado"}
          value={valueOrState(pending, (data) =>
            money(pendingReceipts(data.items).total),
          )}
        />
      </View>
      <QueryNotice query={today} label="as vendas de hoje" />
      {queryState(profitQuery) !== "loading" ? (
        <QueryNotice query={profitQuery} label="o lucro de hoje" />
      ) : null}
      <QueryNotice query={pending} label="o fiado a receber" />
      {last ? (
        <View style={[styles.lastSale, { borderColor: colors.border }]}>
          <T style={styles.time} color={colors.muted}>
            {saleTime(last, now)}
          </T>
          <T style={styles.lastSaleName} numberOfLines={1}>
            {saleSummary(last)}
          </T>
          <View
            style={[
              styles.chip,
              {
                backgroundColor:
                  last.paymentMethod === "credit" ? colors.softRose : colors.greenBg,
              },
            ]}
          >
            <T
              style={styles.chipLabel}
              color={last.paymentMethod === "credit" ? colors.strong : colors.green}
            >
              {paymentLabel(last.paymentMethod)}
            </T>
          </View>
          <T style={styles.bodyStrong}>{money(last.total)}</T>
        </View>
      ) : null}
    </HomeCard>
  );
}
