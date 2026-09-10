import {
  Button,
  Typography,
  spacing,
  useReducedMotion,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AppIcon } from "../components/app-icon";
import { StandardModal } from "../components/standard-modal";
import { useAuth } from "../hooks/use-auth";
import { guidanceContent } from "./guidance-content";
import {
  shouldIntroduce,
  type GuidanceArea,
  type GuidanceProgress,
} from "./guidance.domain";
import { useGuidanceStore } from "./guidance-store";
import { guidanceEvent } from "./guidance-events";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import { desktopWidths } from "../layout/desktop-density";
export interface ScreenGuidanceProps {
  area: GuidanceArea;
  onStart: () => void;
  actionLabel?: string;
  secondary?: { label: string; onPress: () => void };
  hasRecords?: boolean;
  loading?: boolean;
  suspended?: boolean;
  title?: string;
  description?: string;
}
const EMPTY_PROGRESS: GuidanceProgress = {};
export function ScreenGuidance({
  area,
  onStart,
  actionLabel,
  secondary,
  hasRecords = false,
  loading = false,
  suspended = false,
  title,
  description,
  renderHeader,
}: Readonly<
  ScreenGuidanceProps & {
    renderHeader: (helpButton: React.ReactNode) => React.ReactNode;
  }
>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const userId = useAuth((state) => state.userId);
  const progress = useGuidanceStore((state) =>
    userId ? (state.accounts[userId]?.[area] ?? EMPTY_PROGRESS) : EMPTY_PROGRESS,
  );
  const ready = useGuidanceStore((state) => !!userId && !!state.ready[userId]);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const [dismissFor, setDismissFor] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const trigger = useRef<View>(null);
  const helpScroll = useRef<ScrollView>(null);
  const content = guidanceContent[area];
  const identity = `${userId}:${area}`;
  const dismissing = dismissFor === identity;
  const helpOpen = helpFor === identity && !suspended;
  const introduce =
    ready && !loading && !suspended && shouldIntroduce(progress, hasRecords);
  useEffect(() => {
    if (userId) void useGuidanceStore.getState().load(userId);
  }, [userId]);
  useEffect(() => {
    if (!userId || !introduce || progress.presented) return;
    useGuidanceStore.getState().mark(userId, area, "presented");
    guidanceEvent(area, "presented", userId);
  }, [area, introduce, progress, userId]);
  useEffect(() => {
    if (!introduce) {
      opacity.setValue(reducedMotion ? 1 : 0);
      return;
    }
    const finish = () => {
      if (!dismissing || !userId) return;
      useGuidanceStore.getState().mark(userId, area, "dismissed");
      guidanceEvent(area, "dismissed", userId);
    };
    if (reducedMotion) {
      opacity.setValue(dismissing ? 0 : 1);
      finish();
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: dismissing ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) finish();
    });
    return () => animation.stop();
  }, [area, dismissing, introduce, opacity, reducedMotion, userId]);
  function closeHelp() {
    setHelpFor(null);
    requestAnimationFrame(() => {
      if (Platform.OS === "web")
        (trigger.current as unknown as HTMLElement | null)?.focus();
      else {
        const handle = findNodeHandle(trigger.current);
        if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
      }
    });
  }
  function start(action = onStart) {
    setHelpFor(null);
    if (userId) guidanceEvent(area, "task_started", userId);
    action();
  }
  if (!userId || suspended) return <>{renderHeader(null)}</>;
  return (
    <>
      {renderHeader(
        <Pressable
          ref={trigger}
          accessibilityRole="button"
          accessibilityLabel={content.helpTitle}
          accessibilityHint="Abre as orientações desta tela"
          accessibilityState={{ expanded: helpOpen }}
          onPress={() => {
            setHelpFor(identity);
            guidanceEvent(area, "help_opened", userId);
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 22,
            backgroundColor: pressed ? theme.colors.surface : "transparent",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <AppIcon
            name="help-circle-outline"
            size={22}
            color={theme.colors.textSecondary}
          />
        </Pressable>,
      )}
      {introduce ? (
        <View
          testID={`screen-guidance-${area}`}
          style={{
            gap: spacing.sm,
            paddingHorizontal: isDesktop ? 0 : spacing.lg,
            paddingBottom: spacing.sm,
            flexShrink: 1,
            width: "100%",
            maxWidth: isDesktop ? desktopWidths.data : 720,
            alignSelf: isDesktop ? "stretch" : "center",
          }}
        >
          <Animated.View style={{ opacity }} pointerEvents={dismissing ? "none" : "auto"}>
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{
                padding: isDesktop ? spacing.lg : spacing.md,
                gap: isDesktop ? spacing.xl : spacing.sm,
                flexDirection: isDesktop ? "row" : "column",
                flexWrap: isDesktop ? "wrap" : "nowrap",
                alignItems: isDesktop ? "center" : "stretch",
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={
                  isDesktop
                    ? { flex: 1, minWidth: 280, gap: spacing.xs }
                    : { gap: spacing.sm }
                }
              >
                <Typography variant="h3" accessibilityRole="header">
                  {title ?? content.title}
                </Typography>
                <Typography variant="body">
                  {description ?? content.description}
                </Typography>
              </View>
              <View
                style={
                  isDesktop
                    ? { width: 260, maxWidth: "100%", gap: spacing.xs }
                    : { gap: spacing.sm }
                }
              >
                <Button
                  title={actionLabel ?? content.action}
                  onPress={() => start()}
                  disabled={dismissing}
                  size="lg"
                  fitTitle={false}
                  titleLines={2}
                />
                {secondary ? (
                  <Pressable
                    onPress={() => start(secondary.onPress)}
                    accessibilityRole="button"
                    disabled={dismissing}
                    style={{
                      minHeight: 48,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                      {secondary.label}
                    </Typography>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDismissFor(identity)}
                  disabled={dismissing}
                  style={{
                    minHeight: 48,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="bodyBold">Agora não</Typography>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
      <StandardModal
        visible={helpOpen}
        onClose={closeHelp}
        title={content.helpTitle}
        scrollRef={helpScroll}
        footer={
          <View
            style={{
              flex: 1,
              alignItems: isDesktop ? "flex-end" : "center",
            }}
          >
            <Button
              title={actionLabel ?? content.action}
              onPress={() => start()}
              size="lg"
              fitTitle={false}
              titleLines={2}
            />
          </View>
        }
      >
        <Typography variant="h3">{title ?? content.title}</Typography>
        <Typography variant="body">{description ?? content.description}</Typography>
        {content.steps.map((step, index) => (
          <Typography key={step} variant="body">
            {index + 1}. {step}
          </Typography>
        ))}
        <Typography variant="bodyBold">Depois de concluir</Typography>
        <Typography variant="body">{content.next}</Typography>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setHelpFor(null);
            router.push("/support");
          }}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
            Ainda preciso de ajuda
          </Typography>
        </Pressable>
      </StandardModal>
    </>
  );
}
