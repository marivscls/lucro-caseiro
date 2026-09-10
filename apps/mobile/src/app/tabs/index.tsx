import { ScreenHeader } from "../../shared/components/screen-header";
import { ScreenGuidance } from "../../shared/guidance/screen-guidance";
import { useBusinessOnboarding } from "../../features/onboarding/use-business-onboarding";
import { onboardingDestination } from "../../shared/utils/new-account";
import {
  Card,
  iconSizes,
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
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { ProlaboreGoalForm } from "../../features/goals/components/prolabore-goal-form";
import { useProlaboreStatus } from "../../features/goals/hooks";
import { BusinessProfileCard } from "../../features/onboarding/business-profile";
import { usePricingList } from "../../features/pricing/hooks";
import { useProducts } from "../../features/products/hooks";
import { useSales } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimits, useProfile } from "../../features/subscription/hooks";
import { getLimitBannerState } from "../../features/subscription/limits";
import { AdBanner } from "../../shared/components/ad-banner";
import { AppIcon, type AppIconName } from "../../shared/components/app-icon";
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
import {
  resolveGettingStartedPresentation,
  type GettingStartedStage,
} from "../../shared/utils/getting-started";
import { resolveHomeNextStep } from "../../shared/utils/home-next-step";

import {
  HomeDay,
  HomeQuickActions,
  HomeMoney,
  HomeAttention,
  HomeGoal,
} from "../../features/home/components";
import { useOrders } from "../../features/orders/hooks";
import { useBusinessCopy } from "../../features/subscription/business-copy";

function localDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formattedDate(date = new Date()): string {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
  );
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

const GETTING_STARTED_COPY: Record<
  GettingStartedStage,
  {
    action: string;
    description: string;
    icon: AppIconName;
    title: string;
  }
> = {
  product: {
    action: "Cadastrar",
    description: "Leva menos de 2 minutos",
    icon: "cube-outline",
    title: "Cadastre seu primeiro produto",
  },
  sale: {
    action: "Nova venda",
    description: "Leva menos de 1 minuto",
    icon: "receipt-outline",
    title: "Registre sua primeira venda",
  },
  result: {
    action: "Ver resultado",
    description: "Seu resultado já está pronto",
    icon: "trending-up-outline",
    title: "Veja o que sua venda rendeu",
  },
};

function onboardingStepNumber(stage: GettingStartedStage): number {
  if (stage === "sale") return 2;
  if (stage === "result") return 3;
  return 1;
}

