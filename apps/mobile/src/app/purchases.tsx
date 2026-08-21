import { hasActiveFeature, type Purchase } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  EmptyState,
  Typography,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type ImageStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import comprasHero3d from "../assets/compras-hero-3d.png";
import { CreatePurchaseForm } from "../features/purchases/components/create-purchase-form";
import { PurchaseCard } from "../features/purchases/components/purchase-card";
import {
  pendingCountLabel,
  pendingTotal,
  purchaseFilterCounts,
  sortPurchasesMostRecentFirst,
  sortPurchasesPendingFirst,
} from "../features/purchases/domain";
import {
  useDeletePurchase,
  usePayPurchase,
  usePurchases,
} from "../features/purchases/hooks";
import { useProfile } from "../features/subscription/hooks";
import { useBrandScreenPalette } from "../shared/brand-palette";
import { showAlert } from "../shared/components/alert-store";
import { AppIcon } from "../shared/components/app-icon";
import { FAB } from "../shared/components/fab";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { usePaywall } from "../shared/hooks/use-paywall";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";

type Filter = "all" | "pending" | "paid";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "A pagar" },
  { value: "paid", label: "Pagas" },
];

const HERO_IMAGE_RIGHT = 12;
const HERO_IMAGE_BOTTOM = 6;
const ADD_BUTTON_HEIGHT = 48;

