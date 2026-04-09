import { Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PaywallProps {
  readonly title?: string;
  readonly message?: string;
  readonly currentUsage?: string;
  readonly onSubscribe?: () => void;
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
];

export function Paywall({
  title = "Seu negocio merece mais!",
  message,
  currentUsage,
  onSubscribe,
  onClose,
}: PaywallProps) {
  const { theme } = useTheme();

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

        {/* Price Card */}
        <Card style={{ alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <Typography
              variant="moneyHero"
              color={theme.colors.premium}
              style={{ fontSize: 40 }}
            >
              R$ 14,90
            </Typography>
            <Typography variant="body">/mes</Typography>
          </View>
          <Typography variant="caption">ou R$ 119,90/ano (economize 33%)</Typography>
        </Card>

        {/* Actions */}
        <View style={{ gap: 12, paddingBottom: 16 }}>
          <Button
            title="Assinar Premium"
            variant="premium"
            size="lg"
            onPress={onSubscribe}
            icon={<Ionicons name="star" size={18} color="#FFFFFF" />}
          />
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
