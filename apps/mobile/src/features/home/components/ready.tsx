import { spacing, radii } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  SETUP_ORDER,
  costLookup,
  saleProfit,
  salesProfit,
  validSales,
  HOME_HISTORY_DAYS_FOR_MONTH,
} from "../domain";
import {
  HomeCard,
  money,
  IconBox,
  QueryNotice,
  Segments,
  T,
  useHomeColors,
  type ProductsPage,
  type Query,
  type SalesPage,
} from "./parts";
import { styles } from "./styles";
import { STEP_COPY } from "./setup";

// ---------------------------------------------------------------------------
// Fase 2 — tudo pronto
// ---------------------------------------------------------------------------

export function HomeReadyBanner({
  firstName,
  history,
  products,
  desktop,
}: Readonly<{
  firstName?: string;
  history: Query<SalesPage>;
  products: Query<ProductsPage>;
  desktop: boolean;
}>) {
  const colors = useHomeColors();
  const sales = history.data ? validSales(history.data.items) : undefined;
  const costs = products.data ? costLookup(products.data.items) : undefined;
  let message: React.ReactNode = null;
  if (sales && costs && sales.length > 0) {
    const first = sales[sales.length - 1];
    const profit =
      sales.length === 1 ? saleProfit(first, costs) : salesProfit(sales, costs);
    const lead = sales.length === 1 ? "Sua primeira venda" : "Suas vendas";
    message =
      profit.complete || profit.amount > 0 ? (
        <>
          {lead} {sales.length === 1 ? "deixou" : "já deixaram"}{" "}
          <Text style={[styles.bannerStrong, { color: colors.lime }]}>
            {money(profit.amount)}
          </Text>{" "}
          no seu bolso.
        </>
      ) : (
        <>
          {lead} {sales.length === 1 ? "foi de" : "somam"}{" "}
          <Text style={[styles.bannerStrong, { color: colors.lime }]}>
            {money(sales.reduce((sum, sale) => sum + sale.total, 0))}
          </Text>
          .
        </>
      );
  }
  return (
    <View
      style={[
        styles.wine,
        { backgroundColor: colors.wineFill, padding: desktop ? 26 : spacing.xl },
      ]}
    >
      <View style={[styles.row, { gap: spacing.lg }]}>
        <View
          style={[
            styles.center,
            {
              width: desktop ? 60 : 52,
              height: desktop ? 60 : 52,
              borderRadius: radii.full,
              backgroundColor: colors.lime,
            },
          ]}
        >
          <AppIcon
            name="checkmark-outline"
            size={desktop ? 30 : 26}
            color={colors.onLime}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <T
            style={desktop ? styles.bannerTitleDesk : styles.bannerTitle}
            color={colors.onWine}
            accessibilityRole="header"
          >
            {firstName ? `Tudo pronto, ${firstName}!` : "Tudo pronto!"}
          </T>
          {message ? (
            <T style={styles.bannerBody} color={colors.onWineMuted}>
              {message}
            </T>
          ) : (
            <QueryNotice
              light
              query={(history.data ? products : history) as Query<unknown>}
              label="sua primeira venda"
            />
          )}
        </View>
      </View>
      <View
        style={[
          styles.bannerSteps,
          { borderColor: colors.wineDivider, flexDirection: desktop ? "row" : "column" },
        ]}
      >
        {SETUP_ORDER.map((id) => (
          <View key={id} style={[styles.row, { gap: 6 }]}>
            <AppIcon name="checkmark-outline" size={16} color={colors.lime} />
            <T style={styles.bannerStep} color={colors.onWineMuted}>
              {STEP_COPY[id].title}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

export function HomeStreakCard({
  activeDays,
  desktop,
}: Readonly<{ activeDays: number; desktop: boolean }>) {
  const colors = useHomeColors();
  const days = Math.min(activeDays, HOME_HISTORY_DAYS_FOR_MONTH);
  return (
    <HomeCard
      soft
      style={[{ padding: 22, gap: spacing.md }, desktop ? { flex: 2 } : null]}
    >
      <View style={[styles.row, { gap: spacing.md }]}>
        <IconBox name="flame-outline" filled />
        <T style={styles.h3} accessibilityRole="header">
          {activeDays <= 1 ? "Seu 1º dia anotando" : `${activeDays} dias anotando`}
        </T>
      </View>
      <T style={styles.body} color={colors.muted}>
        {activeDays <= 1
          ? "Anote amanhã também e comece uma sequência. "
          : "Continue anotando nos próximos dias. "}
        Com 7 dias, o Início mostra o produto que mais te dá lucro.
      </T>
      <Segments
        label={`${days} de 7 dias com venda`}
        filled={Array.from({ length: 7 }, (_, index) => index < days)}
      />
      <T style={styles.bodyBold} color={colors.strong}>
        {days} de 7 dias
      </T>
    </HomeCard>
  );
}

export function HomeNextIdeas({
  columns,
  hasGoal,
  onGoal,
}: Readonly<{ columns: number; hasGoal: boolean; onGoal: () => void }>) {
  const colors = useHomeColors();
  const router = useRouter();
  const ideas: {
    icon: AppIconName;
    title: string;
    detail: string;
    onPress: () => void;
  }[] = [
    {
      icon: "cube-outline",
      title: "Cadastrar mais produtos",
      detail: "Quanto mais produtos, mais rápido anotar.",
      onPress: () => router.push("/products"),
    },
    hasGoal
      ? {
          icon: "bar-chart-outline",
          title: "Ver seus resultados",
          detail: "Gráficos do mês e o que mais vende.",
          onPress: () => router.push("/insights"),
        }
      : {
          icon: "flame-outline",
          title: "Definir a meta do mês",
          detail: "Ver o quanto falta motiva a vender.",
          onPress: onGoal,
        },
    {
      icon: "chatbubble-ellipses-outline",
      title: "Montar seu catálogo",
      detail: "Um link para mandar no WhatsApp.",
      onPress: () => router.push("/catalog"),
    },
  ];
  return (
    <View style={{ gap: 10 }}>
      <T style={styles.sectionTitle} accessibilityRole="header">
        Quando quiser, dá para ir além
      </T>
      <View style={{ flexDirection: columns > 1 ? "row" : "column", gap: 10 }}>
        {ideas.map((idea) => (
          <Pressable
            key={idea.title}
            accessibilityRole="button"
            onPress={idea.onPress}
            style={({ pressed }) => [
              styles.idea,
              {
                borderColor: colors.border,
                backgroundColor: colors.white,
                opacity: pressed ? 0.75 : 1,
              },
              columns > 1 ? { flex: 1 } : null,
            ]}
          >
            <IconBox name={idea.icon} size={42} />
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <T style={styles.bodyBold}>{idea.title}</T>
              <T style={styles.caption} color={colors.muted}>
                {idea.detail}
              </T>
            </View>
            <AppIcon name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
