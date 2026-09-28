import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../shared/hooks/use-form-validation";
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

function passwordProblem(
  password: string,
  result: { valid: boolean; errors: string[] },
): string | undefined {
  if (!password.trim()) return "Informe a nova senha.";
  return result.valid ? undefined : result.errors.join(". ");
}

function confirmProblem(confirm: string, mismatch: boolean): string | undefined {
  if (!confirm.trim()) return "Confirme a nova senha.";
  return mismatch ? "As senhas não conferem." : undefined;
}

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

  const passwordResult = validatePassword(password);
  const mismatch = password !== confirm;
  // As regras da senha aparecem no próprio campo, não em alerta.
  const formValidation = useFormValidation({
    password: passwordProblem(password, passwordResult),
    confirm: confirmProblem(confirm, mismatch),
  });

  async function handleSave() {
    if (!formValidation.validate()) return;

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
            variant="screenTitle"
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
          <ValidationField {...formValidation.field("password")}>
            <Input
              label="Nova senha"
              hint={CREDENTIAL_RULES}
              value={password}
              onChangeText={setPassword}
              placeholder="Pelo menos 8 caracteres"
              secureTextEntry={!show}
              autoCapitalize="none"
            />
          </ValidationField>
          <ValidationField {...formValidation.field("confirm")}>
            <Input
              label="Confirmar nova senha"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repita a senha"
              secureTextEntry={!show}
              autoCapitalize="none"
            />
          </ValidationField>
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
              color={theme.colors.primaryStrong}
            />
            <Typography variant="caption" color={theme.colors.primaryStrong}>
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
