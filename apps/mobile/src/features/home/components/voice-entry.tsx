import React from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { HomeCard, T, useHomeColors } from "./parts";
import { styles } from "./styles";

/**
 * Atalho do Início para o Anotar falando: um "campo" que abre o assistente.
 * O app só projeta o saldo de usos que a API devolve.
 */
export function HomeVoiceEntry({
  usageLabel,
  onWrite,
  onSpeak,
}: Readonly<{
  usageLabel?: string;
  onWrite: () => void;
  onSpeak: () => void;
}>) {
  const colors = useHomeColors();
  return (
    <HomeCard style={{ padding: 16, gap: 12 }}>
      <T style={styles.sectionTitle} accessibilityRole="header">
        Qual venda você fez hoje?
      </T>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escrever a venda"
          onPress={onWrite}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 52,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.softRose,
            paddingHorizontal: 14,
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <T style={styles.caption15} color={colors.muted} numberOfLines={2}>
            Ex.: 3 marmitas no Pix
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Falar a venda"
          onPress={onSpeak}
          style={({ pressed }) => ({
            minWidth: 52,
            minHeight: 52,
            borderRadius: 26,
            backgroundColor: colors.action,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 14,
            flexDirection: "row",
            gap: 6,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <AppIcon name="mic-outline" size={22} color={colors.onAction} />
          <T style={styles.primaryLabel} color={colors.onAction}>
            Falar
          </T>
        </Pressable>
      </View>
      {usageLabel ? (
        <T style={styles.caption} color={colors.muted}>
          {usageLabel}
        </T>
      ) : null}
    </HomeCard>
  );
}
