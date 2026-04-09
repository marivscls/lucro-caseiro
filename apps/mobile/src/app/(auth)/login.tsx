import { Button, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../shared/hooks/use-auth";
import { supabase } from "../../shared/utils/supabase";
import { validateEmail } from "../../shared/utils/validation";

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

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
      setPasswordError("Senha e obrigatoria");
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    return valid;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        Alert.alert("Ops!", result.error);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido ao entrar";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
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
          gap: spacing["2xl"],
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", gap: spacing.md, marginBottom: spacing.sm }}>
          <Typography variant="caption" color={theme.colors.primary}>
            Lucro Caseiro
          </Typography>
        </View>

        <Typography variant="display" style={{ textAlign: "center" }}>
          Que bom te ver!
        </Typography>

        <Button
          title="Entrar com Google"
          variant="secondary"
          size="lg"
          onPress={() => {
            void handleGoogleLogin();
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
              style={{ position: "absolute", right: spacing.lg, top: 38 }}
            >
              <Typography variant="caption" color={theme.colors.primary}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Typography>
            </Pressable>
          </View>

          <Pressable
            style={{ alignSelf: "flex-end" }}
            disabled={resetLoading}
            onPress={() => {
              const trimmed = email.trim();
              if (!trimmed) {
                Alert.alert("Ops!", "Preencha seu e-mail para recuperar a senha.");
                return;
              }
              const emailResult = validateEmail(trimmed);
              if (!emailResult.valid) {
                Alert.alert("Ops!", "Digite um e-mail valido para recuperar a senha.");
                return;
              }
              setResetLoading(true);
              void supabase.auth.resetPasswordForEmail(trimmed).then(({ error }) => {
                setResetLoading(false);
                if (error) {
                  Alert.alert(
                    "Erro",
                    "Nao foi possivel enviar o e-mail. Tente novamente.",
                  );
                  return;
                }
                Alert.alert(
                  "E-mail enviado!",
                  "Verifique sua caixa de entrada para redefinir sua senha.",
                );
              });
            }}
          >
            <Typography variant="caption" color={theme.colors.primary}>
              {resetLoading ? "Enviando..." : "Esqueci minha senha"}
            </Typography>
          </Pressable>
        </View>

        <Button
          title="Entrar"
          size="lg"
          onPress={() => {
            void handleLogin();
          }}
          loading={loading}
        />

        <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
          <Typography variant="body">Primeira vez?</Typography>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Criar conta
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
