import { spacing } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { AppIcon } from "../../../shared/components/app-icon";
import { nextSeasonalDate, seasonalTitle } from "../seasonal-dates";
import { useSeasonalDismissals } from "../use-seasonal-dismissals";
import { HomeCard, HomePrimaryButton, IconBox, T, useHomeColors } from "./parts";
import { styles } from "./styles";

const BUTTON = { flexGrow: 1, flexBasis: 200 } as const;

/**
 * "Datas que vendem": a data comercial mais próxima (Natal, Black Friday,
 * Dia das Mães…) dentro da janela de aviso, com uma dica e dois atalhos.
 * Some quando não há data na janela ou quando a pessoa dispensa aquela data.
 */
export function HomeSeasonalCard({
  now,
  userId,
  scheduling,
  service,
  style,
}: Readonly<{
  now: Date;
  userId: string | null;
  /** A marca tem agenda; sem ela, o botão de encomenda não aparece. */
  scheduling: boolean;
  /** Negócio de serviço: o atalho agenda um atendimento. */
  service: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  const colors = useHomeColors();
  const router = useRouter();
  const { loaded, dismissed, dismiss } = useSeasonalDismissals(userId, now);
  if (!loaded) return null;
  const upcoming = nextSeasonalDate(now, dismissed);
  if (!upcoming) return null;
  const title = seasonalTitle(upcoming);
  return (
    <HomeCard style={[{ padding: spacing.xl, gap: spacing.md }, style]}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <IconBox name="gift-outline" />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T style={styles.tag} color={colors.wine}>
            DATAS QUE VENDEM
          </T>
          <T style={styles.h3} accessibilityRole="header">
            {title}
          </T>
        </View>
      </View>
      <T style={styles.body} color={colors.muted}>
        {upcoming.tip}
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {scheduling ? (
          <HomePrimaryButton
            label={service ? "Agendar atendimento" : "Anotar encomenda"}
            icon="calendar-outline"
            height={52}
            style={BUTTON}
            onPress={() => router.push("/tabs/agenda?create=home")}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Abre o catálogo para mandar o link às suas clientes"
          onPress={() => router.push("/catalog")}
          style={({ pressed }) => [
            styles.primary,
            BUTTON,
            {
              minHeight: 52,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.white,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <AppIcon name="share-social-outline" size={22} color={colors.strong} />
          <T style={styles.primaryLabel} color={colors.strong}>
            Divulgar catálogo
          </T>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Esconder o aviso: ${upcoming.name}`}
        onPress={() => dismiss(upcoming.key)}
        hitSlop={4}
        style={({ pressed }) => [
          styles.ghost,
          { minHeight: 48, alignSelf: "flex-start", opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <AppIcon name="close-outline" size={18} color={colors.muted} />
        <T style={styles.ghostLabel} color={colors.muted}>
          Esconder este aviso
        </T>
      </Pressable>
    </HomeCard>
  );
}
