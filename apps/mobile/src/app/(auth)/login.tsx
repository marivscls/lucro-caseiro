import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { useAuth } from "../../shared/hooks/use-auth";
import { supabase } from "../../shared/utils/supabase";
import { validateEmail } from "../../shared/utils/validation";

/** Blobs decorativos suaves no fundo, na paleta da marca. */
function BackgroundDecor() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="lg-blob1" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C4707E" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#C4707E" stopOpacity="0.04" />
          </LinearGradient>
          <LinearGradient id="lg-blob2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D4A054" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#D4A054" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Circle cx="12%" cy="6%" r="130" fill="url(#lg-blob1)" />
        <Circle cx="96%" cy="32%" r="90" fill="url(#lg-blob2)" />
        <Circle cx="6%" cy="88%" r="110" fill="url(#lg-blob2)" />
        <Circle cx="90%" cy="96%" r="70" fill="url(#lg-blob1)" />
      </Svg>
    </View>
  );
}

/** Marca: loja num círculo com gradiente + faísca. */
function BrandMark() {
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92">
      <Defs>
        <LinearGradient id="lg-brand" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d98c99" />
          <Stop offset="1" stopColor="#ad5564" />
        </LinearGradient>
      </Defs>
      <Circle cx="46" cy="46" r="42" fill="url(#lg-brand)" />
      <Circle
        cx="46"
        cy="46"
        r="42"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      {/* toldo da lojinha */}
      <Path
        d="M28 36 L64 36 L66 44 Q63 48 59 44 Q56 48 52 44 Q49 48 46 44 Q43 48 40 44 Q37 48 33 44 Q29 48 26 44 Z"
        fill="#fffaf5"
      />
      <Path d="M28 36 L64 36 L64 32 Q64 29 61 29 L31 29 Q28 29 28 32 Z" fill="#f3e0d6" />
      {/* fachada */}
      <Path d="M31 47 L61 47 L61 62 Q61 65 58 65 L34 65 Q31 65 31 62 Z" fill="#fffaf5" />
      <Path
        d="M37 65 L37 53 Q37 50 40 50 L46 50 Q49 50 49 53 L49 65 Z"
        fill="#ad5564"
        opacity="0.85"
      />
      <Circle cx="55" cy="55" r="3.4" fill="#ecc78a" />
      {/* faísca */}
      <Path
        d="M74 16 L76 21 L81 23 L76 25 L74 30 L72 25 L67 23 L72 21 Z"
        fill="#ecc78a"
      />
    </Svg>
  );
}

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

  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.72)" : theme.colors.surfaceElevated;
  const cardBorder = isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.08)";

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

  function handleForgotPassword() {
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
        Alert.alert("Erro", "Não foi possível enviar o e-mail. Tente novamente.");
        return;
      }
      Alert.alert(
        "E-mail enviado!",
        "Verifique sua caixa de entrada para redefinir sua senha.",
      );
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackgroundDecor />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing["2xl"],
          gap: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Marca + boas-vindas */}
        <View style={{ alignItems: "center", gap: spacing.md }}>
          <BrandMark />
          <Typography
            variant="caption"
            color={theme.colors.primaryLight}
            style={{ letterSpacing: 3, textTransform: "uppercase" }}
          >
            Lucro Caseiro
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 24,
            elevation: 5,
          }}
        >
          <Button
            title="Entrar com Google"
            variant="secondary"
            size="lg"
            icon={<Ionicons name="logo-google" size={20} color={theme.colors.text} />}
            onPress={() => {
              void handleGoogleLogin();
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
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              hitSlop={10}
              style={{
                position: "absolute",
                right: spacing.lg,
                top: 34,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                minHeight: 32,
              }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={theme.colors.primary}
              />
              <Typography variant="caption" color={theme.colors.primary}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Typography>
            </Pressable>
          </View>

          <Pressable
            style={{ alignSelf: "flex-end", minHeight: 32, justifyContent: "center" }}
            disabled={resetLoading}
            onPress={handleForgotPassword}
          >
            <Typography variant="caption" color={theme.colors.primary}>
              {resetLoading ? "Enviando..." : "Esqueci minha senha"}
            </Typography>
          </Pressable>

          <Button
            title="Entrar"
            size="lg"
            icon={
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={() => {
              void handleLogin();
            }}
            loading={loading}
          />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xs }}>
          <Typography variant="body">Primeira vez?</Typography>
          <Pressable onPress={() => router.push("/(auth)/register")} hitSlop={8}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Criar conta
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
