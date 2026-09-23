import { ScreenGuidance } from "../../shared/guidance/screen-guidance";
import { useBusinessOnboarding } from "../../features/onboarding/use-business-onboarding";
import { onboardingDestination } from "../../shared/utils/new-account";
import {
  fonts,
  radii,
  spacing,
  Typography,
  useBrand,
  useTheme,
  useFeature,
} from "@lucro-caseiro/ui";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useFinanceSummary } from "../../features/finance/hooks";
import { ProlaboreGoalForm } from "../../features/goals/components/prolabore-goal-form";
import { useProlaboreStatus } from "../../features/goals/hooks";
import { useInsights } from "../../features/insights/hooks";
import { BusinessProfileCard } from "../../features/onboarding/business-profile";
import { usePricingList } from "../../features/pricing/hooks";
import { useProducts } from "../../features/products/hooks";
import { useSales } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimits, useProfile } from "../../features/subscription/hooks";
import { getLimitBannerState } from "../../features/subscription/limits";
import { AdBanner } from "../../shared/components/ad-banner";
import { GettingStartedOverlay } from "../../shared/components/getting-started-overlay";
import { useAuth } from "../../shared/hooks/use-auth";
import { useOnboarding } from "../../shared/hooks/use-onboarding";
import { usePaywall } from "../../shared/hooks/use-paywall";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { resolveGettingStartedPresentation } from "../../shared/utils/getting-started";

import {
  HomeAttention,
  HomeChampions,
  HomeDay,
  HomeDayNumbers,
  HomeDayPreview,
  HomeFiado,
  HomeHabitGoal,
  HomeMonthHero,
  HomeNextIdeas,
  HomePriceAlert,
  HomePrimaryButton,
  HomeReadyBanner,
  HomeSetupSteps,
  HomeSetupTip,
  HomeStreakCard,
  QueryNotice,
} from "../../features/home/components";
import {
  activeSaleDays,
  capitalize,
  greeting as greetingFor,
  hasOlderHistory,
  historyStart,
  homePhase,
  localDateKey,
  setupSteps,
  type HomePhase,
  type SetupStepId,
} from "../../features/home/domain";
import { useHomeProducts, useHomeSalesHistory } from "../../features/home/hooks";
import { useOrders } from "../../features/orders/hooks";
import { useBusinessCopy } from "../../features/subscription/business-copy";

function formattedDate(date: Date, desktop: boolean): string {
  const text = capitalize(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
  );
  // No celular, "Quarta, 23 de setembro" cabe ao lado da ajuda e do avatar.
  return desktop ? text : text.replace("-feira", "");
}

function AvatarCircle({
  name,
  avatarUrl,
}: Readonly<{ name: string; avatarUrl?: string | null }>) {
  const { theme } = useTheme();
  const pastel = avatarPastel(name || "?", theme.mode);

  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: radii.full,
        backgroundColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48 }} />
      ) : (
        <Typography variant="homeAvatar" color={pastel.fg}>
          {name.charAt(0).toUpperCase() || "?"}
        </Typography>
      )}
    </View>
  );
}

