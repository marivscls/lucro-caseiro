import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function FirstTask({
  onStart,
  onConfigure,
}: Readonly<{
  onStart: (route: "/pricing" | "/tabs/new-sale") => Promise<boolean>;
  onConfigure: () => void;
}>) {
  const { theme } = useTheme();
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  async function start(route: "/pricing" | "/tabs/new-sale") {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    setFailed(false);
    try {
      setFailed(!(await onStart(route)));
    } catch {
      setFailed(true);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <View
          style={{ width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing.lg }}
        >
          <Typography variant="h2">O que você quer resolver primeiro?</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Comece com uma tarefa do seu negócio. Você pode completar seu perfil e
            conhecer os outros recursos depois.
          </Typography>
          <Card variant="elevated" style={{ gap: spacing.md }}>
            <Typography variant="bodyBold">Entender quanto cobrar</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Use os custos de um produto para calcular seu primeiro preço.
            </Typography>
            <Button
              title="Calcular meu primeiro preço"
              disabled={saving}
              onPress={() => void start("/pricing")}
            />
          </Card>
          <Card variant="elevated" style={{ gap: spacing.md }}>
            <Typography variant="bodyBold">Organizar o que vendeu</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Registre uma venda e acompanhe o pagamento. Você pode cadastrar o produto
              durante o registro.
            </Typography>
            <Button
              title="Registrar minha primeira venda"
              disabled={saving}
              onPress={() => void start("/tabs/new-sale")}
            />
          </Card>
          {failed ? (
            <Typography
              variant="body"
              accessibilityRole="alert"
              color={theme.colors.textSecondary}
            >
              Não foi possível continuar. Confira sua conexão e tente novamente.
            </Typography>
          ) : null}
          {saving ? (
            <Typography variant="caption">Preparando seu primeiro passo…</Typography>
          ) : null}
          <Button
            title="Quero configurar meu perfil primeiro"
            variant="outline"
            disabled={saving}
            onPress={onConfigure}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
