import { Button, Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCurrency, prolaboreMessage } from "../domain";
import { useProlaboreStatus } from "../hooks";
import { ProlaboreGoalForm } from "./prolabore-goal-form";

export function ProlaboreCard() {
  const { theme } = useTheme();
  const { data, isLoading } = useProlaboreStatus();
  const [showForm, setShowForm] = useState(false);

  // Mantem a Home limpa enquanto carrega.
  if (isLoading || !data) return null;

  const { config, progress } = data;

  const formModal = (
    <Modal
      visible={showForm}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowForm(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            padding: spacing.lg,
          }}
        >
          <Pressable onPress={() => setShowForm(false)}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
        </View>
        <ProlaboreGoalForm config={config} onSuccess={() => setShowForm(false)} />
      </SafeAreaView>
    </Modal>
  );

  if (!config) {
    return (
      <>
        <Card
          variant="surface"
          padding="xl"
          style={{ borderLeftWidth: 3, borderLeftColor: theme.colors.primary }}
        >
          <Typography variant="h3" style={{ marginBottom: spacing.xs }}>
            Sua meta do mes
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ marginBottom: spacing.md }}
          >
            Defina quanto quer ganhar e veja quantas vendas faltam pra chegar la.
          </Typography>
          <Button
            title="Definir meta de pro-labore"
            size="md"
            onPress={() => setShowForm(true)}
          />
        </Card>
        {formModal}
      </>
    );
  }

  const accent = progress.reached ? theme.colors.success : theme.colors.primary;

  return (
    <>
      <Pressable onPress={() => setShowForm(true)}>
        <Card variant="surface" padding="xl">
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.sm,
            }}
          >
            <Typography variant="label">META DO MES</Typography>
            <Ionicons
              name="create-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
          </View>

          <Typography
            variant="moneyLg"
            color={progress.reached ? theme.colors.success : theme.colors.text}
          >
            {formatCurrency(progress.currentRevenue)}
          </Typography>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ marginTop: spacing.xs }}
          >
            de {formatCurrency(progress.requiredRevenue)} necessarios
          </Typography>

          {/* Barra de progresso (flex evita width em %, mais simples de tipar) */}
          <View
            style={{
              height: 8,
              borderRadius: radii.full,
              backgroundColor: theme.colors.surfaceElevated,
              marginTop: spacing.md,
              overflow: "hidden",
              flexDirection: "row",
            }}
          >
            <View style={{ flex: progress.progressPct, backgroundColor: accent }} />
            <View style={{ flex: 100 - progress.progressPct }} />
          </View>

          <Typography variant="bodyBold" color={accent} style={{ marginTop: spacing.md }}>
            {prolaboreMessage(progress)}
          </Typography>
        </Card>
      </Pressable>
      {formModal}
    </>
  );
}
