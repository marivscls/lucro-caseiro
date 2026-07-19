import { Button, Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { ResponsiveOverlayModal } from "./responsive-modal-surface";

const SV_HEIGHT = 190;
const HUE_HEIGHT = 28;
const HEX_REGEX = /^#[0-9a-f]{6}$/;

interface Hsv {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb
    .map((ch) => {
      const value = Math.round((ch + m) * 255);
      return value.toString(16).padStart(2, "0");
    })
    .join("")}`;
}

export function hexToHsv(hex: string): Hsv {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

interface ColorPickerModalProps {
  readonly visible: boolean;
  readonly initialColor: string;
  readonly onConfirm: (hex: string) => void;
  readonly onCancel: () => void;
}

export function ColorPickerModal({
  visible,
  initialColor,
  onConfirm,
  onCancel,
}: ColorPickerModalProps) {
  const { theme } = useTheme();
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(initialColor));
  const [hexInput, setHexInput] = useState(initialColor);
  const [width, setWidth] = useState(0);

  const hex = hsvToHex(hsv);

  useEffect(() => {
    if (visible) {
      const start = HEX_REGEX.test(initialColor) ? initialColor : "#8c5a45";
      setHsv(hexToHsv(start));
      setHexInput(start);
    }
  }, [visible, initialColor]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  function applyTouchSv(x: number, y: number) {
    if (width === 0) return;
    setHsv((prev) => {
      const next = { ...prev, s: clamp01(x / width), v: clamp01(1 - y / SV_HEIGHT) };
      setHexInput(hsvToHex(next));
      return next;
    });
  }

  function applyTouchHue(x: number) {
    if (width === 0) return;
    setHsv((prev) => {
      const next = { ...prev, h: Math.min(359.9, Math.max(0, (x / width) * 360)) };
      setHexInput(hsvToHex(next));
      return next;
    });
  }

  function handleHexChange(text: string) {
    setHexInput(text);
    const raw = text.trim().replace(/^#/, "").toLowerCase();
    const candidate = `#${raw}`;
    if (HEX_REGEX.test(candidate)) {
      setHsv(hexToHsv(candidate));
    }
  }

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const markerLeft = hsv.s * width;
  const markerTop = (1 - hsv.v) * SV_HEIGHT;

  return (
    <ResponsiveOverlayModal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            width: "100%",
            maxWidth: 560,
            alignSelf: "center",
            borderRadius: radii["2xl"],
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Typography variant="h3">Escolha sua cor</Typography>

          {/* Caixa de saturação/brilho */}
          <View onLayout={onLayout}>
            <View
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) =>
                applyTouchSv(e.nativeEvent.locationX, e.nativeEvent.locationY)
              }
              onResponderMove={(e) =>
                applyTouchSv(e.nativeEvent.locationX, e.nativeEvent.locationY)
              }
              style={{ borderRadius: radii.lg, overflow: "hidden" }}
            >
              <Svg width="100%" height={SV_HEIGHT}>
                <Defs>
                  <LinearGradient id="sat" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#ffffff" />
                    <Stop offset="1" stopColor={hueColor} />
                  </LinearGradient>
                  <LinearGradient id="val" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                    <Stop offset="1" stopColor="#000000" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#sat)" />
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#val)" />
              </Svg>
              {width > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: markerLeft - 10,
                    top: markerTop - 10,
                    width: 20,
                    height: 20,
                    borderRadius: radii.full,
                    borderWidth: 2.5,
                    borderColor: "#ffffff",
                    backgroundColor: hex,
                    shadowColor: "#000",
                    shadowOpacity: 0.4,
                    shadowRadius: 3,
                    elevation: 3,
                  }}
                />
              )}
            </View>

            {/* Barra de matiz */}
            <View
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => applyTouchHue(e.nativeEvent.locationX)}
              onResponderMove={(e) => applyTouchHue(e.nativeEvent.locationX)}
              style={{
                marginTop: spacing.md,
                borderRadius: radii.full,
                overflow: "hidden",
              }}
            >
              <Svg width="100%" height={HUE_HEIGHT}>
                <Defs>
                  <LinearGradient id="hue" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="#ff0000" />
                    <Stop offset="0.17" stopColor="#ffff00" />
                    <Stop offset="0.33" stopColor="#00ff00" />
                    <Stop offset="0.5" stopColor="#00ffff" />
                    <Stop offset="0.67" stopColor="#0000ff" />
                    <Stop offset="0.83" stopColor="#ff00ff" />
                    <Stop offset="1" stopColor="#ff0000" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#hue)" />
              </Svg>
              {width > 0 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: (hsv.h / 360) * width - 4,
                    top: 0,
                    width: 8,
                    height: HUE_HEIGHT,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: "#ffffff",
                    backgroundColor: hueColor,
                  }}
                />
              )}
            </View>
          </View>

          {/* Prévia + hex */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radii.full,
                backgroundColor: hex,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.15)",
              }}
            />
            <View style={{ flex: 1 }}>
              <Input
                value={hexInput}
                onChangeText={handleHexChange}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={7}
                placeholder="#FF66AA"
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancelar" variant="secondary" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Confirmar" onPress={() => onConfirm(hex)} />
            </View>
          </View>

          <Pressable onPress={onCancel} accessibilityRole="button" hitSlop={8}>
            <Typography
              variant="caption"
              style={{ textAlign: "center" }}
              color={theme.colors.textSecondary}
            >
              Toque e arraste no quadro para escolher a cor
            </Typography>
          </Pressable>
        </View>
      </View>
    </ResponsiveOverlayModal>
  );
}