function NextStepCard({
  compact,
  onAction,
  stage,
}: Readonly<{
  compact: boolean;
  onAction: () => void;
  stage: GettingStartedStage;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const copy = GETTING_STARTED_COPY[stage];
  const step = onboardingStepNumber(stage);

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={{
        borderColor: colors.border,
        borderRadius: radii.xl,
      }}
    >
      <View
        style={{
          flexDirection: compact ? "column" : "row",
          flexWrap: compact ? "nowrap" : "wrap",
          alignItems: compact ? "stretch" : "center",
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            flex: 1,
            minWidth: compact ? 0 : 260,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name={copy.icon}
              size={iconSizes.lg}
              color={theme.colors.primaryStrong}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="homeEyebrow" color={theme.colors.primaryStrong}>
              PRÓXIMO PASSO · {step} DE 3
            </Typography>
            <Typography variant="homeCardLead" style={{ marginTop: 2 }}>
              {copy.title}
            </Typography>
            <Typography variant="homeDescription" color={theme.colors.textSecondary}>
              {copy.description}
            </Typography>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.action}: ${copy.title}`}
          onPress={onAction}
          style={({ pressed }) => ({
            minHeight: 48,
            paddingHorizontal: spacing.xl,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primaryInteractive,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <Typography variant="homeAction" color={theme.colors.textOnPrimary}>
            {copy.action}
          </Typography>
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: step }}
        style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}
      >
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              width: item === step ? 56 : 44,
              maxWidth: "30%",
              height: 5,
              borderRadius: radii.full,
              backgroundColor:
                item <= step ? theme.colors.primaryInteractive : theme.colors.surface,
            }}
          />
        ))}
      </View>
    </Card>
  );
}

function ContextualNextCard({
  accessibilityHint,
  accessibilityLabel,
  action,
  description,
  icon,
  iconBackground,
  iconColor,
  onPress,
  title,
}: Readonly<{
  accessibilityHint: string;
  accessibilityLabel: string;
  action: string;
  description: string;
  icon: AppIconName;
  iconBackground: string;
  iconColor: string;
  onPress: () => void;
  title: string;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
    >
      <Card
        variant="elevated"
        padding="xl"
        shadow="sm"
        style={{
          borderColor: colors.border,
          borderRadius: radii.xl,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: iconBackground,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={icon} size={iconSizes.lg} color={iconColor} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="homeGoalTitle">{title}</Typography>
            <Typography
              variant="homeBody"
              color={theme.colors.textSecondary}
              style={{ marginTop: 4 }}
            >
              {description}
            </Typography>
            <View
              style={{
                minHeight: 44,
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Typography variant="homeLink" color={colors.rose}>
                {action}
              </Typography>
              <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.rose} />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const brand = useBrand();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const compact = !isDesktop && width < 480;
  const today = localDateKey();

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

  const startedUserIds = useOnboarding((state) => state.gettingStartedStartedUserIds);
  const dismissedUserIds = useOnboarding((state) => state.gettingStartedDismissedUserIds);
  const completedUserIds = useOnboarding((state) => state.gettingStartedCompletedUserIds);
  const startGettingStarted = useOnboarding((state) => state.startGettingStarted);
  const dismissGettingStarted = useOnboarding((state) => state.dismissGettingStarted);
  const completeGettingStarted = useOnboarding((state) => state.completeGettingStarted);
  const onboardingHydrated = useOnboarding.persist.hasHydrated();

  const hasProduct = (productsQuery.data?.items.length ?? 0) > 0;
  const hasSale = (salesQuery.data?.items.length ?? 0) > 0;
  const hasPriced = (pricingQuery.data?.total ?? 0) > 0;
  const onboardingSettled =
    onboardingHydrated && !productsQuery.isLoading && !salesQuery.isLoading;
  const onboardingStarted = !!userId && startedUserIds.includes(userId);
  const onboardingDismissed = !!userId && dismissedUserIds.includes(userId);
  const onboardingCompleted = !!userId && completedUserIds.includes(userId);
  const {
    show: showGettingStarted,
    showReopen: showGettingStartedReopen,
    stage: gettingStartedStage,
  } = resolveGettingStartedPresentation({
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
  const homeNextStep = resolveHomeNextStep({
    settled: onboardingSettled,
    hasProduct,
    hasPriced,
    pricingKnown: pricingQuery.isSuccess,
    gettingStartedVisible:
      showGettingStarted ||
      showGettingStartedReopen ||
      serviceBusiness ||
      (brand.id === "lucro-caseiro" && businessOnboarding.record?.status === "completed"),
  });

  function skipGettingStarted() {
    setManuallyOpenedGuideUserId(null);
    if (userId) dismissGettingStarted(userId);
  }

  const firstName = profile?.name?.trim().split(/\s+/)[0] || "Maria";
  const showSalesLimitBanner = getLimitBannerState(limits, profile, "sales") !== null;

  function handleProductRegistration() {
    if (userId) startGettingStarted(userId);
    router.push("/products?from=getting-started&create=getting-started");
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

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: isDesktop ? 0 : spacing.lg,
          paddingBottom: isDesktop
            ? spacing["3xl"]
            : floatingTabBarContentPadding(insets.bottom),
          gap: spacing.xl,
          ...pageGutter(isDesktop, width <= 375 ? spacing.lg : spacing.xl),
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenGuidance
          renderHeader={(helpButton) =>
            isDesktop ? (
              <ScreenHeader
                help={helpButton}
                title={`Olá, ${firstName}!`}
                subtitle={formattedDate()}
                hideBack
              />
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="homeTitle"
                    color={brand.id === "lucro-caseiro" ? colors.wine : theme.colors.text}
                  >
                    Olá, {firstName}!
                  </Typography>
                  <Typography variant="homeBody" style={{ marginTop: 2 }}>
                    {formattedDate()}
                  </Typography>
                </View>
                {helpButton}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Minha conta"
                  hitSlop={8}
                  onPress={() => router.push("/settings")}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <AvatarCircle
                    name={profile?.name ?? firstName}
                    avatarUrl={profile?.avatarUrl}
                  />
                </Pressable>
              </View>
            )
          }
          area="home"
          onStart={() =>
            router.push(
              serviceBusiness ? "/services?create=1" : "/products?create=getting-started",
            )
          }
          actionLabel={serviceBusiness ? "Cadastrar serviço" : "Cadastrar produto"}
          hasRecords={
            hasProduct || hasSale || businessOnboarding.record?.status === "completed"
          }
          loading={!onboardingSettled || productsQuery.isError || salesQuery.isError}
          suspended={showGettingStarted}
          secondary={{
            label: "Começar pelo financeiro",
            onPress: () => router.push("/finance"),
          }}
        />
        {brand.id === "lucro-caseiro" ? (
          <BusinessProfileCard
            hasSale={hasSale}
            compactHome={hasSale || hasPriced || (ordersQuery.data?.length ?? 0) > 0}
          />
        ) : null}

        <LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />

        {showGettingStartedReopen ? (
          <NextStepCard
            compact={compact}
            stage={gettingStartedStage}
            onAction={() => {
              if (userId) setManuallyOpenedGuideUserId(userId);
            }}
          />
        ) : null}

        {hasScheduling && (
          <HomeDay query={ordersQuery} today={today} service={serviceBusiness} />
        )}
        <HomeQuickActions service={serviceBusiness} scheduling={hasScheduling} />
        <HomeMoney today={today} orders={ordersQuery} scheduling={hasScheduling} />
        <HomeAttention enabled={!serviceBusiness && stockEnabled} />
        <HomeGoal query={goalQuery} onEdit={() => setShowGoalForm(true)} />

        {homeNextStep === "register-product" ? (
          <ContextualNextCard
            accessibilityHint="Abre o cadastro de produto"
            accessibilityLabel="Comece pelo essencial. Cadastrar produto"
            action="Cadastrar produto"
            description="Cadastre um produto para liberar estoque e lucro."
            icon="trending-up-outline"
            iconBackground={colors.lime}
            iconColor={colors.onLime}
            title="Comece pelo essencial"
            onPress={handleProductRegistration}
          />
        ) : null}

        {homeNextStep === "price-product" ? (
          <ContextualNextCard
            accessibilityHint="Abre a calculadora de preço"
            accessibilityLabel="Será que o preço cobre os custos? Calcular o lucro"
            action="Calcular o lucro"
            description="Você já tem produto. Veja se o preço de venda cobre os custos."
            icon="calculator-outline"
            iconBackground={theme.colors.primaryBg}
            iconColor={theme.colors.primaryStrong}
            title="Será que o preço cobre os custos?"
            onPress={() => router.push("/pricing")}
          />
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
