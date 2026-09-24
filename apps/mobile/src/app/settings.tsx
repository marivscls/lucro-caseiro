import { useFormValidation } from "../shared/hooks/use-form-validation";
import {
  Badge,
  Button,
  Card,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { hasActiveFeature, PLAN_LABELS } from "@lucro-caseiro/contracts";
import * as Clipboard from "expo-clipboard";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDeleteAccount } from "../features/account/hooks";
import { BusinessProfileCard } from "../features/onboarding/business-profile";
import { paidAccountDeletionCopy } from "../features/account/delete-account-copy";
import { ProlaboreGoalForm } from "../features/goals/components/prolabore-goal-form";
import { formatCurrency } from "../features/goals/domain";
import { useProlaboreStatus } from "../features/goals/hooks";
import {
  BUSINESS_PROFILE_OPTIONS,
  businessCopyFor,
} from "../features/subscription/business-copy";
import { activePlan, useProfile, useUpdateProfile } from "../features/subscription/hooks";
import { useSubscription } from "../features/subscription/use-subscription";
import { getBrandDisplayName } from "../shared/brand-name";
import { showAlert } from "../shared/components/alert-store";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { FormField, TextField, useFieldPalette } from "../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../shared/components/form-layout";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { useAuth } from "../shared/hooks/use-auth";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "../shared/hooks/notification-types";
import { isPrefEnabled, useNotificationPrefs } from "../shared/hooks/notification-prefs";
import { useBrowserNotifications } from "../shared/hooks/use-browser-notifications";
import { usePaywall } from "../shared/hooks/use-paywall";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { DesktopSplit, desktopPageContent } from "../shared/layout/desktop-page";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { ApiError } from "../shared/utils/api-client";
import { alertError } from "../shared/utils/alerts";
import { maskPhoneBR } from "../shared/utils/phone";
import { uploadProfilePhoto } from "../shared/utils/upload-image";
import {
  openSubscriptionManagement,
  subscriptionManagementTarget,
} from "../shared/utils/subscription-management";
import { DesktopTag } from "../shared/layout/desktop-kit";

const PRIVACY_POLICY_URL =
  "https://www.orionseven.com.br/lucro-caseiro/politica-de-privacidade";
const LUCRO_CASEIRO_WEB_APP_URL = "https://app.lucrocaseiro.com.br";

const BUSINESS_TYPES = BUSINESS_PROFILE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.shortLabel,
}));

const NOTIFICATIONS: {
  type: NotificationType;
  label: string;
  icon: AppIconName;
  premium?: boolean;
}[] = [
  {
    type: NOTIFICATION_TYPES.PENDING_SALES,
    label: "Vendas pendentes",
    icon: "receipt-outline",
  },
  {
    type: NOTIFICATION_TYPES.LOW_STOCK,
    label: "Estoque baixo",
    icon: "alert-circle-outline",
  },
  {
    type: NOTIFICATION_TYPES.DELIVERY,
    label: "Lembretes de entrega",
    icon: "cube-outline",
  },
  {
    type: NOTIFICATION_TYPES.CLIENT_BIRTHDAY,
    label: "Aniversários de clientes",
    icon: "gift-outline",
    premium: true,
  },
  {
    type: NOTIFICATION_TYPES.DAILY_REMINDER,
    label: "Lembretes diários",
    icon: "notifications-outline",
    premium: true,
  },
  {
    type: NOTIFICATION_TYPES.WEEKLY_SUMMARY,
    label: "Resumo semanal",
    icon: "bar-chart-outline",
    premium: true,
  },
];

function businessTypeLabel(value: string): string {
  return BUSINESS_TYPES.find((type) => type.value === value)?.label ?? value;
}

function businessTypeValue(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return (
    BUSINESS_TYPES.find(
      (type) =>
        type.value === trimmed || type.label.toLowerCase() === trimmed.toLowerCase(),
    )?.value ?? trimmed
  );
}

