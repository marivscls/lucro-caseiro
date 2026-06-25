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
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { useProfile } from "../../features/subscription/hooks";
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
  if (count === 0) return "Nenhuma venda ainda — bora registrar a primeira?";
  if (count === 1) return "1 venda registrada";
  return `${count} vendas registradas`;
}

function getCardStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  const isDark = theme.mode === "dark";
  return {
    backgroundColor: isDark ? "rgba(44, 36, 32, 0.82)" : theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: isDark ? "rgba(245, 225, 219, 0.11)" : "rgba(74, 50, 40, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.32 : 0.08,
    shadowRadius: 22,
    elevation: 4,
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

function QuickAction({
  title,
  icon,
  active,
  onPress,
}: Readonly<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const surface = getCardStyle(theme);
  const bg = active ? theme.colors.primary : surface.backgroundColor;
  const fg = active ? theme.colors.textOnPrimary : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flex: 1,
          height: 58,
          borderRadius: radii["2xl"],
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: active ? theme.colors.primaryLight : surface.borderColor,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.md,
          opacity: pressed ? 0.86 : 1,
          shadowColor: active ? theme.colors.primary : "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: active ? 0.3 : 0.18,
          shadowRadius: 18,
          elevation: 4,
        },
      ]}
    >
      <Ionicons name={icon} size={24} color={fg} />
      <Typography variant="bodyBold" color={fg}>
        {title}
      </Typography>
    </Pressable>
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
          flex: 1,
          minWidth: 0,
          height: 106,
          borderRadius: radii.xl,
          padding: spacing.md,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.md,
          opacity: pressed ? 0.82 : 1,
          ...getCardStyle(theme),
        },
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radii.lg,
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
        <Ionicons name={icon} size={29} color={theme.colors.primaryLight} />
      </View>
      <Typography
        variant="bodyBold"
        style={{ textAlign: "center", fontSize: 14 }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function ChevronButton({ onPress }: Readonly<{ onPress?: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      style={{ width: 48, height: 48, alignItems: "flex-end", justifyContent: "center" }}
    >
      <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

function TrendBadge() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor:
          theme.mode === "dark" ? "rgba(245, 225, 219, 0.22)" : "rgba(74, 50, 40, 0.14)",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          theme.mode === "dark" ? "rgba(107, 191, 150, 0.06)" : theme.colors.successBg,
      }}
    >
      <Ionicons name="trending-up-outline" size={44} color={theme.colors.success} />
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
  const { width } = useWindowDimensions();
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
  const isPremium = profile?.plan === "premium";
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

  const isWide = width >= 390;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["5xl"],
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
            <Typography variant="h1" serif>
              Olá, {firstName}! 👋
            </Typography>
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

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <QuickAction
            title="Venda"
            icon="cart-outline"
            active
            onPress={() => router.push("/tabs/new-sale")}
          />
          <QuickAction
            title="Cliente"
            icon="person-add-outline"
            onPress={() => router.push("/tabs/clients")}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <ShortcutTile
            icon="calendar-outline"
            label="Agenda"
            onPress={() => router.push("/agenda")}
          />
          <ShortcutTile
            icon="wallet-outline"
            label="Finanças"
            onPress={() => router.push("/finance")}
          />
          <ShortcutTile
            icon="bar-chart-outline"
            label="Insights"
            onPress={() => router.push("/insights")}
          />
          <ShortcutTile
            icon="cube-outline"
            label="Produtos"
            onPress={() => router.push("/products")}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["2xl"] }}
          />
        ) : (
          <>
            <Card
              variant="surface"
              padding="xl"
              onPress={() =>
                router.push(hasSalesToday ? "/tabs/sales" : "/tabs/new-sale")
              }
              style={cardStyle}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    minHeight: hasSalesToday ? 112 : 76,
                    justifyContent: "center",
                    gap: spacing.xs,
                  }}
                >
                  <Typography variant="label">VENDAS DE HOJE</Typography>
                  <Typography
                    variant={hasSalesToday ? "moneyHero" : "moneyLg"}
                    color={theme.colors.success}
                  >
                    {formatCurrency(todaySummary?.totalAmount ?? 0)}
                  </Typography>
                  <Typography
                    variant="bodyBold"
                    color={hasSalesToday ? theme.colors.text : theme.colors.primaryLight}
                  >
                    {todaySalesLabel(todaySummary?.totalSales ?? 0)}
                  </Typography>
                </View>
                <View style={{ alignItems: "flex-end", gap: spacing.md }}>
                  <ChevronButton
                    onPress={() =>
                      router.push(hasSalesToday ? "/tabs/sales" : "/tabs/new-sale")
                    }
                  />
                  {hasSalesToday && <TrendBadge />}
                </View>
              </View>
            </Card>

            <Card
              variant="surface"
              padding="xl"
              onPress={() => router.push("/finance")}
              style={cardStyle}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Typography variant="label">
                    QUANTO SOBROU EM {getMonthName().toUpperCase()}
                  </Typography>
                  <Typography
                    variant="moneyLg"
                    color={monthProfit >= 0 ? theme.colors.success : theme.colors.alert}
                  >
                    {formatCurrency(monthProfit)}
                  </Typography>
                  <Typography variant="caption">
                    {formatCurrency(financeSummary?.totalIncome ?? 0)} entradas −{" "}
                    {formatCurrency(financeSummary?.totalExpenses ?? 0)} despesas
                  </Typography>
                </View>
                <ChevronButton onPress={() => router.push("/finance")} />
              </View>
            </Card>

            {upcomingDeliveries > 0 && (
              <Card
                variant="surface"
                padding="xl"
                onPress={() => router.push("/agenda")}
                style={{
                  ...cardStyle,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
                >
                  <Ionicons name="calendar" size={22} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="h3">Agenda</Typography>
                    <Typography variant="caption">
                      {upcomingDeliveries === 1
                        ? "1 entrega próxima (hoje/amanhã ou atrasada)"
                        : `${upcomingDeliveries} entregas próximas (hoje/amanhã ou atrasadas)`}
                    </Typography>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Card>
            )}

            <View style={{ flexDirection: isWide ? "row" : "column", gap: spacing.md }}>
              <Card
                variant="surface"
                padding="xl"
                onPress={() => setShowGoalForm(true)}
                style={{
                  ...cardStyle,
                  flex: 1,
                  borderLeftWidth: 2,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <View style={{ minHeight: 230, gap: spacing.md }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="label">META DO MÊS</Typography>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View>
                    <Typography
                      variant="moneyLg"
                      color={
                        goalProgress?.reached ? theme.colors.success : theme.colors.text
                      }
                    >
                      {formatCurrency(goalProgress?.currentRevenue ?? 0)}
                    </Typography>
                    <Typography variant="caption" style={{ marginTop: spacing.xs }}>
                      de {formatCurrency(goalProgress?.requiredRevenue ?? 3000)}{" "}
                      necessários
                    </Typography>
                  </View>
                  <View
                    style={{
                      height: 9,
                      borderRadius: radii.full,
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(245, 225, 219, 0.12)"
                          : theme.colors.surface,
                      overflow: "hidden",
                      flexDirection: "row",
                    }}
                  >
                    <View
                      style={{
                        flex: Math.max(goalProgress?.progressPct ?? 0, 0.5),
                        backgroundColor: goalProgress?.reached
                          ? theme.colors.success
                          : theme.colors.primary,
                      }}
                    />
                    <View
                      style={{
                        flex: Math.max(100 - (goalProgress?.progressPct ?? 0), 0),
                      }}
                    />
                  </View>
                  <Typography
                    variant="bodyBold"
                    color={
                      goalProgress?.reached
                        ? theme.colors.success
                        : theme.colors.primaryLight
                    }
                  >
                    {goalProgress
                      ? prolaboreMessage(goalProgress)
                      : "Defina sua meta do mês"}
                  </Typography>
                </View>
              </Card>

              {lowStockEnabled && (
                <Card
                  variant="surface"
                  padding="lg"
                  onPress={() => router.push("/products")}
                  style={{
                    ...cardStyle,
                    flex: 1,
                    borderLeftWidth: 2,
                    borderLeftColor: theme.colors.primary,
                  }}
                >
                  <View style={{ minHeight: 230 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: spacing.sm,
                      }}
                    >
                      <Typography variant="label">ESTOQUE BAIXO</Typography>
                      <ChevronButton onPress={() => router.push("/products")} />
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
                          <Typography
                            variant="bodyBold"
                            color={
                              product.stockQuantity === 0
                                ? theme.colors.alert
                                : theme.colors.premium
                            }
                            style={{ textAlign: "right" }}
                          >
                            {product.stockQuantity === 0
                              ? "Sem estoque"
                              : `${product.stockQuantity} un.`}
                          </Typography>
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

                    <View
                      style={{
                        marginTop: spacing.sm,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: spacing.xs,
                      }}
                    >
                      <Typography variant="bodyBold">Ver todos os produtos</Typography>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
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

            <Card variant="surface" padding="lg" style={cardStyle}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: spacing.md,
                }}
              >
                <Typography variant="label">PEDIDOS RECENTES</Typography>
                <Pressable onPress={() => router.push("/agenda")} hitSlop={12}>
                  <Typography variant="bodyBold" color={theme.colors.primaryLight}>
                    Ver todos
                  </Typography>
                </Pressable>
              </View>
              <View
                style={{
                  minHeight: 128,
                  borderWidth: 1,
                  borderRadius: radii.xl,
                  borderColor:
                    theme.mode === "dark"
                      ? "rgba(245, 225, 219, 0.12)"
                      : "rgba(74, 50, 40, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: spacing.xl,
                }}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={40}
                  color={theme.colors.primaryLight}
                />
                <Typography
                  variant="bodyBold"
                  style={{ marginTop: spacing.md, textAlign: "center" }}
                >
                  Nenhum pedido recente
                </Typography>
                <Typography
                  variant="caption"
                  style={{ marginTop: spacing.xs, textAlign: "center" }}
                >
                  Seus pedidos aparecerão aqui.
                </Typography>
              </View>
            </Card>

            {goalModal}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -spacing.xl }}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
            >
              {[
                {
                  icon: "document-text-outline" as const,
                  label: "Receitas",
                  route: "/recipes" as const,
                },
                {
                  icon: "calculator-outline" as const,
                  label: "Precificação",
                  route: "/pricing" as const,
                },
                {
                  icon: "gift-outline" as const,
                  label: "Embalagens",
                  route: "/packaging" as const,
                },
                {
                  icon: "pricetag-outline" as const,
                  label: "Rótulos",
                  route: "/labels" as const,
                },
                {
                  icon: "diamond-outline" as const,
                  label: "Planos",
                  route: "/plans" as const,
                },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route)}
                  style={({ pressed }) => [
                    {
                      minWidth: 112,
                      height: 44,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: spacing.xs,
                      opacity: pressed ? 0.84 : 1,
                      ...cardStyle,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={theme.colors.primaryLight}
                  />
                  <Typography variant="caption" numberOfLines={1}>
                    {item.label}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>

            <AdBanner size="banner" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
