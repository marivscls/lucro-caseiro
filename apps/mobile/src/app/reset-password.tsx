import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Redirect, Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import { showAlert } from "../shared/components/alert-store";
import { useAuth } from "../shared/hooks/use-auth";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { supabase } from "../shared/utils/supabase";
import { validatePassword } from "../shared/utils/validation";
import {
  CREDENTIAL_RULES,
  getPasswordUpdateError,
} from "../shared/utils/password-recovery";
import { desktopContained } from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const signOut = useAuth((s) => s.signOut);
  const clearPasswordRecovery = useAuth((s) => s.clearPasswordRecovery);
  const passwordRecovery = useAuth((s) => s.passwordRecovery);
  const session = useAuth((s) => s.session);
  const isLoading = useAuth((s) => s.isLoading);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      alertValidation(passwordResult.errors.join(". "));
      return;
    }
    // eslint-disable-next-line security/detect-possible-timing-attacks -- comparação de dois campos digitados pelo usuário (não é segredo)
    if (password !== confirm) {
      alertValidation("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const friendly = getPasswordUpdateError(error);
        (friendly.kind === "validation" ? alertValidation : alertError)(friendly.message);
        return;
      }
      // Senha trocada: encerra a sessão de recuperação e manda entrar de novo.
      clearPasswordRecovery();
      await signOut();
      showAlert({
        title: "Senha alterada!",
        message: "Pronto! Agora entre com a sua nova senha.",
        buttons: [{ text: "Entrar", onPress: () => router.replace("/(auth)/login") }],
      });
    } catch {
      alertError("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return null;
  if (!passwordRecovery || !session) return <Redirect href="/(auth)/login" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            padding: spacing.xl,
            justifyContent: "center",
            gap: spacing.xl,
          },
          desktopContained(isDesktop, 480),
        ]}
      >
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.full,
              backgroundColor: theme.colors.premiumBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="lock-closed" size={30} color={theme.colors.premium} />
          </View>
          <Typography
            variant="h1"
            color={theme.colors.text}
            style={{ textAlign: "center" }}
          >
            Criar nova senha
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Escolha uma nova senha para a sua conta.
          </Typography>
        </View>

        <View style={{ gap: spacing.md }}>
          <Input
            label="Nova senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Pelo menos 8 caracteres"
            secureTextEntry={!show}
            autoCapitalize="none"
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {CREDENTIAL_RULES}
          </Typography>
          <Input
            label="Confirmar nova senha"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repita a senha"
            secureTextEntry={!show}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShow((v) => !v)}
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              alignSelf: "flex-start",
              minHeight: 40,
            }}
          >
            <AppIcon
              name={show ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={theme.colors.primary}
            />
            <Typography variant="caption" color={theme.colors.primary}>
              {show ? "Ocultar senha" : "Mostrar senha"}
            </Typography>
          </Pressable>
        </View>

        <Button
          title="Salvar nova senha"
          size="lg"
          loading={loading}
          onPress={() => void handleSave()}
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