/**
 * Escolha única com mais de 4 opções: chips no mesmo visual das categorias do
 * cadastro de produto (44 px, borda do campo, selecionado em vinho).
 */
function ChoiceChips<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel,
}: Readonly<{
  value: T | "";
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: spacing.lg,
              justifyContent: "center",
              borderRadius: radii.full,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primaryStrong : pal.border,
              backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Typography
              variant="body"
              color={selected ? theme.colors.primaryStrong : theme.colors.text}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

type IconSurfaceProps = Readonly<{
  name: AppIconName;
  color: string;
  backgroundColor: string;
  size?: number;
  iconSize?: number;
}>;

function IconSurface({
  name,
  color,
  backgroundColor,
  size = 40,
  iconSize = 22,
}: IconSurfaceProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.md,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AppIcon name={name} size={iconSize} color={color} strokeWidth={1.8} />
    </View>
  );
}

type SettingsRowProps = Readonly<{
  icon: AppIconName;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  onPress: () => void;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}>;

function SettingsRow({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  titleColor,
  onPress,
  trailing,
  showChevron = false,
  disabled = false,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        minHeight: 60,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        borderRadius: radii.md,
        backgroundColor: pressed ? theme.colors.surface : "transparent",
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <IconSurface
        name={icon}
        color={iconColor}
        backgroundColor={iconBackground}
        size={38}
        iconSize={20}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyBold" color={titleColor ?? theme.colors.text}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant={isDesktop ? "desktopBody" : "caption"}
            color={theme.colors.textSecondary}
          >
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {trailing}
      {showChevron ? (
        <AppIcon
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
          strokeWidth={2}
        />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useTheme();
  const brand = useBrand();
  const brandName = getBrandDisplayName(brand);
  const hasStock = useFeature("estoque");
  const hasScheduling = useFeature("agendamento");
  const isDesktop = useDesktopLayout();
  const { signOut } = useAuth();
  const showPaywall = usePaywall((state) => state.show);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { restore, loading: subscriptionLoading } = useSubscription();
  const { data: prolabore } = useProlaboreStatus();
  const deleteAccount = useDeleteAccount();

  const [showGoal, setShowGoal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDesktopAccess, setShowDesktopAccess] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const {
    imageUri: pickedAvatar,
    showPicker: pickAvatar,
    clear: clearPickedAvatar,
  } = useImagePicker();
  const [savingAvatar, setSavingAvatar] = useState(false);
  const notifPrefs = useNotificationPrefs((state) => state.prefs);
  const setNotifPref = useNotificationPrefs((state) => state.setPref);
  const browserNotifications = useBrowserNotifications();

  const userName = profile?.name ?? "...";
  const businessName = profile?.businessName ?? "Meu negócio";
  const businessType = profile?.businessType ?? "";
  const experienceCopy = businessCopyFor(businessType);
  const avatarUrl = profile?.avatarUrl ?? null;
  const currentPlan = activePlan(profile);
  const hasPaidPlan = currentPlan !== "free";
  const canUsePremiumNotifications =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "premiumNotifications");
  const appVersion = "v1.0.0";
  const configuredWebAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim();
  const webAppUrl =
    configuredWebAppUrl ||
    (brand.id === "lucro-caseiro" ? LUCRO_CASEIRO_WEB_APP_URL : undefined);

  async function copyWebAppUrl() {
    if (!webAppUrl) return;
    try {
      await Clipboard.setStringAsync(webAppUrl);
      showAlert({
        title: "Endereço copiado!",
        message: "Agora é só colar no navegador do computador.",
      });
    } catch {
      alertError("Não foi possível copiar o endereço. Tente novamente.");
    }
  }

  async function shareWebAppUrl() {
    if (!webAppUrl) return;
    try {
      await Share.share({
        title: `Usar ${brandName} no computador`,
        message: `Acesse ${brandName} pelo computador e entre com a mesma conta: ${webAppUrl}`,
      });
    } catch {
      alertError("Não foi possível compartilhar o endereço. Tente novamente.");
    }
  }

  function openEditProfile() {
    setEditName(profile?.name ?? "");
    setEditBusinessName(profile?.businessName ?? "");
    setEditBusinessType(profile?.businessType ?? "");
    setEditPhone(profile?.phone ?? "");
    clearPickedAvatar();
    setShowEditProfile(true);
  }

  const formValidation = useFormValidation({
    editName: !editName.trim() && "Informe seu nome.",
  });

  async function handleSaveProfile() {
    if (!formValidation.validate()) return;

    let newAvatarUrl: string | undefined;
    if (pickedAvatar) {
      try {
        setSavingAvatar(true);
        newAvatarUrl = await uploadProfilePhoto(pickedAvatar);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message:
            "Não consegui enviar a foto agora. Vou salvar o resto do perfil. Tente a foto depois.",
        });
      } finally {
        setSavingAvatar(false);
      }
    }

    try {
      await updateProfile.mutateAsync({
        name: editName.trim(),
        businessName: editBusinessName.trim() || undefined,
        businessType: businessTypeValue(editBusinessType),
        phone: editPhone.trim() || undefined,
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      });
      showAlert({ title: "Perfil atualizado!" });
      setShowEditProfile(false);
    } catch {
      alertError("Não foi possível atualizar o perfil.");
    }
  }

  function handleLogout() {
    showAlert({
      title: "Sair",
      message: "Tem certeza que deseja sair?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void signOut().finally(() => router.replace("/(auth)/login"));
          },
        },
      ],
    });
  }

  async function runDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      router.replace("/(auth)/login");
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        await signOut();
        router.replace("/(auth)/login");
        return;
      }
      alertError(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta. Tente novamente.",
      );
    }
  }

  function showDeleteAccountWarning() {
    let finalMessage =
      "Ao confirmar, sua conta e todos os dados serão apagados para sempre.";
    if (hasPaidPlan) {
      finalMessage +=
        " Você também confirma que cancelou a assinatura antes de continuar.";
    }

    showAlert({
      title: "Excluir conta",
      message:
        "Isso apaga definitivamente sua conta e todos os seus dados: vendas, clientes, finanças, produtos e receitas. Não tem como desfazer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            showAlert({
              title: "Tem certeza?",
              message: finalMessage,
              buttons: [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sim, excluir",
                  style: "destructive",
                  onPress: () => void runDeleteAccount(),
                },
              ],
            });
          },
        },
      ],
    });
  }

  function handleDeleteAccount() {
    if (!hasPaidPlan) {
      showDeleteAccountWarning();
      return;
    }

    const target = subscriptionManagementTarget();
    const copy = paidAccountDeletionCopy(PLAN_LABELS[currentPlan], target.providerLabel);
    showAlert({
      ...copy,
      buttons: [
        { text: "Voltar", style: "cancel" },
        {
          text: target.actionLabel,
          onPress: () => void openSubscriptionManagement(),
        },
        {
          text: "Já cancelei",
          onPress: showDeleteAccountWarning,
        },
      ],
    });
  }

  async function openPrivacyPolicy() {
    const canOpen = await Linking.canOpenURL(PRIVACY_POLICY_URL);
    if (!canOpen) {
      alertError("Não foi possível abrir a política de privacidade.");
      return;
    }
    await Linking.openURL(PRIVACY_POLICY_URL);
  }

  // Desktop: o plano fica na lateral de 360px, onde botões de largura total cabem.
  const planButtonStyle = isDesktop
    ? { width: "100%" as const, minHeight: 48 }
    : undefined;

  function renderPlanActions() {
    const actionRowStyle = isDesktop
      ? {
          flexDirection: "row" as const,
          flexWrap: "wrap" as const,
          gap: spacing.md,
          alignItems: "center" as const,
        }
      : { gap: spacing.sm };

    if (currentPlan === "free") {
      return (
        <View style={actionRowStyle}>
          <Button
            title="Conhecer os planos"
            variant="premium"
            size="md"
            icon={
              <AppIcon
                name="crown-outline"
                size={19}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => router.push("/plans")}
            style={planButtonStyle}
          />
          <Pressable
            onPress={() => void restore()}
            disabled={subscriptionLoading}
            accessibilityRole="button"
            accessibilityLabel="Restaurar compra anterior"
            style={{
              minHeight: isDesktop ? 48 : 36,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: isDesktop ? "flex-start" : "center",
              gap: spacing.sm,
            }}
          >
            <AppIcon
              name="sync-circle-outline"
              size={17}
              color={theme.colors.primaryStrong}
            />
            <Typography
              variant={isDesktop ? "desktopBodyStrong" : "caption"}
              color={theme.colors.primaryStrong}
            >
              {subscriptionLoading ? "Restaurando..." : "Restaurar compra anterior"}
            </Typography>
          </Pressable>
        </View>
      );
    }

    if (currentPlan === "essential") {
      return (
        <View style={actionRowStyle}>
          <Button
            title="Fazer upgrade para Profissional"
            variant="premium"
            size="md"
            icon={
              <AppIcon
                name="crown-outline"
                size={19}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => showPaywall("plans", "professional")}
            style={planButtonStyle}
          />
          <Button
            title="Gerenciar assinatura"
            variant="outline"
            size="md"
            icon={
              <AppIcon
                name="settings-outline"
                size={19}
                color={theme.colors.primaryStrong}
              />
            }
            onPress={() => router.push("/plans")}
            style={planButtonStyle}
          />
        </View>
      );
    }

    return (
      <Button
        title="Gerenciar assinatura"
        variant="outline"
        size="md"
        icon={
          <AppIcon name="settings-outline" size={19} color={theme.colors.primaryStrong} />
        }
        onPress={() => router.push("/plans")}
        style={planButtonStyle}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          ...pageGutter(isDesktop),
          paddingVertical: spacing.xl,
          gap: spacing.lg,
        }}
        edges={["bottom"]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <Skeleton width={50} height={50} borderRadius={radii.full} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="70%" height={12} />
          </View>
        </View>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </SafeAreaView>
    );
  }

  const profileSection = (
    <>
      <Card variant="elevated" padding="xl" style={{ gap: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 58, height: 58 }} />
            ) : (
              <Typography variant="h2" color={theme.colors.primaryStrong}>
                {userName.charAt(0).toUpperCase()}
              </Typography>
            )}
          </View>

          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="h3" numberOfLines={1}>
              {userName}
            </Typography>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant={isDesktop ? "desktopBody" : "caption"}
                numberOfLines={1}
              >
                {businessName}
              </Typography>
              {businessType && isDesktop ? (
                // Desktop: mesmo selo do Badge, com texto de 14px.
                <DesktopTag
                  label={businessTypeLabel(businessType)}
                  variant="primary"
                  strong
                />
              ) : null}
              {businessType && !isDesktop ? (
                <Badge label={businessTypeLabel(businessType)} variant="primary" />
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={openEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={({ pressed }) => ({
              minHeight: 44,
              width: isDesktop ? undefined : 44,
              paddingHorizontal: isDesktop ? spacing.md : 0,
              borderRadius: radii.md,
              backgroundColor: pressed ? theme.colors.primaryBg : theme.colors.surface,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            })}
          >
            <AppIcon name="pencil-outline" size={17} color={theme.colors.primaryStrong} />
            {isDesktop ? (
              <Typography variant="body" color={theme.colors.text}>
                Editar perfil
              </Typography>
            ) : null}
          </Pressable>
        </View>
        {brand.id === "lucro-caseiro" ? <BusinessProfileCard settings /> : null}
      </Card>
    </>
  );
  const planSection = (
    <>
      <Card variant="elevated" padding="xl" style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.lg }}>
          <IconSurface
            name="diamond-outline"
            size={42}
            iconSize={24}
            color={theme.colors.premium}
            backgroundColor={theme.colors.premiumBg}
          />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography
              variant={isDesktop ? "desktopMeta" : "caption"}
              color={theme.colors.textSecondary}
            >
              Seu plano
            </Typography>
            <Typography variant="h2">
              {hasPaidPlan ? PLAN_LABELS[currentPlan] : "Gratuito"}
            </Typography>
            <Typography
              variant={isDesktop ? "desktopBody" : "caption"}
              color={theme.colors.textSecondary}
              style={{ maxWidth: 440 }}
            >
              {hasPaidPlan
                ? `Seus recursos ${brandName} em um só lugar.`
                : "Conheça os recursos para facilitar sua rotina."}
            </Typography>
          </View>
        </View>
        {renderPlanActions()}
      </Card>
    </>
  );
  const goalSection = (
    <>
      <Card
        variant="elevated"
        padding="lg"
        onPress={() => setShowGoal(true)}
        style={{ paddingVertical: spacing.md }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <IconSurface
            name="trophy-outline"
            color={theme.colors.success}
            backgroundColor={theme.colors.successBg}
          />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold">Meta de pró-labore</Typography>
            <Typography variant={isDesktop ? "desktopBody" : "caption"}>
              {prolabore?.config
                ? `${formatCurrency(prolabore.config.monthlyProlaboreGoal)} por mês`
                : "Defina quanto quer receber por mês"}
            </Typography>
          </View>
          <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
      </Card>
    </>
  );
  const prefsSection = (
    <>
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Typography
          variant={isDesktop ? "desktopCardTitle" : "label"}
          style={isDesktop ? undefined : { marginLeft: spacing.xs }}
        >
          Preferências
        </Typography>
        <Card
          variant="elevated"
          padding="lg"
          style={{
            overflow: "hidden",
            paddingVertical: spacing.xs,
          }}
        >
          <View
            style={{
              minHeight: 70,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.xs,
            }}
          >
            <IconSurface
              name="sunny-outline"
              color={theme.colors.textSecondary}
              backgroundColor={theme.colors.surface}
              size={38}
              iconSize={19}
            />
            <Typography variant="bodyBold" style={{ flex: 1 }}>
              Tema
            </Typography>
            <View
              style={{
                width: isDesktop ? 184 : 132,
                height: isDesktop ? 48 : 44,
                padding: 3,
                flexDirection: "row",
                borderRadius: radii.sm,
                backgroundColor: theme.colors.surface,
              }}
            >
              {(["light", "dark"] as const).map((option) => {
                const selected = option === mode;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      if (!selected) toggleTheme();
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    aria-pressed={selected}
                    accessibilityLabel={option === "light" ? "Tema claro" : "Tema escuro"}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: radii.sm,
                      borderWidth: selected ? 1 : 0,
                      borderColor: theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.surfaceElevated
                        : "transparent",
                    }}
                  >
                    <Typography
                      variant={isDesktop ? "desktopBodyStrong" : "caption"}
                      color={
                        selected ? theme.colors.primaryStrong : theme.colors.textSecondary
                      }
                    >
                      {option === "light" ? "Claro" : "Escuro"}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {Platform.OS === "web" ? (
            <View
              style={{
                minHeight: 82,
                paddingVertical: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingHorizontal: spacing.xs,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              }}
            >
              <IconSurface
                name="notifications-outline"
                color={theme.colors.textSecondary}
                backgroundColor={theme.colors.surface}
                size={38}
                iconSize={19}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="bodyBold">Notificações no navegador</Typography>
                <Typography
                  variant={isDesktop ? "desktopBody" : "caption"}
                  accessibilityLiveRegion="polite"
                >
                  {browserNotifications.message}
                </Typography>
                {browserNotifications.supported ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                    }}
                  >
                    <Button
                      title={
                        browserNotifications.enabled ? "Desativar" : "Ativar notificações"
                      }
                      loading={browserNotifications.busy}
                      size="sm"
                      variant={browserNotifications.enabled ? "outline" : "primary"}
                      disabled={
                        browserNotifications.busy || !browserNotifications.publicKey
                      }
                      onPress={() => void browserNotifications.toggle()}
                    />
                    {browserNotifications.enabled ? (
                      <Button
                        title="Enviar teste"
                        size="sm"
                        variant="outline"
                        disabled={browserNotifications.busy}
                        onPress={() => void browserNotifications.test()}
                      />
                    ) : (
                      <Button
                        title="Verificar novamente"
                        size="sm"
                        variant="outline"
                        disabled={browserNotifications.busy}
                        onPress={() => void browserNotifications.refresh()}
                      />
                    )}
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
          {Platform.OS !== "web" || browserNotifications.enabled
            ? NOTIFICATIONS.filter((item) => {
                if (item.type === NOTIFICATION_TYPES.LOW_STOCK) return hasStock;
                if (item.type === NOTIFICATION_TYPES.DELIVERY) return hasScheduling;
                return true;
              }).map((item) => {
                const locked = !!item.premium && !canUsePremiumNotifications;
                return (
                  <View
                    key={item.type}
                    style={{
                      minHeight: 58,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      paddingHorizontal: spacing.xs,
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.border,
                    }}
                  >
                    <IconSurface
                      name={item.icon}
                      color={theme.colors.textSecondary}
                      backgroundColor={theme.colors.surface}
                      size={38}
                      iconSize={18}
                    />
                    <View style={{ flex: 1 }}>
                      <Typography variant="bodyBold">{item.label}</Typography>
                      {item.premium ? (
                        <Typography variant="caption" color={theme.colors.premium}>
                          Profissional
                        </Typography>
                      ) : null}
                    </View>
                    {locked ? (
                      <Pressable
                        onPress={() => showPaywall("notifications")}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label}, recurso Profissional`}
                        style={{
                          width: 44,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppIcon
                          name="lock-closed"
                          size={18}
                          color={theme.colors.premium}
                        />
                      </Pressable>
                    ) : (
                      <Switch
                        disabled={Platform.OS === "web" && browserNotifications.busy}
                        accessibilityLabel={item.label}
                        trackColor={{
                          false: theme.colors.surface,
                          true: theme.colors.primaryInteractive,
                        }}
                        thumbColor={theme.colors.textOnPrimary}
                        value={isPrefEnabled(notifPrefs, item.type)}
                        onValueChange={(value) => {
                          if (Platform.OS === "web")
                            void browserNotifications.setPreference(item.type, value);
                          else setNotifPref(item.type, value);
                        }}
                      />
                    )}
                  </View>
                );
              })
            : null}
        </Card>
      </View>
    </>
  );
  const supportSection = (
    <>
      <Card variant="elevated" padding="lg">
        <SettingsRow
          icon="chatbubble-ellipses-outline"
          iconColor={theme.colors.textSecondary}
          iconBackground={theme.colors.surface}
          title="Suporte"
          subtitle="Tire suas dúvidas e fale com a gente"
          onPress={() => router.push("/support")}
          showChevron
        />
      </Card>
    </>
  );
  const desktopAccessSection = (
    <>
      {Platform.OS !== "web" && webAppUrl ? (
        <Card variant="elevated" padding="lg">
          <SettingsRow
            icon="globe-outline"
            iconColor={theme.colors.primary}
            iconBackground={theme.colors.primaryBg}
            title="Usar no computador"
            subtitle="Acesse seus dados em qualquer computador"
            onPress={() => setShowDesktopAccess(true)}
            showChevron
          />
        </Card>
      ) : null}
    </>
  );
  const privacySection = (
    <>
      <View
        style={{
          gap: spacing.xl,
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Typography
            variant={isDesktop ? "desktopCardTitle" : "label"}
            style={isDesktop ? undefined : { marginLeft: spacing.xs }}
          >
            Privacidade
          </Typography>
          <Card variant="elevated" padding="lg" style={{ paddingVertical: spacing.xs }}>
            <SettingsRow
              icon="shield-checkmark-outline"
              iconColor={theme.colors.textSecondary}
              iconBackground={theme.colors.surface}
              title="Política de privacidade"
              onPress={() => void openPrivacyPolicy()}
              showChevron
            />
            <SettingsRow
              icon="document-text-outline"
              iconColor={theme.colors.textSecondary}
              iconBackground={theme.colors.surface}
              title="Termos de uso"
              onPress={() =>
                showAlert({
                  title: "Termos de uso",
                  message: "Consulte os termos de uso no site oficial do Lucro Caseiro.",
                })
              }
              showChevron
            />
          </Card>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Typography
            variant={isDesktop ? "desktopCardTitle" : "label"}
            style={isDesktop ? undefined : { marginLeft: spacing.xs }}
          >
            Conta
          </Typography>
          <Card variant="elevated" padding="lg" style={{ paddingVertical: spacing.xs }}>
            <SettingsRow
              icon="log-out-outline"
              iconColor={theme.colors.textSecondary}
              iconBackground={theme.colors.surface}
              title="Sair da conta"
              onPress={handleLogout}
              showChevron
            />
            <SettingsRow
              icon="trash-outline"
              iconColor={theme.colors.alert}
              iconBackground={theme.colors.alertBg}
              title={deleteAccount.isPending ? "Excluindo conta..." : "Excluir conta"}
              titleColor={theme.colors.alert}
              onPress={handleDeleteAccount}
              disabled={deleteAccount.isPending}
              trailing={
                deleteAccount.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.alert} />
                ) : null
              }
              showChevron={!deleteAccount.isPending}
            />
          </Card>
        </View>
      </View>
    </>
  );
  const versionSection = (
    <>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center" }}
      >
        {appVersion}
      </Typography>
    </>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Configurações"
        subtitle="Seu negócio e o app, do seu jeito"
        fallbackRoute="/tabs/more"
        hideBack={isDesktop}
        backButtonStyle={{
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
        }}
        style={{
          paddingHorizontal: isDesktop ? 0 : 18,
          paddingTop: spacing.xs,
          paddingBottom: spacing.md,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isDesktop
            ? desktopPageContent(true)
            : [
                {
                  ...pageGutter(isDesktop, 18),
                  gap: spacing.lg,
                  paddingTop: spacing.sm,
                  paddingBottom: isDesktop ? spacing.xl : 112,
                },
                desktopStretch(isDesktop, desktopWidths.wide),
              ]
        }
      >
        {isDesktop ? (
          <DesktopSplit
            aside={
              <>
                {planSection}
                {goalSection}
                {supportSection}
                {privacySection}
                {versionSection}
              </>
            }
          >
            {profileSection}
            {prefsSection}
          </DesktopSplit>
        ) : (
          <>
            {profileSection}
            {planSection}
            {goalSection}
            {prefsSection}
            {supportSection}
            {desktopAccessSection}
            {privacySection}
            {versionSection}
          </>
        )}
      </ScrollView>

      <ProlaboreGoalForm
        config={prolabore?.config ?? null}
        visible={showGoal}
        onClose={() => setShowGoal(false)}
        onSuccess={() => setShowGoal(false)}
      />

      {webAppUrl ? (
        <StandardModal
          title="Usar no computador"
          subtitle={brandName}
          visible={showDesktopAccess}
          onClose={() => setShowDesktopAccess(false)}
          footer={
            <>
              <Button
                title="Copiar endereço"
                variant="outline"
                size="lg"
                onPress={() => void copyWebAppUrl()}
                style={{ flex: 1 }}
              />
              <Button
                title="Compartilhar link"
                size="lg"
                onPress={() => void shareWebAppUrl()}
                style={{ flex: 1 }}
              />
            </>
          }
        >
          <View style={{ alignItems: "center", gap: spacing.lg }}>
            <IconSurface
              name="globe-outline"
              color={theme.colors.primary}
              backgroundColor={theme.colors.primaryBg}
              size={56}
              iconSize={28}
            />
            <View style={{ alignItems: "center", gap: spacing.sm }}>
              <Typography variant="body" style={{ textAlign: "center" }}>
                No computador, abra este endereço e entre com a mesma conta que você usa
                no aplicativo.
              </Typography>
              <View
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Typography
                  variant="bodyBold"
                  color={theme.colors.primaryStrong}
                  selectable
                  style={{ textAlign: "center" }}
                >
                  {webAppUrl.replace(/^https?:\/\//, "")}
                </Typography>
              </View>
            </View>
          </View>
        </StandardModal>
      ) : null}

      <StandardModal
        title="Editar perfil"
        size="form"
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        dismissDisabled={updateProfile.isPending || savingAvatar}
        footer={
          <FormActions>
            <Button
              title="Cancelar"
              variant="outline"
              disabled={updateProfile.isPending || savingAvatar}
              onPress={() => setShowEditProfile(false)}
            />
            <Button
              title={savingAvatar ? "Enviando foto…" : "Salvar perfil"}
              onPress={() => void handleSaveProfile()}
              loading={updateProfile.isPending || savingAvatar}
            />
          </FormActions>
        }
      >
        <FormBody>
          <View style={{ alignItems: "center" }}>
            <Pressable
              onPress={pickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Adicionar foto do negócio"
              style={{ alignItems: "center" }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: radii.full,
                  backgroundColor: theme.colors.primaryBg,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {pickedAvatar || avatarUrl ? (
                  <Image
                    source={{ uri: pickedAvatar ?? avatarUrl ?? undefined }}
                    style={{ width: 96, height: 96 }}
                  />
                ) : (
                  <Typography variant="h1" color={theme.colors.primary}>
                    {editName.charAt(0) || "?"}
                  </Typography>
                )}
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 32,
                    height: 32,
                    borderRadius: radii.full,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: theme.colors.background,
                  }}
                >
                  <AppIcon name="camera" size={16} color={theme.colors.textOnPrimary} />
                </View>
              </View>
              <Typography
                variant="bodyBold"
                color={theme.colors.primaryStrong}
                style={{ marginTop: spacing.sm }}
              >
                {pickedAvatar || avatarUrl ? "Alterar foto" : "Adicionar foto"}
              </Typography>
            </Pressable>
          </View>

          <FormGrid>
            <FormField label="Seu nome" validation={formValidation.field("editName")}>
              <TextField
                icon="person-outline"
                placeholder="Seu nome"
                accessibilityLabel="Seu nome"
                value={editName}
                onChangeText={setEditName}
              />
            </FormField>
            <FormField label="Telefone" optional>
              <TextField
                icon="call-outline"
                placeholder="Ex: (11) 99999-9999"
                accessibilityLabel="Telefone"
                value={editPhone}
                onChangeText={(value: string) => setEditPhone(maskPhoneBR(value))}
                keyboardType="phone-pad"
              />
            </FormField>
            <FormField label="Nome do negócio" optional span="full">
              <TextField
                icon="storefront-outline"
                placeholder={`Ex: ${experienceCopy.businessNameExample}`}
                accessibilityLabel="Nome do negocio"
                value={editBusinessName}
                onChangeText={setEditBusinessName}
              />
            </FormField>
            <FormField label="Tipo de negócio" optional span="full">
              <ChoiceChips
                value={editBusinessType}
                options={BUSINESS_TYPES}
                onChange={setEditBusinessType}
                accessibilityLabel="Tipo de negócio"
              />
            </FormField>
          </FormGrid>
        </FormBody>
      </StandardModal>
    </SafeAreaView>
  );
}
