import { formatCurrency } from "../../shared/utils/format";
import { hasActiveFeature, type Client } from "@lucro-caseiro/contracts";
import {
  Card,
  colors,
  fontSizes,
  iconSizes,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import agendaDeliveries from "../../../assets/agenda-deliveries.png";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useBirthdays } from "../../features/clients/hooks";
import { isBirthdayToday } from "../../features/clients/use-birthday-notifier";
import { useFinanceSummary } from "../../features/finance/hooks";
import { ProlaboreGoalForm } from "../../features/goals/components/prolabore-goal-form";
import { prolaboreMessage } from "../../features/goals/domain";
import { useProlaboreStatus } from "../../features/goals/hooks";
import { upcomingCount } from "../../features/orders/domain";
import { useOrders } from "../../features/orders/hooks";
import { useLowStockProducts, useProducts } from "../../features/products/hooks";
import { useSales, useTodaySummary } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimits, useProfile } from "../../features/subscription/hooks";
import { getLimitBannerState } from "../../features/subscription/limits";
import { AdBanner } from "../../shared/components/ad-banner";
import { ListCard, ListCardItem } from "../../shared/components/list-card";
import { ResponsiveModal } from "../../shared/components/responsive-modal-surface";
import { useNotificationEnabled } from "../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../shared/hooks/notification-types";
import { useOnboarding } from "../../shared/hooks/use-onboarding";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";

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
  return {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };
}

function AvatarCircle({
  name,
  avatarUrl,
}: Readonly<{ name: string; avatarUrl?: string | null }>) {
  const { theme } = useTheme();
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const pastel = avatarPastel(name || "?", theme.mode);

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: pastel.bg,
        borderWidth: 1,
        borderColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44 }} />
      ) : (
        <Typography variant="bodyBold" color={pastel.fg}>
          {initial}
        </Typography>
      )}
    </View>
  );
}

const BIRTHDAYS_PREVIEW_COUNT = 5;

/** Extrai o dia (1-31) de uma data ISO `YYYY-MM-DD` sem risco de fuso horário. */
function birthdayDayOfMonth(birthday: string | null): number | null {
  if (!birthday) return null;
  const parts = birthday.split("T")[0].split("-");
  if (parts.length < 3) return null;
  const day = Number(parts[2]);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
}

/** Texto da pílula de data de cada aniversariante. */
function birthdayPillLabel(isToday: boolean, day: number | null): string {
  if (isToday) return "Hoje 🎉";
  if (day === null) return "—";
  return `dia ${day}`;
}

