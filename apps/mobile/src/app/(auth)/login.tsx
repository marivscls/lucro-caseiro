import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../shared/hooks/use-form-validation";
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
import React, { useEffect, useRef, useState } from "react";
import { Image, Pressable, type TextInput, View } from "react-native";
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
import { brandLogoByMode } from "../../shared/brand-logo";
import { hasSignedInOnDevice } from "../../shared/utils/returning-user";
import { WelcomeHero } from "../../features/onboarding/components/welcome-hero";

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
  const passwordRef = useRef<TextInput>(null);
  // Quem nunca entrou neste aparelho vê primeiro as boas-vindas, com
  // "Criar conta grátis" em destaque; quem já entrou vai direto ao login.
  const [mode, setMode] = useState<"loading" | "welcome" | "login">("loading");

  useEffect(() => {
    let active = true;
    void hasSignedInOnDevice().then((signedIn) => {
      if (active) setMode(signedIn ? "login" : "welcome");
    });
    return () => {
      active = false;
    };
  }, []);

  const controlBorder = theme.colors.border;

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

  const formValidation = useFormValidation({
    email: !email.trim() && "Informe seu e-mail.",
    password: !password.trim() && "Informe sua senha.",
  });

  async function handleLogin() {
    if (!formValidation.validate()) return;
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
        message: "Digite um e-mail válido para recuperar a senha.",
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

  if (mode === "welcome") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <WelcomeHero
            brandName={brandName}
            logo={brandLogoByMode[theme.mode][brand.id]}
            onCreateAccount={() => router.push("/(auth)/register")}
            onLogin={() => setMode("login")}
          />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing["2xl"],
          },
          desktopContained(isDesktop, 420),
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Um único lockup reduz a competição entre símbolo, nome e saudação. */}
        <View style={{ alignItems: "center", gap: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Image
              source={brandLogoByMode[theme.mode][brand.id]}
              resizeMode="contain"
              style={{
                width: 72,
                height: 72,
                borderRadius: radii.xl,
                borderWidth: 1,
                borderColor: controlBorder,
              }}
            />
            <Typography
              variant="bodyBold"
              color={theme.colors.primaryStrong}
              style={{ letterSpacing: 1.8, textTransform: "uppercase" }}
            >
              {brandName}
            </Typography>
          </View>

          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <Typography variant="screenTitle" style={{ textAlign: "center" }}>
              Que bom te ver!
            </Typography>
          </View>
        </View>

        {mode === "login" ? (
          <View style={{ gap: spacing.lg }}>
            <Button
              title="Entrar com Google"
              variant="outline"
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
                borderColor: controlBorder,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={{ flex: 1, height: 1, backgroundColor: controlBorder }} />
              <Typography variant="caption">ou</Typography>
              <View style={{ flex: 1, height: 1, backgroundColor: controlBorder }} />
            </View>

            <ValidationField {...formValidation.field("email")}>
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(undefined);
                  if (emailSuggestion) setEmailSuggestion(undefined);
                }}
                onBlur={() => setEmailSuggestion(suggestEmailFix(email) ?? undefined)}
                error={emailError}
              />
            </ValidationField>
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
              <ValidationField {...formValidation.field("password")}>
                <Input
                  ref={passwordRef}
                  label="Senha"
                  placeholder="Sua senha"
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    void handleLogin();
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(undefined);
                  }}
                  error={passwordError}
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      hitSlop={10}
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        minHeight: 44,
                      }}
                    >
                      <AppIcon
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.colors.primaryStrong}
                      />
                    </Pressable>
                  }
                />
              </ValidationField>
            </View>

            <Pressable
              style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}
              disabled={resetLoading}
              accessibilityRole="button"
              onPress={handleForgotPassword}
            >
              <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                {resetLoading ? "Enviando..." : "Esqueci minha senha"}
              </Typography>
            </Pressable>

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

            <View style={{ gap: spacing.sm, alignItems: "center" }}>
              <Typography variant="body">Primeira vez aqui?</Typography>
              <Button
                title="Criar conta grátis"
                variant="outline"
                size="lg"
                onPress={() => router.push("/(auth)/register")}
                style={{ width: "100%" }}
              />
            </View>
          </View>
        ) : null}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
