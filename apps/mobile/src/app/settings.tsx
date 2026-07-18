import {
  Badge,
  Button,
  Card,
  Chip,
  Typography,
  useFeature,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { hasActiveFeature, PLAN_LABELS } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../shared/hooks/use-auth";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "../shared/hooks/notification-types";
import { useNotificationPrefs, isPrefEnabled } from "../shared/hooks/notification-prefs";
import { ApiError } from "../shared/utils/api-client";
import { uploadProfilePhoto } from "../shared/utils/upload-image";
import { maskPhoneBR } from "../shared/utils/phone";
import { useDeleteAccount } from "../features/account/hooks";
import { ProlaboreGoalForm } from "../features/goals/components/prolabore-goal-form";
import { formatCurrency } from "../features/goals/domain";
import { useProlaboreStatus } from "../features/goals/hooks";
import { activePlan, useProfile, useUpdateProfile } from "../features/subscription/hooks";
import { useSubscription } from "../features/subscription/use-subscription";
import { showAlert } from "../shared/components/alert-store";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { ResponsiveModal } from "../shared/components/responsive-modal-surface";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopAction, desktopContained } from "../shared/layout/desktop-density";
import { FieldLabel, TextFieldCard } from "../shared/components/form-field";
import { ScreenHeader } from "../shared/components/screen-header";
import { alertValidation, alertError } from "../shared/utils/alerts";

const PRIVACY_POLICY_URL =
  "https://www.orionseven.com.br/lucro-caseiro/politica-de-privacidade";

const BUSINESS_TYPES = [
  { value: "food", label: "Alimentação" },
  { value: "beauty", label: "Beleza" },
  { value: "crafts", label: "Artesanato" },
  { value: "services", label: "Serviços" },
  { value: "other", label: "Outro" },
] as const;