function Columns({
  desktop,
  children,
}: Readonly<{ desktop: boolean; children: React.ReactNode }>) {
  return (
    <View
      style={
        desktop
          ? { flexDirection: "row", alignItems: "stretch", gap: spacing.xl }
          : { gap: 14 }
      }
    >
      {children}
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const brand = useBrand();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const now = new Date();
  const today = localDateKey(now);
  const since = historyStart(now);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [manuallyOpenedGuideUserId, setManuallyOpenedGuideUserId] = useState<
    string | null
  >(null);

  const userId = useAuth((state) => state.userId);
  const authUser = useAuth((state) => state.user);
  const onboardingState = useOnboarding();
  const businessOnboarding = useBusinessOnboarding();
  const businessCopy = useBusinessCopy();
  const serviceBusiness =
    ["services", "beauty"].includes(businessCopy.profile) ||
    businessOnboarding.answers.segment === "services";
  const hasScheduling = useFeature("agendamento");
  const stockEnabled = useFeature("estoque");
  const ordersQuery = useOrders(undefined, hasScheduling);
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);

  const goalQuery = useProlaboreStatus();
  const productsQuery = useProducts();
  const salesQuery = useSales();
  const pricingQuery = usePricingList();
  const allProducts = useHomeProducts(true);
  const history = useHomeSalesHistory(since);
  const olderInsights = useInsights(6);
  const monthFinance = useFinanceSummary();

  const startedUserIds = useOnboarding((state) => state.gettingStartedStartedUserIds);
  const dismissedUserIds = useOnboarding((state) => state.gettingStartedDismissedUserIds);
  const completedUserIds = useOnboarding((state) => state.gettingStartedCompletedUserIds);
  const startGettingStarted = useOnboarding((state) => state.startGettingStarted);
  const dismissGettingStarted = useOnboarding((state) => state.dismissGettingStarted);
  const completeGettingStarted = useOnboarding((state) => state.completeGettingStarted);
  const onboardingHydrated = useOnboarding.persist.hasHydrated();

  const hasProduct = (productsQuery.data?.items.length ?? 0) > 0;
  const hasSale = (salesQuery.data?.items.length ?? 0) > 0;
  const onboardingSettled =
    onboardingHydrated && !productsQuery.isLoading && !salesQuery.isLoading;
  const onboardingStarted = !!userId && startedUserIds.includes(userId);
  const onboardingDismissed = !!userId && dismissedUserIds.includes(userId);
  const onboardingCompleted = !!userId && completedUserIds.includes(userId);
  const { show: showGettingStarted, stage: gettingStartedStage } =
    resolveGettingStartedPresentation({
      dismissed:
        onboardingDismissed ||
        (brand.id === "lucro-caseiro" && !!businessOnboarding.record),
      manuallyOpened: !!userId && manuallyOpenedGuideUserId === userId,
      settled: onboardingSettled && !serviceBusiness,
      completed: onboardingCompleted,
      started: onboardingStarted,
      hasProduct,
      hasSale,
    });

  // A fase só é decidida com todas as entradas da regra; antes disso não há
  // cartão de passos nem valores, para não piscar a fase errada.
  const settled = (query: { data: unknown; isError: boolean }) =>
    query.data !== undefined || query.isError;
  const phaseReady =
    !!allProducts.data &&
    !!salesQuery.data &&
    !!history.data &&
    settled(pricingQuery) &&
    settled(olderInsights);
  const steps = setupSteps({
    hasProduct: (allProducts.data?.items.length ?? 0) > 0,
    hasPricing: (pricingQuery.data?.total ?? 0) > 0,
    products: allProducts.data?.items ?? [],
    hasSale,
  });
  const activeDays = history.data ? activeSaleDays(history.data.items) : 0;
  const phase: HomePhase | null = phaseReady
    ? homePhase({
        steps,
        activeDays,
        olderHistory: hasOlderHistory(olderInsights.data, since),
      })
    : null;
  const failedQuery = [allProducts, salesQuery, history].find(
    (query) => query.isError && query.data === undefined,
  );

  function skipGettingStarted() {
    setManuallyOpenedGuideUserId(null);
    if (userId) dismissGettingStarted(userId);
  }

  // Sem nome inventado enquanto o perfil carrega.
  const firstName = profile?.name?.trim().split(/\s+/)[0];
  const greeting = greetingFor(now, firstName);
  const showSalesLimitBanner = getLimitBannerState(limits, profile, "sales") !== null;
  const subtitle = isDesktop
    ? [formattedDate(now, true), profile?.businessName].filter(Boolean).join(" · ")
    : formattedDate(now, false);

  function handleProductRegistration() {
    if (userId) startGettingStarted(userId);
    router.push("/products?from=getting-started&create=getting-started");
  }

  function handleStep(step: SetupStepId) {
    if (step === "product") return handleProductRegistration();
    if (step === "price") return router.push("/pricing");
    if (userId) startGettingStarted(userId);
    router.push("/tabs/new-sale?from=getting-started");
  }

  function handleGettingStartedAction() {
    if (gettingStartedStage === "product") return handleProductRegistration();

    if (userId && gettingStartedStage !== "result") startGettingStarted(userId);
    if (gettingStartedStage === "sale") {
      router.push("/tabs/new-sale?from=getting-started");
      return;
    }

    if (userId) completeGettingStarted(userId);
    router.push("/finance");
  }

  if (
    brand.id === "lucro-caseiro" &&
    onboardingHydrated &&
    onboardingDestination({
      userId,
      createdAt: authUser?.created_at,
      pendingUserIds: onboardingState.pendingUserIds,
      completed: onboardingState.completed,
      completedUserIds: onboardingState.completedUserIds,
      onboardingCompleted: authUser?.user_metadata?.onboarding_completed,
      now: Date.now(),
    }) === "/onboarding"
  )
    return <Redirect href="/onboarding" />;

  const newSale = () => router.push("/tabs/new-sale");
  const pendingPhase = failedQuery ? (
    <QueryNotice query={failedQuery} label="seu Início" />
  ) : (
    <View accessibilityLiveRegion="polite" style={{ paddingVertical: spacing.xl }}>
      <Typography variant="homeBody" color={theme.colors.textSecondary}>
        Carregando seu Início…
      </Typography>
    </View>
  );

  const openGoal = () => setShowGoalForm(true);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: isDesktop ? spacing["3xl"] : spacing.lg,
          paddingBottom: isDesktop
            ? spacing["3xl"]
            : floatingTabBarContentPadding(insets.bottom),
          gap: isDesktop ? 22 : 14,
          ...pageGutter(isDesktop, spacing.lg),
          ...desktopStretch(isDesktop, desktopWidths.form),
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenGuidance
          renderHeader={(helpButton) => (
            <View style={[styles.header, !isDesktop && { paddingHorizontal: 4 }]}>
              <View style={{ flex: 1, minWidth: 0, gap: isDesktop ? 4 : 2 }}>
                <Text
                  style={[
                    isDesktop ? styles.subDesk : styles.sub,
                    { color: colors.muted },
                  ]}
                >
                  {subtitle}
                </Text>
                <Text
                  accessibilityRole="header"
                  style={[isDesktop ? styles.h1Desk : styles.h1, { color: colors.ink }]}
                >
                  {greeting}
                </Text>
              </View>
              {helpButton}
              {isDesktop ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minha conta"
                  hitSlop={8}
                  onPress={() => router.push("/settings")}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <AvatarCircle
                    name={profile?.name ?? ""}
                    avatarUrl={profile?.avatarUrl}
                  />
                </Pressable>
              )}
            </View>
          )}
          area="home"
          onStart={() =>
            router.push(
              serviceBusiness ? "/services?create=1" : "/products?create=getting-started",
            )
          }
          actionLabel={serviceBusiness ? "Cadastrar serviço" : "Cadastrar produto"}
          // Os primeiros passos já são a apresentação do Início.
          hasRecords={phase !== null}
          loading={phase === null}
          suspended={showGettingStarted}
          secondary={{
            label: "Começar pelo financeiro",
            onPress: () => router.push("/finance"),
          }}
        />

        <LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />

        {phase === null ? pendingPhase : null}

        {phase === "setup" ? (
          <>
            <Columns desktop={isDesktop}>
              <HomeSetupSteps steps={steps} desktop={isDesktop} onAction={handleStep} />
              {isDesktop ? (
                <HomeSetupTip onPress={() => router.push("/pricing")} />
              ) : null}
            </Columns>
            {hasSale ? (
              <HomeDayNumbers
                desktop={isDesktop}
                history={history}
                products={allProducts}
                now={now}
              />
            ) : (
              <HomeDayPreview desktop={isDesktop} />
            )}
          </>
        ) : null}

        {phase === "ready" ? (
          <>
            <Columns desktop={isDesktop}>
              <View style={isDesktop ? { flex: 3 } : undefined}>
                <HomeReadyBanner
                  firstName={firstName}
                  history={history}
                  products={allProducts}
                  desktop={isDesktop}
                />
              </View>
              {isDesktop ? <HomeStreakCard activeDays={activeDays} desktop /> : null}
            </Columns>
            {isDesktop ? null : (
              <HomePrimaryButton label="Anotar outra venda" onPress={newSale} />
            )}
            <HomeDayNumbers
              desktop={isDesktop}
              history={history}
              products={allProducts}
              now={now}
            />
            {isDesktop ? null : (
              <HomeStreakCard activeDays={activeDays} desktop={false} />
            )}
            <HomeNextIdeas
              columns={isDesktop ? 3 : 1}
              hasGoal={!!goalQuery.data?.config}
              onGoal={openGoal}
            />
          </>
        ) : null}

        {phase === "month" ? (
          <>
            <Columns desktop={isDesktop}>
              <View style={isDesktop ? { flex: 3 } : undefined}>
                <HomeMonthHero
                  history={history}
                  finance={monthFinance}
                  now={now}
                  desktop={isDesktop}
                />
              </View>
              {isDesktop ? (
                <HomeHabitGoal
                  full
                  history={history}
                  goal={goalQuery}
                  now={now}
                  onEditGoal={openGoal}
                />
              ) : null}
            </Columns>
            {isDesktop ? null : (
              <>
                <HomePrimaryButton label="Anotar venda" onPress={newSale} />
                <HomeHabitGoal
                  full={false}
                  history={history}
                  goal={goalQuery}
                  now={now}
                  onEditGoal={openGoal}
                />
                <HomePriceAlert history={history} products={allProducts} now={now} />
              </>
            )}
            <Columns desktop={isDesktop}>
              <HomeChampions
                history={history}
                products={allProducts}
                now={now}
                style={isDesktop ? { flex: 1 } : undefined}
              />
              <HomeFiado style={isDesktop ? { flex: 1 } : undefined} />
              {isDesktop ? (
                <HomePriceAlert
                  history={history}
                  products={allProducts}
                  now={now}
                  style={{ flex: 1 }}
                />
              ) : null}
            </Columns>
          </>
        ) : null}

        {phase === "ready" || phase === "month" ? (
          <>
            {hasScheduling && (
              <HomeDay query={ordersQuery} today={today} service={serviceBusiness} />
            )}
            <HomeAttention enabled={!serviceBusiness && stockEnabled} />
          </>
        ) : null}

        {brand.id === "lucro-caseiro" && phase !== null ? (
          <BusinessProfileCard hasSale={hasSale} compactHome={hasSale} />
        ) : null}

        {!showSalesLimitBanner ? <AdBanner size="banner" /> : null}

        <ProlaboreGoalForm
          config={goalQuery.data?.config ?? null}
          visible={showGoalForm}
          onClose={() => setShowGoalForm(false)}
          onSuccess={() => setShowGoalForm(false)}
        />
      </ScrollView>
      <Modal
        animationType="fade"
        visible={showGettingStarted}
        onRequestClose={skipGettingStarted}
      >
        <GettingStartedOverlay
          stage={gettingStartedStage}
          onSkip={skipGettingStarted}
          onContinue={handleGettingStartedAction}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  sub: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  subDesk: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  h1: { fontFamily: fonts.extraBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  h1Desk: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
});