export default function PurchasesScreen() {
  const pal = useBrandScreenPalette();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const { data: profile } = useProfile();
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "purchases");
  const showPaywall = usePaywall((s) => s.show);
  const [filter, setFilter] = useState<Filter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const payingIdRef = useRef<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingIdRef = useRef<string | null>(null);
  const [contentWidth, setContentWidth] = useState(() =>
    Math.max(280, Math.min(viewportWidth - spacing.xl * 2, desktopWidths.wide)),
  );

  const { data, isLoading, error, refetch } = usePurchases({ limit: 100 });
  const allItems = useMemo(
    () => sortPurchasesPendingFirst(sortPurchasesMostRecentFirst(data?.items ?? [])),
    [data?.items],
  );
  const counts = purchaseFilterCounts(allItems);
  const toPay = pendingTotal(allItems);
  const items =
    filter === "all"
      ? allItems
      : allItems.filter((purchase) => purchase.paymentStatus === filter);

  const payPurchase = usePayPurchase();
  const deletePurchase = useDeletePurchase();
  const bottomBarPadding =
    ADD_BUTTON_HEIGHT + spacing.md * 2 + Math.max(insets.bottom, spacing.sm);

  function confirmDelete(id: string) {
    showAlert({
      title: "Excluir compra",
      message: "Tem certeza que deseja excluir esta compra?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            if (deletingIdRef.current) return;
            deletingIdRef.current = id;
            setDeletingId(id);
            deletePurchase
              .mutateAsync(id)
              .catch(() => alertError("Não foi possível excluir a compra."))
              .finally(() => {
                deletingIdRef.current = null;
                setDeletingId(null);
              });
          },
        },
      ],
    });
  }

  function pay(id: string) {
    // A ref trava de forma sincrona, antes de o React renderizar o estado novo.
    // Assim, um toque nunca dispara pagamentos de dois cards em sequencia.
    if (payingIdRef.current) return;
    payingIdRef.current = id;
    setPayingId(id);
    payPurchase
      .mutateAsync(id)
      .then((paid) => {
        if (paid.id !== id || paid.paymentStatus !== "paid") {
          throw new Error("A API não confirmou a compra selecionada.");
        }
      })
      .catch(() => alertError("Não foi possível marcar a compra como paga."))
      .finally(() => {
        payingIdRef.current = null;
        setPayingId(null);
      });
  }

  function openCreate() {
    if (!isPremium) {
      showPaywall("purchases");
      return;
    }
    setShowCreate(true);
  }

  const pageFrame = {
    ...pageGutter(isDesktop),
    ...desktopStretch(isDesktop, desktopWidths.wide),
  };

  if (!isPremium) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: pal.background }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader
          title="Compras"
          subtitle="Pedidos e reposições do negócio"
          hideBack={isDesktop}
          titleStyle={{ color: pal.wine }}
          subtitleStyle={{ color: pal.muted }}
          right={
            <FAB
              icon="add"
              header
              onPress={openCreate}
              accessibilityLabel="Nova compra"
              style={{ backgroundColor: pal.rose }}
            />
          }
        />
        <ScrollView contentContainerStyle={{ ...pageFrame, paddingTop: spacing.xl }}>
          <PurchasesPremiumGate onUnlock={() => showPaywall("purchases")} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pal.background }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Compras"
        subtitle="Pedidos e reposições do negócio"
        hideBack={isDesktop}
        titleStyle={{ color: pal.wine }}
        subtitleStyle={{ color: pal.muted }}
        right={
          <FAB
            icon="add"
            header
            onPress={openCreate}
            accessibilityLabel="Nova compra"
            style={{ backgroundColor: pal.rose }}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...pageFrame,
          paddingTop: spacing.sm,
          paddingBottom: bottomBarPadding + spacing.xl,
        }}
      >
        <View
          onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
          style={{ width: "100%", gap: spacing.lg }}
        >
          {isLoading ? <SkeletonList rows={6} variant="purchase" /> : null}

          {!isLoading && error ? (
            <EmptyState
              title="Algo deu errado"
              description="Não foi possível carregar suas compras. Tente novamente."
              action={
                <Button
                  title="Tentar novamente"
                  onPress={() => void refetch()}
                  style={{ backgroundColor: pal.rose }}
                />
              }
            />
          ) : null}

          {!isLoading && !error ? (
            <>
              <PurchasesSummaryHero
                amount={toPay}
                pendingCount={counts.pending}
                width={contentWidth}
                isDesktop={isDesktop}
              />

              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, flexGrow: 0 }}
              >
                {FILTERS.map((option) => (
                  <PurchaseFilterChip
                    key={option.value}
                    label={`${option.label} ${counts[option.value]}`}
                    selected={filter === option.value}
                    onPress={() => setFilter(option.value)}
                  />
                ))}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.md,
                }}
              >
                <Typography
                  variant="h2"
                  color={pal.wine}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  Compras recentes
                </Typography>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Typography variant="caption" color={pal.muted}>
                    Mais recentes
                  </Typography>
                  <AppIcon name="chevron-forward" size={iconSizes.xs} color={pal.muted} />
                </View>
              </View>

              {allItems.length === 0 ? (
                <EmptyState
                  title="Nenhuma compra por aqui"
                  description="Registre a primeira compra de fornecedor."
                  action={
                    <Button
                      title="Adicionar compra"
                      onPress={openCreate}
                      style={{ backgroundColor: pal.rose }}
                    />
                  }
                  style={{ paddingVertical: spacing["2xl"] }}
                />
              ) : null}

              {allItems.length > 0 && items.length === 0 ? (
                <EmptyState
                  title="Nenhuma compra neste filtro"
                  description="Escolha outro status para ver suas compras."
                  style={{ paddingVertical: spacing["2xl"] }}
                />
              ) : null}

              {items.length > 0 ? (
                <View style={{ gap: spacing.md }}>
                  {items.map((purchase) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      onPay={() => pay(purchase.id)}
                      onEdit={() => setEditingPurchase(purchase)}
                      onDelete={() => confirmDelete(purchase.id)}
                      isPaying={payingId === purchase.id}
                      payDisabled={payingId !== null}
                      isDeleting={deletingId === purchase.id}
                      deleteDisabled={deletingId !== null}
                      editDisabled={payingId !== null || deletingId !== null}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          backgroundColor: pal.offWhite,
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          borderTopWidth: 1,
          borderTopColor: pal.border,
        }}
      >
        <View style={{ width: "100%", ...pageFrame }}>
          <Button
            title="Adicionar compra"
            size="lg"
            onPress={openCreate}
            disabled={payingId !== null || deletingId !== null}
            style={{
              width: "100%",
              minHeight: ADD_BUTTON_HEIGHT,
              backgroundColor: pal.rose,
              borderRadius: radii.md,
            }}
          />
        </View>
      </View>

      {showCreate ? (
        <CreatePurchaseForm
          visible
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      ) : null}
      {editingPurchase ? (
        <CreatePurchaseForm
          visible
          purchase={editingPurchase}
          onClose={() => setEditingPurchase(null)}
          onSuccess={() => setEditingPurchase(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function heroImageSize(cardWidth: number, isDesktop: boolean, compact: boolean): number {
  if (isDesktop) return Math.min(190, cardWidth * 0.4);
  if (compact) return Math.min(100, Math.max(84, cardWidth * 0.28));
  if (cardWidth < 400) return Math.min(128, cardWidth * 0.34);
  return Math.min(160, cardWidth * 0.36);
}

function PurchasesSummaryHero({
  amount,
  pendingCount,
  width,
  isDesktop,
}: Readonly<{
  amount: number;
  pendingCount: number;
  width: number;
  isDesktop: boolean;
}>) {
  const pal = useBrandScreenPalette();
  const compact = width < 360;
  const sidePad = compact ? spacing.lg : spacing.xl;
  const imageGap = spacing.sm;
  const minTextWidth = compact ? 156 : 172;
  const available = Math.max(
    minTextWidth + 84,
    width - sidePad - imageGap - HERO_IMAGE_RIGHT,
  );
  const imageSize = Math.min(
    heroImageSize(width, isDesktop, compact),
    Math.max(84, available - minTextWidth),
  );
  const textWidth = Math.max(minTextWidth, available - imageSize);
  const amountVariant = textWidth < 176 || compact ? "money" : "moneyLg";
  const cardMinHeight = Math.max(
    compact ? 140 : 156,
    imageSize + HERO_IMAGE_BOTTOM + spacing.md,
  );

  return (
    <View
      style={{
        width: "100%",
        minHeight: cardMinHeight,
        borderRadius: radii["2xl"],
        backgroundColor: pal.wineFill,
        overflow: "hidden",
        paddingVertical: spacing.xl,
        paddingLeft: sidePad,
        justifyContent: "center",
      }}
    >
      <View style={{ width: textWidth, maxWidth: textWidth, gap: spacing.sm, zIndex: 1 }}>
        <Typography variant="body" color={pal.onWine} numberOfLines={1}>
          Total a pagar
        </Typography>
        <Typography
          variant={amountVariant}
          color={pal.onWine}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ width: "100%", fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(amount)}
        </Typography>
        <Typography variant="body" color={pal.onWine} numberOfLines={2}>
          {pendingCountLabel(pendingCount)}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: radii.full,
              backgroundColor: pal.lime,
            }}
          />
          <Typography variant="caption" color={pal.onWine}>
            Este mês
          </Typography>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: HERO_IMAGE_RIGHT,
          bottom: HERO_IMAGE_BOTTOM,
          width: imageSize,
          height: imageSize,
        }}
      >
        <Image
          source={comprasHero3d}
          resizeMode="contain"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no"
          accessibilityIgnoresInvertColors
          style={{ width: "100%", height: "100%", objectFit: "contain" } as ImageStyle}
        />
      </View>
    </View>
  );
}

function PurchaseFilterChip({
  label,
  selected,
  onPress,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
}>) {
  const pal = useBrandScreenPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? pal.softRose : pal.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: pal.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Typography variant="bodyBold" color={selected ? pal.wine : pal.ink}>
        {label}
      </Typography>
    </Pressable>
  );
}