const NOTIFICATIONS: {
  type: NotificationType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  premium?: boolean;
}[] = [
  // Free
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
  // Profissional
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

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useTheme();
  const hasStock = useFeature("estoque");
  const hasScheduling = useFeature("agendamento");
  const isDesktop = useDesktopLayout();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { restore, loading: subscriptionLoading } = useSubscription();
  const { data: prolabore } = useProlaboreStatus();
  const deleteAccount = useDeleteAccount();

  const [showGoal, setShowGoal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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
  const notifPrefs = useNotificationPrefs((s) => s.prefs);
  const setNotifPref = useNotificationPrefs((s) => s.setPref);

  const userName = profile?.name ?? "...";
  const businessName = profile?.businessName ?? "Meu negócio";
  const businessType = profile?.businessType ?? "";
  const avatarUrl = profile?.avatarUrl ?? null;
  const currentPlan = activePlan(profile);
  const hasPaidPlan = currentPlan !== "free";
  const canUsePremiumNotifications =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "premiumNotifications");
  const hasPrioritySupport =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "prioritySupport");
  const appVersion = "v1.0.0";

  function openEditProfile() {
    setEditName(profile?.name ?? "");
    setEditBusinessName(profile?.businessName ?? "");
    setEditBusinessType(profile?.businessType ?? "");
    setEditPhone(profile?.phone ?? "");
    clearPickedAvatar();
    setShowEditProfile(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      alertValidation("O nome é obrigatório");
      return;
    }

    // Sobe a foto nova (se escolhida); se falhar, salva o resto sem trocar a foto.
    let avatarUrl: string | undefined;
    if (pickedAvatar) {
      try {
        setSavingAvatar(true);
        avatarUrl = await uploadProfilePhoto(pickedAvatar);
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
        ...(avatarUrl ? { avatarUrl } : {}),
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
            void signOut().then(() => {
              router.replace("/(auth)/login");
            });
          },
        },
      ],
    });
  }

  async function runDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      // Sucesso: o hook ja encerrou a sessao e limpou o cache.
      router.replace("/(auth)/login");
    } catch (e: unknown) {
      // 401 = o usuario nao existe mais no Auth (conta ja removida numa tentativa
      // anterior) ou a sessao expirou. Em ambos os casos o destino e o login —
      // encerra a sessao local em vez de mostrar um erro sem saida.
      if (e instanceof ApiError && e.status === 401) {
        await signOut();
        router.replace("/(auth)/login");
        return;
      }
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível excluir a conta. Tente novamente.";
      alertError(message);
    }
  }

  function handleDeleteAccount() {
    // Confirmacao em dois toques: aviso claro de que e definitivo.
    showAlert({
      title: "Excluir conta",
      message:
        "Isso apaga DEFINITIVAMENTE sua conta e todos os seus dados (vendas, clientes, finanças, produtos e receitas). Não tem como desfazer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            showAlert({
              title: "Tem certeza?",
              message:
                "Esta é sua última chance. Ao confirmar, sua conta e todos os dados serão apagados para sempre.",
              buttons: [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sim, excluir",
                  style: "destructive",
                  onPress: () => {
                    void runDeleteAccount();
                  },
                },
              ],
            });
          },
        },
      ],
    });
  }

  async function openPrivacyPolicy() {
    const canOpen = await Linking.canOpenURL(PRIVACY_POLICY_URL);
    if (!canOpen) {
      alertError("Não foi possível abrir a politica de privacidade.");
      return;
    }
    await Linking.openURL(PRIVACY_POLICY_URL);
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["bottom"]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {!isDesktop && <ScreenHeader title="Configurações" />}
      <ScrollView
        contentContainerStyle={[
          { padding: 20, gap: 20, paddingBottom: 40 },
          desktopContained(isDesktop),
        ]}
      >
        {/* Profile Card */}
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 56, height: 56 }} />
              ) : (
                <Typography variant="h2" color={theme.colors.primary}>
                  {userName.charAt(0)}
                </Typography>
              )}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Typography variant="h3" numberOfLines={2}>
                {userName}
              </Typography>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="caption">{businessName}</Typography>
                {businessType ? (
                  <Badge label={businessTypeLabel(businessType)} variant="primary" />
                ) : null}
              </View>
            </View>

            <Pressable
              onPress={openEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <Typography variant="bodyBold" color={theme.colors.text}>
                Editar
              </Typography>
            </Pressable>
          </View>
        </Card>

        {/* Plan Card */}
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.premiumBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="diamond-outline" size={20} color={theme.colors.premium} />
              </View>
              <View>
                <Typography variant="h3">Plano Lucro Caseiro</Typography>
                <Typography variant="caption">
                  {hasPaidPlan ? `${PLAN_LABELS[currentPlan]} ativo` : "Plano gratuito"}
                </Typography>
              </View>
            </View>
          </View>

          {!hasPaidPlan && (
            <View style={{ gap: 8, marginTop: 16 }}>
              <Button
                title="Conhecer os planos"
                variant="premium"
                size="md"
                onPress={() => router.push("/plans")}
              />
              <Pressable
                onPress={() => void restore()}
                disabled={subscriptionLoading}
                style={{ alignItems: "center", paddingVertical: 4 }}
              >
                <Typography variant="caption" color={theme.colors.primary}>
                  {subscriptionLoading ? "Restaurando..." : "Restaurar compra anterior"}
                </Typography>
              </Pressable>
            </View>
          )}
          {hasPaidPlan && (
            <View style={{ marginTop: 16 }}>
              <Button
                title="Gerenciar assinatura"
                variant="outline"
                size="md"
                onPress={() => router.push("/plans")}
              />
            </View>
          )}
        </Card>

        {/* Meta de pro-labore Card */}
        <Card>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.successBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trophy-outline" size={20} color={theme.colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">Meta de pro-labore</Typography>
                <Typography variant="caption">
                  {prolabore?.config
                    ? `${formatCurrency(prolabore.config.monthlyProlaboreGoal)} por mês`
                    : "Não definida"}
                </Typography>
              </View>
            </View>

            <Pressable
              onPress={() => setShowGoal(true)}
              accessibilityRole="button"
              accessibilityLabel={
                prolabore?.config
                  ? "Editar meta de pro-labore"
                  : "Definir meta de pro-labore"
              }
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <Typography variant="bodyBold" color={theme.colors.text}>
                {prolabore?.config ? "Editar" : "Definir"}
              </Typography>
            </Pressable>
          </View>
        </Card>

        {/* Preferences Card */}
        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="settings-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Typography variant="bodyBold">Preferências</Typography>
          </View>

          {/* Theme Toggle */}
          <View>
            <Typography variant="caption" style={{ marginBottom: 8 }}>
              Tema
            </Typography>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: 12,
                padding: 4,
              }}
            >
              {(["light", "dark"] as const).map((opt) => {
                const labels = { light: "Claro", dark: "Escuro" };
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (opt !== mode) toggleTheme();
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor:
                        opt === mode ? theme.colors.primary : "transparent",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={
                        opt === mode
                          ? theme.colors.textOnPrimary
                          : theme.colors.textSecondary
                      }
                    >
                      {labels[opt]}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notifications */}
          {Platform.OS === "web" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Ionicons
                name="notifications-off-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="body" color={theme.colors.text}>
                  Notificações no navegador
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Os lembretes com o aplicativo fechado estarão disponíveis quando o web
                  push for ativado.
                </Typography>
              </View>
            </View>
          ) : (
            NOTIFICATIONS.filter((item) => {
              if (item.type === NOTIFICATION_TYPES.LOW_STOCK) return hasStock;
              if (item.type === NOTIFICATION_TYPES.DELIVERY) return hasScheduling;
              return true;
            }).map((item) => {
              const locked = !!item.premium && !canUsePremiumNotifications;
              return (
                <View
                  key={item.type}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Typography variant="body" color={theme.colors.text}>
                        {item.label}
                      </Typography>
                      {item.premium ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            alignSelf: "flex-start",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: radii.full,
                            backgroundColor: `${theme.colors.premium}26`,
                          }}
                        >
                          <Ionicons
                            name="diamond"
                            size={11}
                            color={theme.colors.premium}
                          />
                          <Typography variant="label" color={theme.colors.premium}>
                            PROFISSIONAL
                          </Typography>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {locked ? (
                    <Pressable
                      onPress={() => router.push("/plans")}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label}, recurso Profissional`}
                      hitSlop={8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 6,
                      }}
                    >
                      <Ionicons
                        name="lock-closed"
                        size={18}
                        color={theme.colors.premium}
                      />
                    </Pressable>
                  ) : (
                    <Switch
                      accessibilityLabel={item.label}
                      trackColor={{
                        false: theme.colors.surface,
                        true: theme.colors.primary,
                      }}
                      thumbColor={theme.colors.textOnPrimary}
                      value={isPrefEnabled(notifPrefs, item.type)}
                      onValueChange={(v) => setNotifPref(item.type, v)}
                    />
                  )}
                </View>
              );
            })
          )}
        </Card>

        {/* Suporte prioritário (Profissional) */}
        {hasPrioritySupport && (
          <Card>
            <Pressable
              onPress={() => router.push("/support")}
              accessibilityRole="button"
              accessibilityLabel="Suporte prioritário"
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${theme.colors.premium}26`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={theme.colors.premium}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="h3">Suporte prioritário</Typography>
                <Typography variant="caption">
                  Fale direto com a gente e tenha prioridade
                </Typography>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </Card>
        )}

        {/* Legal Card */}
        <Card style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
            <Typography variant="bodyBold">Privacidade</Typography>
          </View>

          <Pressable
            onPress={() => {
              void openPrivacyPolicy();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 4,
            }}
          >
            <Typography variant="body">Politica de privacidade</Typography>
            <Ionicons name="open-outline" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        </Card>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 4,
          }}
        >
          <Typography variant="body" color={theme.colors.alert}>
            Sair da conta
          </Typography>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.alert} />
        </Pressable>

        {/* Delete account (zona de perigo) */}
        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleteAccount.isPending}
          accessibilityRole="button"
          accessibilityLabel="Excluir conta definitivamente"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 4,
            opacity: deleteAccount.isPending ? 0.6 : 1,
          }}
        >
          <Typography variant="body" color={theme.colors.alert}>
            {deleteAccount.isPending ? "Excluindo conta..." : "Excluir conta"}
          </Typography>
          {deleteAccount.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.alert} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
          )}
        </Pressable>

        {/* Version */}
        <Typography variant="caption" style={{ textAlign: "center", marginTop: 4 }}>
          {appVersion}
        </Typography>
      </ScrollView>

      {/* Meta de pro-labore Modal */}
      <ResponsiveModal
        desktopMaxWidth={840}
        visible={showGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
            }}
          >
            <Pressable
              onPress={() => setShowGoal(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              style={{ flex: 1, fontSize: 24 }}
            >
              Meta de pro-labore
            </Typography>
          </View>
          <ProlaboreGoalForm
            config={prolabore?.config ?? null}
            onSuccess={() => setShowGoal(false)}
          />
        </SafeAreaView>
      </ResponsiveModal>

      {/* Edit Profile Modal */}
      <ResponsiveModal
        desktopMaxWidth={840}
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
            }}
          >
            <Pressable
              onPress={() => setShowEditProfile(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              style={{ flex: 1, fontSize: 24 }}
            >
              Editar perfil
            </Typography>
          </View>
          <KeyboardAwareScrollView
            contentContainerStyle={[
              {
                padding: spacing.xl,
                paddingBottom: spacing["3xl"],
                gap: spacing.lg,
              },
              desktopContained(isDesktop, 720),
            ]}
          >
            {/* Foto do negócio */}
            <View style={{ alignItems: "center", gap: spacing.sm }}>
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
                    borderRadius: 48,
                    backgroundColor: theme.colors.surfaceElevated,
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
                      borderRadius: 16,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: theme.colors.background,
                    }}
                  >
                    <Ionicons
                      name="camera"
                      size={16}
                      color={theme.colors.textOnPrimary}
                    />
                  </View>
                </View>
                <Typography
                  variant="bodyBold"
                  color={theme.colors.primary}
                  style={{ marginTop: spacing.sm }}
                >
                  {pickedAvatar || avatarUrl ? "Alterar foto" : "Adicionar foto"}
                </Typography>
              </Pressable>
            </View>

            <View>
              <FieldLabel label="Nome" required />
              <TextFieldCard
                icon="person-outline"
                placeholder="Seu nome"
                value={editName}
                onChangeText={setEditName}
              />
            </View>
            <View>
              <FieldLabel label="Nome do negócio" />
              <TextFieldCard
                icon="storefront-outline"
                placeholder="Ex: Doces da Maria"
                value={editBusinessName}
                onChangeText={setEditBusinessName}
              />
            </View>
            <View style={{ gap: spacing.sm }}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Tipo de negócio
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Toque para selecionar
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {BUSINESS_TYPES.map((type) => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    selected={editBusinessType === type.value}
                    onPress={() => setEditBusinessType(type.value)}
                  />
                ))}
              </View>
            </View>
            <View>
              <FieldLabel label="Telefone" />
              <TextFieldCard
                icon="call-outline"
                placeholder="Ex: (11) 99999-9999"
                value={editPhone}
                onChangeText={(v: string) => setEditPhone(maskPhoneBR(v))}
                keyboardType="phone-pad"
              />
            </View>
            <Button
              title={savingAvatar ? "Enviando foto..." : "Salvar"}
              size="lg"
              onPress={() => {
                void handleSaveProfile();
              }}
              loading={updateProfile.isPending || savingAvatar}
              style={desktopAction(isDesktop)}
            />
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </ResponsiveModal>
    </SafeAreaView>
  );
}
