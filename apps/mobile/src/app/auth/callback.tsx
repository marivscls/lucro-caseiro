import { Button, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { Redirect, useRouter } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../shared/hooks/use-auth";

export default function AuthCallbackScreen() {
  const { isLoading, passwordRecovery } = useAuth();
  const passwordRecoveryError = useAuth((state) => state.passwordRecoveryError);
  const { theme } = useTheme();
  const router = useRouter();

  if (isLoading) return null;
  if (passwordRecoveryError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Typography variant="h1" style={{ textAlign: "center" }}>
            Link inválido
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            {passwordRecoveryError}
          </Typography>
          <Button
            title="Voltar para entrar"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={passwordRecovery ? "/reset-password" : "/"} />;
}
