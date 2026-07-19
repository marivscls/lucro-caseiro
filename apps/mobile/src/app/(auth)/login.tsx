import {
  Button,
  Input,
  Typography,
  useBrand,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../../shared/components/keyboard-aware-scroll-view";
import { EmailTypoHint } from "../../shared/components/email-typo-hint";
import { getAuthRedirectUrl, useAuth } from "../../shared/hooks/use-auth";
import { supabase } from "../../shared/utils/supabase";
import { validateEmail } from "../../shared/utils/validation";
import { suggestEmailFix } from "../../shared/utils/email";
import { alertError } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";
import { desktopContained } from "../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { getBrandDisplayName } from "../../shared/brand-name";
import { brandLogoById } from "../../shared/brand-logo";

export default function LoginScreen() {
  const { theme } = useTheme();
  const brand = useBrand();
  const brandName = getBrandDisplayName(brand);
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [emailSuggestion, setEmailSuggestion] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const cardBg = theme.colors.surfaceElevated;
  const cardBorder = theme.colors.border;

  function validateForm(): boolean {
    let valid = true;

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setEmailError(emailResult.errors[0]);
      valid = false;
    } else {
      setEmailError(undefined);
    }

    if (!password.trim()) {
      setPasswordError("Senha é obrigatória");
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    return valid;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    setEmailLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        showAlert({ title: "Ops!", message: result.error });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido ao entrar";
      alertError(message);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        showAlert({ title: "Ops!", message: result.error });
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleForgotPassword() {
    const trimmed = email.trim();
    if (!trimmed) {
      showAlert({
        title: "Ops!",
        message: "Preencha seu e-mail para recuperar a senha.",
      });
      return;
    }
    const emailResult = validateEmail(trimmed);
    if (!emailResult.valid) {
      showAlert({
        title: "Ops!",
        message: "Digite um e-mail valido para recuperar a senha.",
      });
      return;
    }
    setResetLoading(true);
    void supabase.auth
      .resetPasswordForEmail(trimmed, { redirectTo: getAuthRedirectUrl() })
      .then(({ error }) => {
        setResetLoading(false);
        if (error) {
          alertError("Não foi possível enviar o e-mail. Tente novamente.");
          return;
        }
        showAlert({
          title: "E-mail enviado!",
          message: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      })
      .catch(() => {
        setResetLoading(false);
        alertError(
          "Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.",
        );
      });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            justifyContent: "center",
            padding: spacing["2xl"],
            gap: spacing.xl,
          },
          desktopContained(isDesktop, 480),
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Marca + boas-vindas */}
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <Image
            source={brandLogoById[brand.id]}
            resizeMode="contain"
            style={{ width: 112, height: 112 }}
          />
          <Typography
            variant="caption"
            color={theme.colors.primaryLight}
            style={{ letterSpacing: 3, textTransform: "uppercase" }}
          >
            {brandName}
          </Typography>
          <Typography variant="display" style={{ textAlign: "center" }}>
            Que bom te ver!
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Seu negócio organizado, do orçamento ao lucro.
          </Typography>
        </View>

        {/* Card do formulário */}
        <View
          style={{
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor: cardBorder,
            borderRadius: radii["2xl"],
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Button
            title="Entrar com Google"
            variant="secondary"
            size="lg"
            icon={<AppIcon name="logo-google" size={20} color={theme.colors.text} />}
            onPress={() => {
              void handleGoogleLogin();
            }}
            loading={googleLoading}
            disabled={emailLoading || googleLoading}
            style={{
              width: "100%",
              backgroundColor: theme.colors.surfaceElevated,
              borderWidth: 1.5,
              borderColor: cardBorder,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
            <Typography variant="caption">ou com e-mail</Typography>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
          </View>

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(undefined);
              if (emailSuggestion) setEmailSuggestion(undefined);
            }}
            onBlur={() => setEmailSuggestion(suggestEmailFix(email) ?? undefined)}
            error={emailError}
          />
          <EmailTypoHint
            suggestion={emailSuggestion}
            onAccept={() => {
              if (!emailSuggestion) return;
              setEmail(emailSuggestion);
              setEmailSuggestion(undefined);
              setEmailError(undefined);
            }}
          />
          <View>
            <Input
              label="Senha"
              placeholder="Sua senha"
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(undefined);
              }}
              error={passwordError}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              hitSlop={10}
              style={{
                position: "absolute",
                right: spacing.md,
                top: 30,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
                paddingHorizontal: spacing.xs,
              }}
            >
              <AppIcon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Typography
                variant="bodyBold"
                color={theme.colors.primary}
                style={{ fontSize: 14 }}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </Typography>
            </Pressable>
          </View>

          <Button
            title="Entrar"
            size="lg"
            icon={
              <AppIcon
                name="arrow-forward"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => {
              void handleLogin();
            }}
            loading={emailLoading}
            disabled={emailLoading || googleLoading}
          />

          <Pressable
            style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
            disabled={resetLoading}
            accessibilityRole="button"
            onPress={handleForgotPassword}
          >
            <Typography
              variant="bodyBold"
              color={theme.colors.primary}
              style={{ fontSize: 14 }}
            >
              {resetLoading ? "Enviando..." : "Esqueci minha senha"}
            </Typography>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
          <Typography variant="body">Primeira vez?</Typography>
          <Pressable onPress={() => router.push("/(auth)/register")} hitSlop={8}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Criar conta
            </Typography>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