/**
 * Tela de apresentação pra quem não tem o plano Profissional: explica o que
 * Compras faz + CTA de upgrade, sem exibir o formulário (que não salvaria).
 */
function PurchasesPremiumGate({ onUnlock }: Readonly<{ onUnlock: () => void }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const benefits = [
    "Registre tudo que compra dos fornecedores em um só lugar.",
    "Acompanhe as contas a pagar sem esquecer nenhuma data.",
    "Cada compra paga já lança a saída certa no seu caixa.",
  ];

  return (
    <View
      style={{
        backgroundColor: pal.white,
        borderColor: theme.colors.premium,
        borderWidth: 1,
        borderRadius: radii.xl,
        gap: spacing.md,
        padding: spacing.xl,
      }}
    >
      <Badge label="Recurso Profissional" variant="premium" />
      <Typography variant="h2" color={pal.ink}>
        Compras de fornecedor organizadas
      </Typography>
      <Typography variant="body" color={pal.muted}>
        Registre o que você compra dos fornecedores e acompanhe contas a pagar e caixa
        automaticamente.
      </Typography>
      {benefits.map((benefit) => (
        <View
          key={benefit}
          style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
        >
          <AppIcon name="checkmark-circle" size={20} color={theme.colors.premium} />
          <Typography variant="body" color={pal.ink} style={{ flex: 1, lineHeight: 20 }}>
            {benefit}
          </Typography>
        </View>
      ))}
      <Button
        title="Desbloquear no Profissional"
        variant="premium"
        icon={
          <AppIcon
            name="lock-open-outline"
            size={20}
            color={theme.colors.textOnPrimary}
          />
        }
        onPress={onUnlock}
        style={{ backgroundColor: pal.rose }}
      />
    </View>
  );
}
