import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../../shared/components/keyboard-aware-scroll-view";
import { useAuth } from "../../shared/hooks/use-auth";
import {
  getPasswordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from "../../shared/utils/validation";
import { showAlert } from "../../shared/components/alert-store";
import authHouse from "../../assets/auth-house.png";

function PasswordStrengthBar({ password }: Readonly<{ password: string }>) {
  const { theme } = useTheme();
  const strength = getPasswordStrength(password);

  if (!password) return null;

  const config = {
    weak: { color: theme.colors.alert, label: "Fraca", width: "33%" },
    medium: { color: theme.colors.yellow, label: "Média", width: "66%" },
    strong: { color: theme.colors.success, label: "Forte", width: "100%" },
  } as const;

  const c = config[strength];

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={{
          height: 8,
          backgroundColor: theme.colors.surface,
          borderRadius: radii.full,
        }}
      >
        <View
          style={{
            height: 8,
            width: c.width,
            backgroundColor: c.color,
            borderRadius: radii.full,
          }}
        />
      </View>
      <Typography variant="bodyBold" color={c.color} style={{ fontSize: 14 }}>
        Senha {c.label.toLowerCase()}
      </Typography>
    </View>
  );
}

function PasswordRules({ password }: Readonly<{ password: string }>) {
  const { theme } = useTheme();

  if (!password) return null;

  const rules = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "1 letra maiuscula", met: /[A-Z]/.test(password) },
    { label: "1 letra minuscula", met: /[a-z]/.test(password) },
    { label: "1 número", met: /\d/.test(password) },
  ];

  return (
    <View style={{ gap: spacing.xs }}>
      {rules.map((rule) => (
        <View
          key={rule.label}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: rule.met ? theme.colors.success : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="checkmark"
              size={14}
              color={rule.met ? theme.colors.textOnPrimary : "transparent"}
            />
          </View>
          <Typography
            variant="body"
            color={rule.met ? theme.colors.success : theme.colors.textSecondary}
            style={{ fontSize: 14 }}
          >
            {rule.label}
          </Typography>
        </View>
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  function validateForm(): boolean {
    let valid = true;

    const nameResult = validateName(name);
    if (!nameResult.valid) {
      setNameError(nameResult.errors[0]);
      valid = false;
    } else {
      setNameError(undefined);
    }

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setEmailError(emailResult.errors[0]);
      valid = false;
    } else {
      setEmailError(undefined);
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      setPasswordError(passwordResult.errors.join(". "));
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    return valid;
  }

  async function handleRegister() {
    if (!validateForm()) return;

    setLoading(true);
    const result = await signUpWithEmail(
      email,
      password,
      name,
      businessName || undefined,
    );
    setLoading(false);

    if (result.error) {
      showAlert({ title: "Ops!", message: result.error });
    } else if (result.needsConfirmation) {
      showAlert({
        title: "Conta criada!",
        message: "Verifique seu e-mail para confirmar a conta. Depois e so entrar!",
        buttons: [{ text: "Ok", onPress: () => router.push("/(auth)/login") }],
      });
    } else {
      showAlert({
        title: "Conta criada com sucesso! 🎉",
        message:
          "Tudo pronto para você organizar, vender e lucrar mais com o que faz de melhor.",
        buttons: [{ text: "Continuar", onPress: () => router.replace("/") }],
        variant: "account-created",
      });
    }
  }

  async function handleGoogleRegister() {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.error) {
      showAlert({ title: "Ops!", message: result.error });
    }
  }

  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.72)" : theme.colors.surfaceElevated;
  const cardBorder = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.08)";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing["2xl"],
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <Image
            source={authHouse}
            resizeMode="contain"
            style={{ width: 104, height: 104 }}
          />
          <Typography
            variant="caption"
            color={theme.colors.primaryLight}
            style={{ letterSpacing: 3, textTransform: "uppercase" }}
          >
            Lucro Caseiro
          </Typography>
          <Typography variant="display" style={{ textAlign: "center" }}>
            Crie sua conta
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Leva menos de um minuto, e é grátis.
          </Typography>
        </View>

        <View
          style={{
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor: cardBorder,
            borderRadius: radii["2xl"],
            padding: spacing.xl,
            gap: spacing.lg,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 24,
            elevation: 5,
          }}
        >
          <Button
            title="Criar com Google"
            variant="secondary"
            size="lg"
            icon={<Ionicons name="logo-google" size={20} color={theme.colors.text} />}
            onPress={() => {
              void handleGoogleRegister();
            }}
            loading={loading}
            style={{ width: "100%" }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
            <Typography variant="caption">ou com e-mail</Typography>
            <View style={{ flex: 1, height: 1, backgroundColor: cardBorder }} />
          </View>

          <Input
            label="Seu nome"
            placeholder="Como podemos te chamar?"
            autoComplete="name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(undefined);
            }}
            error={nameError}
          />

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
            }}
            error={emailError}
          />

          <View style={{ gap: spacing.sm }}>
            <Input
              label="Senha"
              placeholder="Crie uma senha forte"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
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
              <Ionicons
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
            <PasswordStrengthBar password={password} />
            <PasswordRules password={password} />
          </View>

          <Input
            label="Nome do negócio (opcional)"
            placeholder="Ex: Doces da Maria"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Button
            title="Criar minha conta"
            size="lg"
            icon={
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => {
              void handleRegister();
            }}
            loading={loading}
            disabled={!name.trim() || !email.trim() || !password.trim()}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          <Typography variant="body">Já tem conta?</Typography>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Entrar
            </Typography>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
