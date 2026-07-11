import { formatCurrency } from "../../shared/utils/format";
import { Badge, Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import agendaDeliveries from "../../../assets/agenda-deliveries.png";

import { useBirthdays } from "../../features/clients/hooks";
import { useFinanceSummary } from "../../features/finance/hooks";
import { ProlaboreGoalForm } from "../../features/goals/components/prolabore-goal-form";
import { prolaboreMessage } from "../../features/goals/domain";
import { useProlaboreStatus } from "../../features/goals/hooks";
import { upcomingCount } from "../../features/orders/domain";
import { useOrders } from "../../features/orders/hooks";
import { useLowStockProducts, useProducts } from "../../features/products/hooks";
import { useSales, useTodaySummary } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { isProfilePremiumActive, useProfile } from "../../features/subscription/hooks";
import { AdBanner } from "../../shared/components/ad-banner";
import { useNotificationEnabled } from "../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { useOnboarding } from "../../shared/hooks/use-onboarding";
import { usePaywall } from "../../shared/hooks/use-paywall";

function getMonthName(): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[new Date().getMonth()] ?? "";
}

function getFormattedDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = getMonthName().toLowerCase();
  const year = now.getFullYear();
  const weekdays = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  return `${weekdays[now.getDay()]}, ${day} de ${month} de ${year}`;
}

/** Texto humano da contagem de vendas do dia (sem "(s)" de programador). */
function todaySalesLabel(count: number): string {
  if (count === 0) return "Nenhuma venda ainda. Bora registrar a primeira?";
  if (count === 1) return "1 venda registrada";
  return `${count} vendas registradas`;
}

function getCardStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  const isDark = theme.mode === "dark";
  return {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: isDark ? "rgba(245, 225, 219, 0.11)" : "rgba(74, 50, 40, 0.08)",
  };
}

function AvatarCircle({
  name,
  color,
  avatarUrl,
}: Readonly<{ name: string; color: string; avatarUrl?: string | null }>) {
  const { theme } = useTheme();
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.22)",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44 }} />
      ) : (
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          {initial}
        </Typography>
      )}
    </View>
  );
}

function ShortcutTile({
  icon,
  label,
  onPress,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          width: "48.5%",
          minWidth: 0,
          height: 60,
          borderRadius: radii.xl,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: spacing.sm,
          opacity: pressed ? 0.82 : 1,
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(44, 36, 32, 0.82)"
              : theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor:
            theme.mode === "dark"
              ? "rgba(245, 225, 219, 0.11)"
              : "rgba(74, 50, 40, 0.08)",
        },
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor:
            theme.mode === "dark"
              ? "rgba(245, 225, 219, 0.13)"
              : "rgba(74, 50, 40, 0.08)",
          backgroundColor:
            theme.mode === "dark" ? "rgba(255, 255, 255, 0.04)" : theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={21} color={theme.colors.primaryLight} />
      </View>
      <Typography
        variant="bodyBold"
        style={{ flex: 1, fontSize: 12, lineHeight: 15 }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const HOME_SHORTCUT_CATEGORIES = [
  {
    title: "Dia a dia",
    items: [
      { icon: "calendar-outline", label: "Agenda", route: "/agenda" },
      { icon: "wallet-outline", label: "Finanças", route: "/finance" },
      { icon: "bar-chart-outline", label: "Insights", route: "/insights" },
      { icon: "cash-outline", label: "Fiado", route: "/fiado" },
    ],
  },
  {
    title: "Vendas",
    items: [
      { icon: "cube-outline", label: "Produtos", route: "/products" },
      { icon: "reader-outline", label: "Orçamentos", route: "/quotes" },
      { icon: "storefront-outline", label: "Catálogo", route: "/catalog" },
      { icon: "cart-outline", label: "Compras", route: "/purchases" },
    ],
  },
  {
    title: "Produção",
    items: [
      { icon: "document-text-outline", label: "Receitas", route: "/recipes" },
      { icon: "flask-outline", label: "Insumos", route: "/materials" },
      { icon: "business-outline", label: "Fornecedores", route: "/suppliers" },
      { icon: "gift-outline", label: "Embalagens", route: "/packaging" },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { icon: "calculator-outline", label: "Precificação", route: "/pricing" },
      { icon: "repeat-outline", label: "Gastos fixos", route: "/recurring-expenses" },
      { icon: "pricetag-outline", label: "Rótulos", route: "/labels" },
      { icon: "settings-outline", label: "Configurações", route: "/settings" },
    ],
  },
] as const;

function MetricCard({
  title,
  amount,
  description,
  icon,
  tone,
  onPress,
}: Readonly<{
  title: string;
  amount: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "success" | "alert";
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const color = tone === "success" ? theme.colors.success : theme.colors.alert;
  const softColor = tone === "success" ? theme.colors.successBg : theme.colors.alertBg;

  return (
    <Card
      variant="surface"
      padding="lg"
      onPress={onPress}
      style={{
        ...getCardStyle(theme),
        flex: 1,
        minHeight: 170,
        borderColor: softColor,
      }}
    >
      <View style={{ flex: 1, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: radii.full,
              backgroundColor: softColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={icon} size={23} color={color} />
          </View>
          <Typography
            variant="label"
            color={color}
            style={{ flex: 1, fontSize: 11 }}
            numberOfLines={2}
          >
            {title}
          </Typography>
        </View>
        <Typography
          variant="moneyLg"
          color={color}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
        >
          {amount}
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ flex: 1, lineHeight: 18 }}
          numberOfLines={2}
        >
          {description}
        </Typography>
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.full,
              backgroundColor: softColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-forward" size={18} color={color} />
          </View>
        </View>
      </View>
    </Card>
  );
}

function ProgressRing({ value }: Readonly<{ value: number }>) {
  const { theme } = useTheme();
  const size = 86;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.surface}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (progress / 100) * circumference}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="bodyBold" color={theme.colors.primary}>
          {Math.round(progress)}%
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.primary}
          style={{ fontSize: 10 }}
        >
          da meta
        </Typography>
      </View>
    </View>
  );
}

