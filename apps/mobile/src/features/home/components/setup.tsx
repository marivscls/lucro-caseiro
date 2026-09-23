import { spacing } from "@lucro-caseiro/ui";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  SETUP_ORDER,
  currentSetupStep,
  doneSetupSteps,
  type SetupStepId,
  type SetupSteps,
} from "../domain";
import {
  GhostLink,
  HomeCard,
  HomePrimaryButton,
  IconBox,
  T,
  useHomeColors,
} from "./parts";
import { styles } from "./styles";

// ---------------------------------------------------------------------------
// Fase 1 — primeiros passos
// ---------------------------------------------------------------------------

export const STEP_COPY: Record<
  SetupStepId,
  { title: string; detail: string; action: string }
> = {
  product: {
    title: "Cadastrar seu primeiro produto",
    detail: "Nome e preço de venda. Leva 1 minuto.",
    action: "Cadastrar produto",
  },
  price: {
    title: "Descobrir o preço certo",
    detail: "Some os custos e veja quanto sobra em cada venda.",
    action: "Calcular agora",
  },
  sale: {
    title: "Anotar sua primeira venda",
    detail: "Aí o Início passa a mostrar seu lucro do dia.",
    action: "Anotar venda",
  },
};

function ProgressRing({ done, size }: Readonly<{ done: number; size: number }>) {
  const colors = useHomeColors();
  const stroke = size > 70 ? 8 : 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} de 3 passos feitos`}
      accessibilityValue={{ min: 0, max: 3, now: done }}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.ringTrack}
          strokeWidth={stroke}
        />
        {done > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.rose}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - done / 3)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <T style={styles.ringLabel}>{done} de 3</T>
      </View>
    </View>
  );
}

export function HomeSetupSteps({
  steps,
  desktop,
  onAction,
}: Readonly<{
  steps: SetupSteps;
  desktop: boolean;
  onAction: (step: SetupStepId) => void;
}>) {
  const colors = useHomeColors();
  const current = currentSetupStep(steps);
  return (
    <HomeCard
      style={[
        { padding: desktop ? 26 : spacing.lg, gap: desktop ? 18 : 10 },
        desktop ? { flex: 3 } : null,
      ]}
    >
      <View style={[styles.row, { gap: desktop ? 18 : 14 }]}>
        <ProgressRing done={doneSetupSteps(steps)} size={desktop ? 76 : 64} />
        <View style={{ flex: 1, minWidth: 0, gap: desktop ? 4 : 2 }}>
          <T style={desktop ? styles.h2Desk : styles.h2Phone} accessibilityRole="header">
            Falta pouco para ver seu lucro
          </T>
          <T style={desktop ? styles.body : styles.caption15} color={colors.muted}>
            {desktop
              ? "3 passos, uns 5 minutos no total. Depois o Início vira o painel do seu dia."
              : "3 passos, uns 5 minutos no total"}
          </T>
        </View>
      </View>
      <View style={{ gap: desktop ? 4 : 2 }}>
        {SETUP_ORDER.map((id, index) => {
          const done = steps[id];
          const now = id === current;
          const copy = STEP_COPY[id];
          return (
            <View
              key={id}
              style={[
                styles.step,
                now
                  ? { backgroundColor: colors.softRose, borderColor: colors.border }
                  : { borderColor: "transparent" },
              ]}
            >
              <View
                style={[
                  styles.stepDot,
                  done && { backgroundColor: colors.green },
                  now && { backgroundColor: colors.wineFill },
                  !done && !now && { borderWidth: 2, borderColor: colors.border },
                ]}
              >
                {done ? (
                  <AppIcon name="checkmark-outline" size={18} color={colors.onWine} />
                ) : (
                  <T style={styles.stepNumber} color={now ? colors.onWine : colors.muted}>
                    {index + 1}
                  </T>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <T
                  style={[
                    desktop ? styles.stepTitleDesk : styles.stepTitle,
                    done && styles.strike,
                  ]}
                  color={done ? colors.muted : colors.text}
                  accessibilityLabel={done ? `${copy.title}: feito` : copy.title}
                >
                  {copy.title}
                </T>
                <T style={styles.caption15} color={colors.muted}>
                  {copy.detail}
                </T>
                {now ? (
                  <HomePrimaryButton
                    label={copy.action}
                    icon={id === "sale" ? "add" : null}
                    height={52}
                    onPress={() => onAction(id)}
                    style={styles.stepButton}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </HomeCard>
  );
}

const EXAMPLE_COSTS: [string, string][] = [
  ["Ingredientes", "R$ 4,10"],
  ["Pote e colher", "R$ 0,90"],
  ["Gás e luz", "R$ 0,40"],
  ["Seu tempo (10 min)", "R$ 1,20"],
];

export function HomeSetupTip({ onPress }: Readonly<{ onPress: () => void }>) {
  const colors = useHomeColors();
  return (
    <HomeCard style={{ flex: 2, padding: 26, gap: spacing.lg }}>
      <View style={[styles.row, { gap: 14 }]}>
        <IconBox name="calculator-outline" size={48} />
        <T style={styles.h3} accessibilityRole="header">
          Por que o preço primeiro?
        </T>
      </View>
      <T style={styles.body} color={colors.muted}>
        Muita gente esquece gás, embalagem e o próprio tempo. Veja o que sobra de verdade:
      </T>
      <View style={[styles.example, { backgroundColor: colors.surface }]}>
        <View style={[styles.rowBetween, { paddingBottom: 6 }]}>
          <T style={styles.bodyBold}>Bolo de pote</T>
          <T style={styles.tag} color={colors.muted}>
            EXEMPLO
          </T>
        </View>
        {EXAMPLE_COSTS.map(([label, value]) => (
          <View key={label} style={[styles.rowBetween, { minHeight: 32 }]}>
            <T style={styles.body} color={colors.muted}>
              {label}
            </T>
            <T style={styles.bodyBold}>{value}</T>
          </View>
        ))}
        <View
          style={[
            styles.rowBetween,
            {
              minHeight: 42,
              marginTop: 4,
              borderTopWidth: 1,
              borderColor: colors.border,
            },
          ]}
        >
          <T style={styles.bodyBold}>Vende por R$ 12,00</T>
          <T style={styles.bodyStrong} color={colors.green}>
            sobra R$ 5,40
          </T>
        </View>
      </View>
      <View style={{ marginTop: "auto", borderTopWidth: 1, borderColor: colors.border }}>
        <GhostLink label="Calcular o preço do meu produto" onPress={onPress} />
      </View>
    </HomeCard>
  );
}
