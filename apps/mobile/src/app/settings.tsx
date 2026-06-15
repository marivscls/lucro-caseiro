import {
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Typography,
  useTheme,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../shared/hooks/use-auth";
import { maskPhoneBR } from "../shared/utils/phone";
import { useDeleteAccount } from "../features/account/hooks";
import { ProlaboreGoalForm } from "../features/goals/components/prolabore-goal-form";
import { formatCurrency } from "../features/goals/domain";
import { useProlaboreStatus } from "../features/goals/hooks";
import { useProfile, useUpdateProfile } from "../features/subscription/hooks";
import { useSubscription } from "../features/subscription/use-subscription";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
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

  const userName = profile?.name ?? "...";
  const businessName = profile?.businessName ?? "Meu negócio";
  const businessType = profile?.businessType ?? "";
  const isPremium = profile?.plan === "premium";
  const appVersion = "v1.0.0";

  function openEditProfile() {
    setEditName(profile?.name ?? "");
    setEditBusinessName(profile?.businessName ?? "");
    setEditBusinessType(profile?.businessType ?? "");
    setEditPhone(profile?.phone ?? "");
    setShowEditProfile(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      alertValidation("O nome é obrigatório");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: editName.trim(),
        businessName: editBusinessName.trim() || undefined,
        businessType: businessTypeValue(editBusinessType),
        phone: editPhone.trim() || undefined,
      });
      Alert.alert("Perfil atualizado!");
      setShowEditProfile(false);
    } catch {
      alertError("Não foi possível atualizar o perfil.");
    }
  }

  function handleLogout() {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
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
    ]);
  }

  async function runDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      // Sucesso: o hook ja encerrou a sessao e limpou o cache.
      router.replace("/(auth)/login");
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível excluir a conta. Tente novamente.";
      alertError(message);
    }
  }

  function handleDeleteAccount() {
    // Confirmacao em dois toques: aviso claro de que e definitivo.
    Alert.alert(
      "Excluir conta",
      "Isso apaga DEFINITIVAMENTE sua conta e todos os seus dados (vendas, clientes, finanças, produtos e receitas). Não tem como desfazer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Tem certeza?",
              "Esta é sua última chance. Ao confirmar, sua conta e todos os dados serão apagados para sempre.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir minha conta",
                  style: "destructive",
                  onPress: () => {
                    void runDeleteAccount();
                  },
                },
              ],
            );
          },
        },
      ],
    );
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
      edges={["bottom"]}
    >
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
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
              }}
            >
              <Typography variant="h2" color={theme.colors.primary}>
                {userName.charAt(0)}
              </Typography>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Typography variant="h3">{userName}</Typography>
                {businessType ? (
                  <Badge label={businessTypeLabel(businessType)} variant="primary" />
                ) : null}
              </View>
              <Typography variant="caption">{businessName}</Typography>
            </View>

            <Pressable
              onPress={openEditProfile}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <Typography variant="caption" color={theme.colors.text}>
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
                  {isPremium ? "Premium ativo" : "Plano gratuito"}
                </Typography>
              </View>
            </View>

            <Badge
              label={isPremium ? "PREMIUM" : "FREE"}
              variant={isPremium ? "premium" : "primary"}
            />
          </View>

          {!isPremium && (
            <View style={{ gap: 8, marginTop: 16 }}>
              <Button
                title="Assinar Premium"
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
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: theme.colors.surfaceElevated,
              }}
            >
              <Typography variant="caption" color={theme.colors.text}>
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
            <Typography variant="bodyBold">Preferencias</Typography>
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
          {[
            { key: "sales", label: "Vendas pendentes" },
            { key: "birthdays", label: "Aniversários de clientes" },
            { key: "stock", label: "Estoque baixo" },
            { key: "weekly", label: "Resumo semanal" },
            { key: "daily", label: "Lembretes diarios" },
          ].map((item) => (
            <View
              key={item.key}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body">{item.label}</Typography>
              <Switch
                trackColor={{
                  false: theme.colors.surface,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.textOnPrimary}
                value={true}
              />
            </View>
          ))}
        </Card>

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
      <Modal
        visible={showGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowGoal(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <ProlaboreGoalForm
            config={prolabore?.config ?? null}
            onSuccess={() => setShowGoal(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowEditProfile(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <KeyboardAwareScrollView
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: spacing["3xl"],
              gap: spacing.lg,
            }}
          >
            <Typography variant="h2">Editar perfil</Typography>
            <Input label="Nome" value={editName} onChangeText={setEditName} />
            <Input
              label="Nome do negócio"
              placeholder="Ex: Doces da Maria"
              value={editBusinessName}
              onChangeText={setEditBusinessName}
            />
            <Input
              label="Tipo de negócio"
              placeholder="Ex: Confeitaria, Artesanato..."
              value={editBusinessType ? businessTypeLabel(editBusinessType) : ""}
              editable={false}
              selectTextOnFocus={false}
            />
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
            <Input
              label="Telefone"
              placeholder="Ex: (11) 99999-9999"
              value={editPhone}
              onChangeText={(v) => setEditPhone(maskPhoneBR(v))}
              keyboardType="phone-pad"
            />
            <Button
              title="Salvar"
              size="lg"
              onPress={() => {
                void handleSaveProfile();
              }}
              loading={updateProfile.isPending}
            />
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