function QuickCreateBar() {
  const router = useRouter();
  const { theme } = useTheme();
  const actions = [
    { icon: "add", label: "Nova venda", route: "/tabs/new-sale", active: true },
    { icon: "cube-outline", label: "Novo produto", route: "/products", active: false },
    {
      icon: "person-add-outline",
      label: "Novo cliente",
      route: "/tabs/clients",
      active: false,
    },
    { icon: "cash-outline", label: "Despesas", route: "/finance", active: false },
  ] as const;

  return (
    <View
      style={{
        ...getCardStyle(theme),
        flexDirection: "row",
        borderRadius: radii["2xl"],
        overflow: "hidden",
      }}
    >
      {actions.map((action, index) => (
        <Pressable
          key={action.label}
          onPress={() => router.push(action.route)}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 76,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xs,
            opacity: pressed ? 0.72 : 1,
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor:
              theme.mode === "dark"
                ? "rgba(245, 225, 219, 0.11)"
                : "rgba(74, 50, 40, 0.08)",
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: action.active ? radii.md : radii.full,
              backgroundColor: action.active ? theme.colors.primary : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={action.icon}
              size={24}
              color={
                action.active ? theme.colors.textOnPrimary : theme.colors.textSecondary
              }
            />
          </View>
          <Typography
            variant="caption"
            color={action.active ? theme.colors.primary : theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{ fontSize: 11 }}
          >
            {action.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

/** Passo do checklist "Comece por aqui": marca sozinho quando a pessoa conclui. */
function StartStep({
  done,
  index,
  label,
  onPress,
}: Readonly<{ done: boolean; index: number; label: string; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ checked: done }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 48,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: done ? theme.colors.success : "transparent",
          borderWidth: done ? 0 : 1.5,
          borderColor: theme.colors.primaryLight,
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={18} color={theme.colors.textOnPrimary} />
        ) : (
          <Typography variant="bodyBold" color={theme.colors.primaryLight}>
            {index}
          </Typography>
        )}
      </View>
      <Typography
        variant="bodyBold"
        numberOfLines={2}
        style={{ flex: 1, textDecorationLine: done ? "line-through" : "none" }}
        color={done ? theme.colors.textSecondary : theme.colors.text}
      >
        {label}
      </Typography>
      {!done && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
      )}
    </Pressable>
  );
}

/** Onboarding leve da home: 2 passos pra ativar o usuário novo (estilo Kyte). */
function GettingStartedCard({
  hasProduct,
  hasSale,
  onDismiss,
}: Readonly<{ hasProduct: boolean; hasSale: boolean; onDismiss: () => void }>) {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Card
      variant="surface"
      padding="xl"
      style={{
        ...getCardStyle(theme),
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            flex: 1,
          }}
        >
          <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
          <Typography variant="h3">Comece por aqui</Typography>
        </View>
        <Pressable
          onPress={onDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Pular o guia"
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Typography variant="bodyBold" color={theme.colors.textSecondary}>
            Pular
          </Typography>
        </Pressable>
      </View>
      <Typography variant="caption">
        Dois passos rápidos pra deixar tudo pronto.
      </Typography>
      <View>
        <StartStep
          done={hasProduct}
          index={1}
          label="Cadastre seu primeiro produto"
          onPress={() => router.push("/products")}
        />
        <StartStep
          done={hasSale}
          index={2}
          label="Registre sua primeira venda"
          onPress={() => router.push("/tabs/new-sale")}
        />
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const { data: todaySummary, isLoading: loadingSales } = useTodaySummary();
  const { data: prolaboreData, isLoading: loadingGoal } = useProlaboreStatus();
  const { data: birthdays } = useBirthdays();
  const { data: lowStockProducts } = useLowStockProducts();
  // ponytail: checklist de ativação reusa as listas (cacheadas) de produtos/vendas
  // pra saber se cada passo já foi feito; um endpoint de contagem dedicado seria
  // mais barato se a home ficar pesada.
  const { data: productsData, isLoading: loadingProducts } = useProducts();
  const { data: salesData, isLoading: loadingSalesList } = useSales();
  const dismissedGettingStarted = useOnboarding((s) => s.dismissedGettingStarted);
  const dismissGettingStarted = useOnboarding((s) => s.dismissGettingStarted);
  const lowStockEnabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);
  const birthdaysEnabled = useNotificationEnabled(NOTIFICATION_TYPES.CLIENT_BIRTHDAY);
  const { data: orders } = useOrders();
  const { data: financeSummary } = useFinanceSummary();
  const monthProfit = financeSummary?.profit ?? 0;
  const upcomingDeliveries = orders ? upcomingCount(orders, new Date()) : 0;
  const hasSalesToday = (todaySummary?.totalSales ?? 0) > 0;
  const isPremium = isProfilePremiumActive(profile);
  const birthdayCount = birthdays?.length ?? 0;

  const hasProduct = (productsData?.items?.length ?? 0) > 0;
  const hasSale = (salesData?.items?.length ?? 0) > 0;
  const startSettled = !loadingProducts && !loadingSalesList;
  const startDone = hasProduct && hasSale;
  const showGettingStarted = !dismissedGettingStarted && startSettled && !startDone;

  // Concluiu os dois passos → fecha o guia pra sempre (sem reaparecer).
  useEffect(() => {
    if (!dismissedGettingStarted && startSettled && startDone) {
      dismissGettingStarted();
    }
  }, [dismissedGettingStarted, startSettled, startDone, dismissGettingStarted]);

  const isLoading = loadingSales || loadingGoal;
  const firstName = profile?.name?.trim().split(/\s+/)[0] ?? "Maria";
  const cardStyle = getCardStyle(theme);
  const goalConfig = prolaboreData?.config;
  const goalProgress = prolaboreData?.progress;

  const goalModal = (
    <Modal
      visible={showGoalForm}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowGoalForm(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            padding: spacing.lg,
          }}
        >
          <Pressable onPress={() => setShowGoalForm(false)}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
        </View>
        <ProlaboreGoalForm
          config={goalConfig ?? null}
          onSuccess={() => setShowGoalForm(false)}
        />
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: 0,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: spacing.md,
          }}
        >
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Typography variant="h1" serif>
                Olá, {firstName}!
              </Typography>
              <Ionicons name="heart" size={20} color={theme.colors.primaryLight} />
            </View>
            <Typography variant="body" style={{ marginTop: spacing.xs }}>
              {getFormattedDate()}
            </Typography>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Minha conta"
          >
            <AvatarCircle
              name={profile?.name ?? firstName}
              color={theme.colors.primary}
              avatarUrl={profile?.avatarUrl}
            />
          </Pressable>
        </View>

        <LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />

        {showGettingStarted && (
          <GettingStartedCard
            hasProduct={hasProduct}
            hasSale={hasSale}
            onDismiss={dismissGettingStarted}
          />
        )}

        <AdBanner size="banner" />

        <View style={{ gap: spacing.sm }}>
          <Typography variant="label">ACESSO RÁPIDO</Typography>
          {HOME_SHORTCUT_CATEGORIES.map((category) => (
            <View key={category.title} style={{ gap: spacing.sm }}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {category.title}
              </Typography>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                }}
              >
                {category.items.map((item) => (
                  <ShortcutTile
                    key={item.route}
                    icon={item.icon}
                    label={item.label}
                    onPress={() => router.push(item.route)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["2xl"] }}
          />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <MetricCard
                title="VENDAS DE HOJE"
                amount={formatCurrency(todaySummary?.totalAmount ?? 0)}
                description={todaySalesLabel(todaySummary?.totalSales ?? 0)}
                icon="bag-handle-outline"
                tone="success"
                onPress={() =>
                  router.push(hasSalesToday ? "/tabs/sales" : "/tabs/new-sale")
                }
              />
              <MetricCard
                title={`LUCRO EM ${getMonthName().toUpperCase()}`}
                amount={formatCurrency(monthProfit)}
                description={`${formatCurrency(financeSummary?.totalIncome ?? 0)} entradas\n${formatCurrency(financeSummary?.totalExpenses ?? 0)} despesas`}
                icon="trending-up-outline"
                tone={monthProfit >= 0 ? "success" : "alert"}
                onPress={() => router.push("/finance")}
              />
            </View>

            {upcomingDeliveries > 0 && (
              <Card
                variant="surface"
                padding="lg"
                onPress={() => router.push("/agenda")}
                style={cardStyle}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radii.full,
                      backgroundColor: theme.colors.alertBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="calendar" size={25} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3">Agenda</Typography>
                    <Typography variant="caption" numberOfLines={3}>
                      {upcomingDeliveries === 1
                        ? "1 entrega próxima (hoje/amanhã ou atrasada)"
                        : `${upcomingDeliveries} entregas próximas (hoje/amanhã ou atrasadas)`}
                    </Typography>
                  </View>
                  <Image
                    source={agendaDeliveries}
                    resizeMode="contain"
                    style={{ width: 82, height: 70 }}
                  />
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
              </Card>
            )}

            <View style={{ gap: spacing.md }}>
              <Card
                variant="surface"
                padding="lg"
                onPress={() => setShowGoalForm(true)}
                style={cardStyle}
              >
                <View style={{ gap: spacing.lg }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="label" color={theme.colors.primary}>
                      META DO MÊS
                    </Typography>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radii.md,
                        backgroundColor: theme.colors.alertBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={21}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View style={{ flex: 1, gap: spacing.sm }}>
                      <Typography
                        variant="moneyLg"
                        color={
                          goalProgress?.reached ? theme.colors.success : theme.colors.text
                        }
                      >
                        {formatCurrency(goalProgress?.currentRevenue ?? 0)}
                      </Typography>
                      <Typography variant="caption">
                        de {formatCurrency(goalProgress?.requiredRevenue ?? 3000)}{" "}
                        necessários
                      </Typography>
                    </View>
                    <ProgressRing value={goalProgress?.progressPct ?? 0} />
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: radii.full,
                      backgroundColor: theme.colors.surface,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(Math.max(goalProgress?.progressPct ?? 0, 1), 100)}%`,
                        height: "100%",
                        borderRadius: radii.full,
                        backgroundColor: goalProgress?.reached
                          ? theme.colors.success
                          : theme.colors.primary,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons
                      name="locate-outline"
                      size={22}
                      color={
                        goalProgress?.reached
                          ? theme.colors.success
                          : theme.colors.primary
                      }
                    />
                    <Typography
                      variant="bodyBold"
                      color={
                        goalProgress?.reached
                          ? theme.colors.success
                          : theme.colors.primary
                      }
                      style={{ flex: 1 }}
                    >
                      {goalProgress
                        ? prolaboreMessage(goalProgress)
                        : "Defina sua meta do mês"}
                    </Typography>
                  </View>
                </View>
              </Card>

              {lowStockEnabled && (
                <Card
                  variant="surface"
                  padding="lg"
                  onPress={() => router.push("/products")}
                  style={cardStyle}
                >
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: spacing.sm,
                      }}
                    >
                      <Typography variant="label" color={theme.colors.primary}>
                        ESTOQUE BAIXO
                      </Typography>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Typography variant="caption" color={theme.colors.primary}>
                          Ver todos
                        </Typography>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={theme.colors.primaryLight}
                        />
                      </View>
                    </View>

                    {lowStockProducts && lowStockProducts.length > 0 ? (
                      lowStockProducts.slice(0, 3).map((product, index) => (
                        <View
                          key={product.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.md,
                            paddingVertical: spacing.sm,
                            borderBottomWidth: index === 2 ? 0 : 1,
                            borderBottomColor:
                              theme.mode === "dark"
                                ? "rgba(245, 225, 219, 0.08)"
                                : "rgba(74, 50, 40, 0.08)",
                          }}
                        >
                          {product.photoUrl ? (
                            <Image
                              source={{ uri: product.photoUrl }}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: radii.md,
                                backgroundColor: theme.colors.surface,
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: radii.md,
                                backgroundColor: theme.colors.surface,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography variant="bodyBold" color={theme.colors.primary}>
                                {product.name.charAt(0).toUpperCase()}
                              </Typography>
                            </View>
                          )}
                          <Typography
                            variant="bodyBold"
                            style={{ flex: 1 }}
                            numberOfLines={2}
                          >
                            {product.name}
                          </Typography>
                          <View
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: radii.full,
                              backgroundColor:
                                product.stockQuantity === 0
                                  ? theme.colors.alertBg
                                  : theme.colors.yellowBg,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color={
                                product.stockQuantity === 0
                                  ? theme.colors.alert
                                  : theme.colors.yellow
                              }
                              numberOfLines={1}
                            >
                              {product.stockQuantity === 0
                                ? "Sem estoque"
                                : `${product.stockQuantity} un.`}
                            </Typography>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={34}
                          color={theme.colors.textSecondary}
                        />
                        <Typography
                          variant="caption"
                          style={{ marginTop: spacing.sm, textAlign: "center" }}
                        >
                          Nenhum produto em alerta
                        </Typography>
                      </View>
                    )}
                  </View>
                </Card>
              )}
            </View>

            {birthdayCount > 0 && isPremium && birthdaysEnabled && birthdays && (
              <Card
                variant="surface"
                padding="xl"
                style={{
                  ...cardStyle,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.premium,
                }}
              >
                <Typography
                  variant="h3"
                  color={theme.colors.premium}
                  style={{ marginBottom: spacing.sm }}
                >
                  Aniversariantes do mês
                </Typography>
                {birthdays.map((client) => (
                  <Typography
                    key={client.id}
                    variant="body"
                    color={theme.colors.text}
                    style={{ marginTop: spacing.xs }}
                  >
                    {client.name} - {client.birthday}
                  </Typography>
                ))}
              </Card>
            )}

            {birthdayCount > 0 && !isPremium && (
              <Card
                variant="surface"
                padding="xl"
                onPress={() => showPaywall("birthdays")}
                style={{
                  ...cardStyle,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.premium,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Typography variant="h3" color={theme.colors.premium}>
                    Aniversariantes do mês
                  </Typography>
                  <Badge label="Premium" variant="premium" />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="lock-closed" size={18} color={theme.colors.premium} />
                  <Typography
                    variant="body"
                    color={theme.colors.text}
                    style={{ flex: 1 }}
                  >
                    {birthdayCount === 1
                      ? "1 cliente faz aniversário este mês"
                      : `${birthdayCount} clientes fazem aniversário este mês`}
                  </Typography>
                </View>
                <Typography
                  variant="bodyBold"
                  color={theme.colors.primaryLight}
                  style={{ marginTop: spacing.sm }}
                >
                  Desbloqueie pra ver e parabenizar →
                </Typography>
              </Card>
            )}

            <QuickCreateBar />

            {goalModal}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
