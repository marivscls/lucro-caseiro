import { fonts, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { desktopModalSurface } from "../layout/desktop-density";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "./responsive-modal-surface";

// Mini-calculadora (modal). Operações encadeadas simples (sem precedência),
// decimal com vírgula. "Usar" devolve o número resultante para o campo.

type Op = "+" | "-" | "×" | "÷";

function parseDisplay(s: string): number {
  return parseFloat(s.replace(",", ".")) || 0;
}

function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(".", ",");
}

function apply(a: number, b: number, op: Op): number {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  return b === 0 ? 0 : a / b;
}

interface CalculatorModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onResult: (value: number) => void;
}

export function CalculatorModal({ visible, onClose, onResult }: CalculatorModalProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const keyBg = theme.colors.surface;
  const sheetBg = theme.colors.surfaceElevated;

  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);
  // Linha de cima: "3 ×" ao montar e "3 × 3" depois do "=".
  const [topLine, setTopLine] = useState("");

  function pressDigit(d: string) {
    if (fresh) {
      if (op == null) setTopLine(""); // número novo (após resultado/limpar)
      setDisplay(d);
      setFresh(false);
    } else {
      setDisplay((cur) => (cur === "0" ? d : cur + d));
    }
  }

  function pressDecimal() {
    if (fresh) {
      if (op == null) setTopLine("");
      setDisplay("0,");
      setFresh(false);
    } else if (!display.includes(",")) {
      setDisplay((cur) => `${cur},`);
    }
  }

  function pressOp(next: Op) {
    const cur = parseDisplay(display);
    let accVal = cur;
    if (acc != null && op && !fresh) {
      accVal = apply(acc, cur, op);
      setDisplay(formatNumber(accVal));
    }
    setAcc(accVal);
    setOp(next);
    setFresh(true);
    setTopLine(`${formatNumber(accVal)} ${next}`);
  }

  function pressEquals() {
    if (acc != null && op) {
      const operand = parseDisplay(display);
      const result = apply(acc, operand, op);
      setTopLine(`${formatNumber(acc)} ${op} ${formatNumber(operand)}`);
      setDisplay(formatNumber(result));
      setAcc(null);
      setOp(null);
      setFresh(true);
    }
  }

  function clearAll() {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setFresh(true);
    setTopLine("");
  }

  function backspace() {
    setDisplay((cur) => (cur.length > 1 ? cur.slice(0, -1) : "0"));
  }

  function use() {
    onResult(parseDisplay(display));
    clearAll();
    onClose();
  }

  function Key({
    label,
    onPress,
    tone = "default",
    icon,
    active = false,
  }: Readonly<{
    label?: string;
    onPress: () => void;
    tone?: "default" | "op" | "danger";
    icon?: AppIconName;
    active?: boolean;
  }>) {
    let bg = keyBg;
    let fg = theme.colors.text;
    if (tone === "op") {
      // Operadores em rosa sólido (alto contraste); o operador pendente fica com anel claro.
      bg = theme.colors.primary;
      fg = theme.colors.textOnPrimary;
    } else if (tone === "danger") {
      fg = theme.colors.alert;
    }
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label ?? icon}
        accessibilityState={{ selected: active }}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 56,
          borderRadius: radii.md,
          backgroundColor: bg,
          borderWidth: active ? 2 : 0,
          borderColor: active ? theme.colors.textOnPrimary : "transparent",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {icon ? (
          <AppIcon name={icon} size={22} color={fg} />
        ) : (
          <Typography variant="h3" color={fg}>
            {label}
          </Typography>
        )}
      </Pressable>
    );
  }

  // Operador aguardando o próximo número (para destaque do botão).
  const pendingOp = fresh ? op : null;

  return (
    <ResponsiveOverlayModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: isDesktop ? "center" : "flex-end",
          padding: isDesktop ? spacing.xl : 0,
        }}
      >
        <Pressable
          style={[
            {
              backgroundColor: sheetBg,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom,
              gap: spacing.sm,
            },
            desktopModalSurface(isDesktop, 480),
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 18 }}>
              Calculadora
            </Typography>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar">
              <AppIcon name="close" size={26} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View
            style={{
              minHeight: 72,
              borderRadius: radii.lg,
              backgroundColor: keyBg,
              justifyContent: "center",
              alignItems: "flex-end",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              gap: 2,
            }}
          >
            <Typography
              variant="caption"
              color={theme.colors.primary}
              numberOfLines={1}
              style={{ fontSize: 16, minHeight: 20, fontFamily: fonts.bold }}
            >
              {topLine}
            </Typography>
            <Typography
              variant="moneyLg"
              color={theme.colors.text}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              style={{ fontSize: 32 }}
            >
              {display}
            </Typography>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Key label="C" tone="danger" onPress={clearAll} />
            <Key icon="backspace-outline" onPress={backspace} />
            <Key
              label="÷"
              tone="op"
              active={pendingOp === "÷"}
              onPress={() => pressOp("÷")}
            />
            <Key
              label="×"
              tone="op"
              active={pendingOp === "×"}
              onPress={() => pressOp("×")}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Key label="7" onPress={() => pressDigit("7")} />
            <Key label="8" onPress={() => pressDigit("8")} />
            <Key label="9" onPress={() => pressDigit("9")} />
            <Key
              label="−"
              tone="op"
              active={pendingOp === "-"}
              onPress={() => pressOp("-")}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Key label="4" onPress={() => pressDigit("4")} />
            <Key label="5" onPress={() => pressDigit("5")} />
            <Key label="6" onPress={() => pressDigit("6")} />
            <Key
              label="+"
              tone="op"
              active={pendingOp === "+"}
              onPress={() => pressOp("+")}
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Key label="1" onPress={() => pressDigit("1")} />
            <Key label="2" onPress={() => pressDigit("2")} />
            <Key label="3" onPress={() => pressDigit("3")} />
            <Key label="=" tone="op" onPress={pressEquals} />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Key label="0" onPress={() => pressDigit("0")} />
            <Key label="," onPress={pressDecimal} />
            <View style={{ flex: 2 }} />
          </View>

          <Pressable
            onPress={use}
            accessibilityRole="button"
            style={({ pressed }) => ({
              minHeight: 52,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginTop: spacing.xs,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Typography
              variant="bodyBold"
              color={theme.colors.textOnPrimary}
              style={{ fontSize: 16 }}
            >
              Usar valor
            </Typography>
          </Pressable>
        </Pressable>
      </Pressable>
    </ResponsiveOverlayModal>
  );
}