function BirthdaysCard({
  clients,
  cardStyle,
}: Readonly<{ clients: Client[]; cardStyle: ViewStyle }>) {
  const { theme } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const today = new Date();
  const visibleClients = showAll ? clients : clients.slice(0, BIRTHDAYS_PREVIEW_COUNT);
  const hasOverflow = clients.length > BIRTHDAYS_PREVIEW_COUNT;

  return (
    <ListCard
      title="Aniversariantes do mês"
      icon="gift-outline"
      iconColor={theme.colors.premium}
      iconBg={theme.colors.premiumBg}
      badge={String(clients.length)}
      badgeVariant="premium"
      style={cardStyle}
      footer={
        hasOverflow ? (
          <Pressable
            onPress={() => setShowAll((current) => !current)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography variant="bodyBold" color={theme.colors.primary}>
              {showAll ? "Ver menos" : `Ver todos os ${clients.length}`}
            </Typography>
            <Ionicons
              name={showAll ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.primary}
            />
          </Pressable>
        ) : undefined
      }
    >
      {visibleClients.map((client, index) => {
        const isToday = isBirthdayToday(client.birthday, today);
        const day = birthdayDayOfMonth(client.birthday);
        return (
          <ListCardItem
            key={client.id}
            first={index === 0}
            style={{ paddingVertical: spacing.sm }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <AvatarCircle name={client.name} />
              <Typography
                variant="bodyBold"
                color={theme.colors.text}
                style={{ flex: 1 }}
                numberOfLines={1}
              >
                {client.name}
              </Typography>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: isToday
                    ? theme.colors.premiumBg
                    : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={isToday ? theme.colors.premium : theme.colors.textSecondary}
                  numberOfLines={1}
                >
                  {birthdayPillLabel(isToday, day)}
                </Typography>
              </View>
            </View>
          </ListCardItem>
        );
      })}
    </ListCard>
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
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={iconSizes.md} color={theme.colors.textSecondary} />
      </View>
      <Typography
        variant="bodyBold"
        style={{ flex: 1, fontSize: fontSizes.xs, lineHeight: 17 }}
        numberOfLines={1}
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
      {
        icon: "calendar-outline",
        label: "Agenda",
        route: "/tabs/agenda",
        feature: "agendamento",
      },
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
      {
        icon: "document-text-outline",
        label: "Receitas",
        route: "/recipes",
        feature: "fichaTecnica",
      },
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

/**
 * Hero "profissional quente": o momento de valor da home em cartao NEUTRO —
 * o rosa aparece so no label e no CTA (a unica peca preenchida da viewport),
 * modelo Airbnb. Acao primaria (Nova venda) sempre no topo, ao alcance.
 */
function HeroTodayCard({
  amount,
  salesLabel,
  saleActionLabel,
  hasSales,
  onOpenSales,
  onNewSale,
}: Readonly<{
  amount: string;
  salesLabel: string;
  saleActionLabel: string;
  hasSales: boolean;
  onOpenSales: () => void;
  onNewSale: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={hasSales ? onOpenSales : onNewSale}
      accessibilityRole="button"
      accessibilityLabel={`Vendas de hoje, ${amount}. ${salesLabel}`}
      style={({ pressed }) => [
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radii["2xl"],
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: spacing["2xl"],
          opacity: pressed ? 0.95 : 1,
        },
        theme.shadows.sm,
      ]}
    >
      <Typography variant="label" color={theme.colors.primaryStrong}>
        VENDAS DE HOJE
      </Typography>
      <Typography
        variant="moneyHero"
        color={theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        style={{ marginTop: spacing.xs }}
      >
        {amount}
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ marginTop: spacing.xs }}
      >
        {salesLabel}
      </Typography>
      <Pressable
        onPress={onNewSale}
        accessibilityRole="button"
        accessibilityLabel={saleActionLabel}
        style={({ pressed }) => ({
          marginTop: spacing.lg,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: theme.colors.primaryInteractive,
          borderRadius: radii.full,
          paddingHorizontal: spacing.xl,
          minHeight: 48,
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name="add" size={iconSizes.sm} color={colors.textOnPrimary} />
        <Typography variant="bodyBold" color={colors.textOnPrimary}>
          {saleActionLabel}
        </Typography>
      </Pressable>
    </Pressable>
  );
}

/** Lucro do mes em uma linha compacta — numero tabular, tom serio de dinheiro. */
function LucroHighlightCard({
  monthName,
  amount,
  income,
  expenses,
  onPress,
}: Readonly<{
  monthName: string;
  amount: string;
  income: string;
  expenses: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const negative = amount.trim().startsWith("-");
  const tone = negative ? theme.colors.alert : theme.colors.success;
  const toneBg = negative ? theme.colors.alertBg : theme.colors.successBg;
  return (
    <Card
      variant="surface"
      padding="lg"
      onPress={onPress}
      style={{ ...getCardStyle(theme), borderColor: toneBg }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radii.full,
            backgroundColor: toneBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trending-up-outline" size={iconSizes.md} color={tone} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="label" color={tone}>
            LUCRO EM {monthName}
          </Typography>
          <Typography variant="moneyLg" color={tone} numberOfLines={1}>
            {amount}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {income} entradas · {expenses} despesas
          </Typography>
        </View>
        <Ionicons name="chevron-forward" size={iconSizes.sm} color={tone} />
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
          style={{ fontSize: fontSizes.xs }}
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
  const { copy } = useBrand();
  const actions = [
    { icon: "add", label: copy.saleLabel, route: "/tabs/new-sale", active: true },
    {
      icon: "cube-outline",
      label: "Novo produto",
      route: "/products",
      active: false,
    },
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
            borderLeftColor: theme.colors.border,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: action.active ? radii.md : radii.full,
              // Selecao = fundo rosado suave (papel 2), nunca segundo bloco rosa.
              backgroundColor: action.active ? theme.colors.primaryBg : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={action.icon}
              size={iconSizes.md}
              color={
                action.active ? theme.colors.primaryStrong : theme.colors.textSecondary
              }
            />
          </View>
          <Typography
            variant="caption"
            color={action.active ? theme.colors.primaryStrong : theme.colors.text}
            numberOfLines={1}
            style={{ fontSize: fontSizes.xs }}
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
  const { copy } = useBrand();
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
          label={`Cadastre seu primeiro ${copy.productNoun}`}
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
  const { copy } = useBrand();
  const hasStock = useFeature("estoque");
  const hasScheduling = useFeature("agendamento");
  const hasRecipes = useFeature("fichaTecnica");
  const router = useRouter();
  const isDesktop = useDesktopLayout();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
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
  const canUsePremiumNotifications =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "premiumNotifications");
  const birthdayCount = birthdays?.length ?? 0;

  // 2.5: não mostrar o AdBanner junto do LimitBanner (mensagem "assine" ao lado
  // de um anúncio canibaliza o upgrade); mesma condição usada pelo LimitBanner.
  const showSalesLimitBanner = getLimitBannerState(limits, profile, "sales") !== null;

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
  const homeShortcutCategories = HOME_SHORTCUT_CATEGORIES.map((category) => ({
    ...category,
    items: category.items
      .filter((item) => {
        if (!("feature" in item)) return true;
        return item.feature === "agendamento" ? hasScheduling : hasRecipes;
      })
      .map((item) =>
        item.route === "/products"
          ? {
              ...item,
              label: copy.productNounPlural.replace(/^./, (letter) =>
                letter.toUpperCase(),
              ),
            }
          : item,
      ),
  }));
  const goalConfig = prolaboreData?.config;
  const goalProgress = prolaboreData?.progress;

  const goalModal = (
    <ResponsiveModal
      desktopMaxWidth={840}
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
    </ResponsiveModal>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["3xl"],
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
              <Typography variant="display" serif>
                Olá, {firstName}!
              </Typography>
              <Ionicons name="heart" size={22} color={colors.rose300} />
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

        {!showSalesLimitBanner && <AdBanner size="banner" />}

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["2xl"] }}
          />
        ) : (
          <>
            <HeroTodayCard
              amount={formatCurrency(todaySummary?.totalAmount ?? 0)}
              salesLabel={todaySalesLabel(todaySummary?.totalSales ?? 0)}
              saleActionLabel={copy.saleLabel}
              hasSales={hasSalesToday}
              onOpenSales={() => router.push("/tabs/sales")}
              onNewSale={() => router.push("/tabs/new-sale")}
            />

            <QuickCreateBar />

            <LucroHighlightCard
              monthName={getMonthName().toUpperCase()}
              amount={formatCurrency(monthProfit)}
              income={formatCurrency(financeSummary?.totalIncome ?? 0)}
              expenses={formatCurrency(financeSummary?.totalExpenses ?? 0)}
              onPress={() => router.push("/finance")}
            />

            {hasScheduling && upcomingDeliveries > 0 && (
              <Card
                variant="surface"
                padding="lg"
                onPress={() => router.push("/tabs/agenda")}
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
                    <Ionicons
                      name="calendar"
                      size={iconSizes.md}
                      color={theme.colors.textSecondary}
                    />
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
                    size={iconSizes.sm}
                    color={theme.colors.textSecondary}
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
                    <Typography variant="label" color={theme.colors.textSecondary}>
                      META DO MÊS
                    </Typography>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radii.md,
                        backgroundColor: theme.colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={iconSizes.sm}
                        color={theme.colors.textSecondary}
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
                      size={iconSizes.sm}
                      color={
                        goalProgress?.reached
                          ? theme.colors.success
                          : theme.colors.textSecondary
                      }
                    />
                    <Typography
                      variant="bodyBold"
                      color={
                        goalProgress?.reached ? theme.colors.success : theme.colors.text
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

              {hasStock && lowStockEnabled && (
                <ListCard
                  title={`${copy.stockLabel} baixo`}
                  icon="cube-outline"
                  iconColor={theme.colors.yellow}
                  iconBg={theme.colors.yellowBg}
                  badge={
                    lowStockProducts && lowStockProducts.length > 0
                      ? String(lowStockProducts.length)
                      : undefined
                  }
                  badgeVariant="warning"
                  actionLabel="Ver todos"
                  onPress={() => router.push("/products")}
                  style={cardStyle}
                >
                  {lowStockProducts && lowStockProducts.length > 0 ? (
                    lowStockProducts.slice(0, 3).map((product, index) => (
                      <ListCardItem
                        key={product.id}
                        first={index === 0}
                        style={{ paddingVertical: spacing.sm }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.md,
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
                      </ListCardItem>
                    ))
                  ) : (
                    <View
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: spacing.md,
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
                </ListCard>
              )}
            </View>

            {birthdayCount > 0 &&
              canUsePremiumNotifications &&
              birthdaysEnabled &&
              birthdays && <BirthdaysCard clients={birthdays} cardStyle={cardStyle} />}

            {birthdayCount > 0 && !canUsePremiumNotifications && (
              <ListCard
                title="Aniversariantes do mês"
                icon="gift-outline"
                iconColor={theme.colors.premium}
                iconBg={theme.colors.premiumBg}
                badge="Profissional"
                badgeVariant="premium"
                onPress={() => showPaywall("birthdays")}
                style={cardStyle}
                footer={
                  <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                    Desbloqueie pra ver e parabenizar →
                  </Typography>
                }
              >
                <ListCardItem first style={{ paddingVertical: spacing.sm }}>
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
                </ListCardItem>
              </ListCard>
            )}

            {!isDesktop && (
              <View style={{ gap: spacing.sm }}>
                <Typography variant="label">TODOS OS RECURSOS</Typography>
                {homeShortcutCategories.map((category) => (
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
            )}

            {goalModal}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
