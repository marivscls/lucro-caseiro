import { Button, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../shared/hooks/use-auth";
import {
  getPasswordStrength,
  validateEmail,
  validateName,
  validatePassword,
} from "../../shared/utils/validation";

function PasswordStrengthBar({ password }: Readonly<{ password: string }>) {
  const { theme } = useTheme();
  const strength = getPasswordStrength(password);

  if (!password) return null;

  const config = {
    weak: { color: theme.colors.alert, label: "Fraca", width: "33%" },
    medium: { color: theme.colors.yellow, label: "Media", width: "66%" },
    strong: { color: theme.colors.success, label: "Forte", width: "100%" },
  } as const;

  const c = config[strength];

  return (
    <View style={{ gap: spacing.xs }}>
      <View
        style={{
          height: 4,
          backgroundColor: theme.colors.surface,
          borderRadius: 2,
        }}
      >
        <View
          style={{
            height: 4,
            width: c.width,
            backgroundColor: c.color,
            borderRadius: 2,
          }}
        />
      </View>
      <Typography variant="caption" color={c.color}>
        Senha {c.label.toLowerCase()}
      </Typography>
    </View>
  );
}

function PasswordRules({ password }: Readonly<{ password: string }>) {
  const { theme } = useTheme();

  if (!password) return null;

  const rules = [
    { label: "Minimo 8 caracteres", met: password.length >= 8 },
    { label: "1 letra maiuscula", met: /[A-Z]/.test(password) },
    { label: "1 letra minuscula", met: /[a-z]/.test(password) },
    { label: "1 numero", met: /\d/.test(password) },
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
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: rule.met ? theme.colors.success : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rule.met && (
              <Typography
                variant="caption"
                color={theme.colors.textOnPrimary}
                style={{ fontSize: 10 }}
              >
                ✓
              </Typography>
            )}
          </View>
          <Typography
            variant="caption"
            color={rule.met ? theme.colors.success : theme.colors.textSecondary}
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
      Alert.alert("Ops!", result.error);
    } else {
      Alert.alert(
        "Conta criada!",
        "Verifique seu e-mail para confirmar a conta. Depois e so entrar!",
        [{ text: "Ok", onPress: () => router.push("/(auth)/login") }],
      );
    }
  }

  async function handleGoogleRegister() {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.error) {
      Alert.alert("Ops!", result.error);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing["2xl"],
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <Typography variant="caption" color={theme.colors.primary}>
            Lucro Caseiro
          </Typography>
        </View>

        <Typography variant="display" style={{ textAlign: "center" }}>
          Crie sua conta
        </Typography>
        <Typography variant="body" style={{ textAlign: "center" }}>
          Comece a organizar seu negocio
        </Typography>

        <Button
          title="Criar com Google"
          variant="secondary"
          size="lg"
          onPress={() => {
            void handleGoogleRegister();
          }}
          loading={loading}
          style={{ width: "100%" }}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.surface }} />
          <Typography variant="caption">ou</Typography>
          <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.surface }} />
        </View>

        <View style={{ gap: spacing.lg }}>
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
              style={{ position: "absolute", right: spacing.lg, top: 38 }}
            >
              <Typography variant="caption" color={theme.colors.primary}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Typography>
            </Pressable>
            <PasswordStrengthBar password={password} />
            <PasswordRules password={password} />
          </View>

          <Input
            label="Nome do negocio (opcional)"
            placeholder="Ex: Doces da Maria"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <Button
          title="Criar minha conta"
          size="lg"
          onPress={() => {
            void handleRegister();
          }}
          loading={loading}
          disabled={!name.trim() || !email.trim() || !password.trim()}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.xs,
          }}
        >
          <Typography variant="body">Ja tem conta?</Typography>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Entrar
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
