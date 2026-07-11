import { fonts, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { brToIso } from "../utils/date";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoOf(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function brOf(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** 42 dias (6 semanas) cobrindo o mês, começando no domingo. */
function buildDays(month: Date): { date: Date; inMonth: boolean }[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function monthFromBR(value: string): Date {
  const iso = brToIso(value);
  if (iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
}

interface CalendarModalProps {
  readonly visible: boolean;
  /** Data atual em "DD/MM/AAAA" (ou vazio). */
  readonly value: string;
  /** Recebe a data escolhida em "DD/MM/AAAA". */
  readonly onSelect: (br: string) => void;
  readonly onClose: () => void;
}

/**
 * Calendário temático (segue o tema claro/escuro do app) com navegação de mês E
 * seletor de ano — toque no título alterna entre a grade de dias e a de anos.
 * Fonte única de calendário do app (substitui os pickers nativos e os modais
 * escuros hardcoded).
 */
export function CalendarModal({ visible, value, onSelect, onClose }: CalendarModalProps) {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const [viewMonth, setViewMonth] = useState<Date>(() => monthFromBR(value));
  const [pickingYear, setPickingYear] = useState(false);

  // Ao abrir, posiciona no mês da data atual e volta pra grade de dias.
  useEffect(() => {
    if (visible) {
      setViewMonth(monthFromBR(value));
      setPickingYear(false);
    }
  }, [visible, value]);

  const selectedIso = brToIso(value);
  const todayIso = isoOf(new Date());
  const days = useMemo(() => buildDays(viewMonth), [viewMonth]);

  const year = viewMonth.getFullYear();
  const yearWindowStart = year - (year % 12);
  const years = Array.from({ length: 12 }, (_, i) => yearWindowStart + i);

  const border = isDark ? "rgba(255,255,255,0.10)" : "rgba(74,50,40,0.10)";
  const mutedFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(74,50,40,0.04)";

  function shiftMonth(offset: number) {
    setViewMonth(new Date(year, viewMonth.getMonth() + offset, 1));
  }

  function shiftYearWindow(offset: number) {
    setViewMonth(new Date(year + offset, viewMonth.getMonth(), 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            marginHorizontal: spacing.xl,
            padding: spacing.lg,
            borderRadius: radii["2xl"],
            backgroundColor: theme.colors.surfaceElevated,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          {/* Cabeçalho: chevrons + título (toque alterna dias/anos) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <Pressable
              onPress={() => (pickingYear ? shiftYearWindow(-12) : shiftMonth(-1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={pickingYear ? "Anos anteriores" : "Mês anterior"}
              style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="chevron-back" size={26} color={theme.colors.primary} />
            </Pressable>

            <Pressable
              onPress={() => setPickingYear((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Escolher mês ou ano"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                minHeight: 44,
                paddingHorizontal: spacing.md,
              }}
            >
              <Typography variant="h3" color={theme.colors.text} style={{ fontSize: 19 }}>
                {pickingYear
                  ? `${years[0]} – ${years[years.length - 1]}`
                  : `${MONTHS[viewMonth.getMonth()]} ${year}`}
              </Typography>
              <Ionicons
                name={pickingYear ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => (pickingYear ? shiftYearWindow(12) : shiftMonth(1))}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={pickingYear ? "Próximos anos" : "Próximo mês"}
              style={{
                minWidth: 44,
                minHeight: 44,
                justifyContent: "center",
                alignItems: "flex-end",
              }}
            >
              <Ionicons name="chevron-forward" size={26} color={theme.colors.primary} />
            </Pressable>
          </View>

          {pickingYear ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {years.map((y) => {
                const selected = y === year;
                return (
                  <View key={y} style={{ width: "25%", padding: 4 }}>
                    <Pressable
                      onPress={() => {
                        setViewMonth(new Date(y, viewMonth.getMonth(), 1));
                        setPickingYear(false);
                      }}
                      accessibilityRole="button"
                      style={{
                        minHeight: 48,
                        borderRadius: radii.lg,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? theme.colors.primary : mutedFill,
                      }}
                    >
                      <Typography
                        variant="bodyBold"
                        color={selected ? theme.colors.textOnPrimary : theme.colors.text}
                      >
                        {y}
                      </Typography>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", marginBottom: spacing.xs }}>
                {WEEK_LABELS.map((label, index) => (
                  <Typography
                    key={`${label}-${index}`}
                    variant="caption"
                    color={theme.colors.primary}
                    style={{
                      width: `${100 / 7}%`,
                      textAlign: "center",
                      fontFamily: fonts.extraBold,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {days.map(({ date, inMonth }) => {
                  const iso = isoOf(date);
                  const selected = selectedIso === iso;
                  const isToday = todayIso === iso;
                  let dayColor = theme.colors.textSecondary;
                  if (selected) dayColor = theme.colors.textOnPrimary;
                  else if (inMonth) dayColor = theme.colors.text;
                  return (
                    <Pressable
                      key={iso}
                      accessibilityRole="button"
                      accessibilityLabel={brOf(date)}
                      onPress={() => {
                        onSelect(brOf(date));
                        onClose();
                      }}
                      style={{
                        width: `${100 / 7}%`,
                        height: 42,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: selected
                            ? theme.colors.primary
                            : "transparent",
                          borderWidth: isToday && !selected ? 1.5 : 0,
                          borderColor: theme.colors.primary,
                        }}
                      >
                        <Typography
                          variant="body"
                          color={dayColor}
                          style={{ fontFamily: fonts.bold, opacity: inMonth ? 1 : 0.45 }}
                        >
                          {date.getDate()}
                        </Typography>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{
              marginTop: spacing.md,
              minHeight: 48,
              borderRadius: radii.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primary,
            }}
          >
            <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
              Fechar
            </Typography>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
