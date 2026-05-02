import { Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PaywallProps {
  readonly title?: string;
  readonly message?: string;
  readonly currentUsage?: string;
  readonly onSubscribe?: (period: "monthly" | "annual") => void;
  readonly onRestore?: () => void;
  readonly onPayWithMercadoPago?: (period: "monthly" | "annual") => void;
  readonly loading?: boolean;
  readonly onClose?: () => void;
}

const BENEFITS = [
  "Vendas ilimitadas",
  "Clientes ilimitados",
  "Receitas ilimitadas",
  "Embalagens e rotulos ilimitados",
  "Relatorios completos com graficos",
  "Exportar PDF e Excel",
  "Templates premium",
  "Suporte prioritario",
  "Sem anuncios",
];

export function Paywall({
  title = "Seu negocio merece mais!",
  message,
  currentUsage,
  onSubscribe,
  onRestore,
  onPayWithMercadoPago,
  loading = false,
  onClose,
}: PaywallProps) {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  function handleSubscribe() {
    if (onSubscribe) {
      onSubscribe(selectedPlan);
    } else {
      Alert.alert("Em breve", "Assinatura sera disponibilizada em breve.");
    }
  }

  function handleRestore() {
    if (onRestore) {
      onRestore();
    } else {
      Alert.alert("Em breve", "Restauracao sera disponibilizada em breve.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          gap: 20,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 8 }}>
          <Typography variant="caption" color={theme.colors.primary}>
            Lucro Caseiro
          </Typography>
        </View>

        {/* Crown icon */}
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.premiumBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="diamond" size={28} color={theme.colors.premium} />
          </View>
        </View>

        {/* Title */}
        <Typography variant="display" style={{ textAlign: "center" }}>
          {title}
        </Typography>

        {currentUsage && (
          <Typography variant="body" style={{ textAlign: "center" }}>
            {currentUsage}
          </Typography>
        )}

        {message && (
          <Typography
            variant="body"
            style={{ textAlign: "center", maxWidth: 300, alignSelf: "center" }}
          >
            {message}
          </Typography>
        )}

        {/* Upgrade prompt */}
        <Card
          style={{
            backgroundColor: theme.colors.premiumBg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Ionicons name="arrow-up-circle" size={20} color={theme.colors.premium} />
          <Typography variant="body" color={theme.colors.premium} style={{ flex: 1 }}>
            Quero ter limite ilimitado agora para nao perder vendas!
          </Typography>
        </Card>

        {/* Benefits Card */}
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="star" size={18} color={theme.colors.premium} />
            <Typography variant="h3" color={theme.colors.premium}>
              Premium
            </Typography>
          </View>

          {BENEFITS.map((benefit) => (
            <View
              key={benefit}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Typography variant="body" color={theme.colors.text}>
                {benefit}
              </Typography>
            </View>
          ))}
        </Card>

        {/* Plan Selection */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => setSelectedPlan("monthly")}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderColor:
                selectedPlan === "monthly" ? theme.colors.premium : theme.colors.surface,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: "center",
              gap: 4,
            }}
          >
            <Typography variant="caption">Mensal</Typography>
            <Typography variant="moneyLg" color={theme.colors.premium}>
              R$ 14,90
            </Typography>
            <Typography variant="caption">/mes</Typography>
          </Pressable>

          <Pressable
            onPress={() => setSelectedPlan("annual")}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 16,
              borderWidth: 2,
              borderColor:
                selectedPlan === "annual" ? theme.colors.premium : theme.colors.surface,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: "center",
              gap: 4,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.success,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <Typography variant="caption" color={theme.colors.textOnPrimary}>
                -33%
              </Typography>
            </View>
            <Typography variant="caption">Anual</Typography>
            <Typography variant="moneyLg" color={theme.colors.premium}>
              R$ 119,90
            </Typography>
            <Typography variant="caption">/ano</Typography>
          </Pressable>
        </View>

        {/* Trial info */}
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center" }}
        >
          7 dias gratis para experimentar. Cancele quando quiser.
        </Typography>

        {/* Actions */}
        <View style={{ gap: 12, paddingBottom: 16 }}>
          <Button
            title="Comecar teste gratis"
            variant="premium"
            size="lg"
            loading={loading}
            onPress={handleSubscribe}
            icon={<Ionicons name="star" size={18} color="#FFFFFF" />}
          />

          {onPayWithMercadoPago && (
            <Pressable
              onPress={() => onPayWithMercadoPago(selectedPlan)}
              style={{
                alignItems: "center",
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.surface,
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="qr-code" size={18} color={theme.colors.text} />
              <Typography variant="body" color={theme.colors.text}>
                Pagar com PIX ou cartao
              </Typography>
            </Pressable>
          )}

          <Pressable
            onPress={handleRestore}
            style={{ alignItems: "center", paddingVertical: 4 }}
          >
            <Typography variant="caption" color={theme.colors.primary}>
              Restaurar compra anterior
            </Typography>
          </Pressable>

          {onClose && (
            <Pressable
              onPress={onClose}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Typography variant="body" color={theme.colors.textSecondary}>
                Agora nao
              </Typography>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
