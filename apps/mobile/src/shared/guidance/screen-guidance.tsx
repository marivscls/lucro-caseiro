import {
  Button,
  Typography,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
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
}: Readonly<ScreenGuidanceProps>) {
  const { theme } = useTheme();
  const router = useRouter();
  const userId = useAuth((state) => state.userId);
  const progress = useGuidanceStore((state) =>
    userId ? (state.accounts[userId]?.[area] ?? EMPTY_PROGRESS) : EMPTY_PROGRESS,
  );
  const ready = useGuidanceStore((state) => !!userId && !!state.ready[userId]);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const trigger = useRef<View>(null);
  const helpScroll = useRef<ScrollView>(null);
  const content = guidanceContent[area];
  const identity = `${userId}:${area}`;
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
  if (!userId || suspended) return null;
  return (
    <View
      testID={`screen-guidance-${area}`}
      style={{
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        flexShrink: 1,
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
      }}
    >
      {introduce ? (
        <ScrollView
          style={{ maxHeight: 360 }}
          contentContainerStyle={{
            padding: spacing.md,
            gap: spacing.sm,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="h3" accessibilityRole="header">
            {title ?? content.title}
          </Typography>
          <Typography variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
            {description ?? content.description}
          </Typography>
          <Button
            title={actionLabel ?? content.action}
            onPress={() => start()}
            size="lg"
            fitTitle={false}
            titleLines={2}
          />
          {secondary ? (
            <Button
              title={secondary.label}
              onPress={() => start(secondary.onPress)}
              variant="outline"
              size="lg"
              fitTitle={false}
              titleLines={2}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              useGuidanceStore.getState().mark(userId, area, "dismissed");
              guidanceEvent(area, "dismissed", userId);
            }}
            style={{ minHeight: 48, justifyContent: "center", alignItems: "center" }}
          >
            <Typography variant="bodyBold">Agora não</Typography>
          </Pressable>
        </ScrollView>
      ) : null}
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={`Como usar: ${content.title}`}
        accessibilityHint="Abre o passo a passo desta tela"
        onPress={() => {
          setHelpFor(identity);
          guidanceEvent(area, "help_opened", userId);
        }}
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          alignSelf: "flex-start",
          paddingVertical: spacing.sm,
          paddingLeft: spacing.sm,
          paddingRight: spacing.lg,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: pressed
            ? theme.colors.primaryBg
            : theme.colors.surfaceElevated,
        })}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primaryBg,
          }}
        >
          <AppIcon
            name="help-circle-outline"
            size={iconSizes.inline}
            color={theme.colors.primaryStrong}
          />
        </View>
        <Typography variant="bodyBold">Como usar</Typography>
      </Pressable>
      <StandardModal
        visible={helpOpen}
        onClose={closeHelp}
        title="Como usar esta tela"
        scrollRef={helpScroll}
        footer={
          <Button
            title={actionLabel ?? content.action}
            onPress={() => start()}
            size="lg"
            fitTitle={false}
            titleLines={2}
          />
        }
      >
        <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <AppIcon
              name="bulb-outline"
              size={iconSizes.md}
              color={theme.colors.primaryStrong}
            />
          </View>
          <Typography variant="h3" style={{ flex: 1 }}>
            {title ?? content.title}
          </Typography>
        </View>
        <Typography variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
          {description ?? content.description}
        </Typography>
        <View>
          {content.steps.map((step, index) => {
            const last = index === content.steps.length - 1;
            return (
              <View key={step} style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: radii.full,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.primaryBg,
                    }}
                  >
                    <Typography variant="captionBold" color={theme.colors.primaryStrong}>
                      {index + 1}
                    </Typography>
                  </View>
                  {last ? null : (
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        marginVertical: spacing.xs,
                        borderRadius: radii.full,
                        backgroundColor: theme.colors.border,
                      }}
                    />
                  )}
                </View>
                <Typography
                  variant="body"
                  style={{
                    flex: 1,
                    fontSize: 16,
                    lineHeight: 24,
                    paddingTop: 3,
                    paddingBottom: last ? 0 : spacing.lg,
                  }}
                >
                  {step}
                </Typography>
              </View>
            );
          })}
        </View>
        <View
          style={{
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <AppIcon
              name="eye-outline"
              size={iconSizes.xs}
              color={theme.colors.primaryStrong}
            />
            <Typography variant="captionBold" color={theme.colors.primaryStrong}>
              {content.preview.heading}
            </Typography>
          </View>
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            {content.preview.rows.map((row) => (
              <View
                key={row.label}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <AppIcon
                  name={row.icon}
                  size={iconSizes.sm}
                  color={theme.colors.textSecondary}
                />
                <Typography variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {row.label}
                </Typography>
                {row.value ? (
                  <Typography variant="bodyBold">{row.value}</Typography>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <AppIcon
            name="checkmark-circle-outline"
            size={iconSizes.sm}
            color={theme.colors.success}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Typography variant="bodyBold">Depois de concluir</Typography>
            <Typography variant="body">{content.next}</Typography>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setHelpFor(null);
            router.push("/support");
          }}
          style={({ pressed }) => ({
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            alignSelf: "flex-start",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <AppIcon
            name="chatbubble-ellipses-outline"
            size={iconSizes.sm}
            color={theme.colors.primaryStrong}
          />
          <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
            Ainda preciso de ajuda
          </Typography>
        </Pressable>
      </StandardModal>
    </View>
  );
}
