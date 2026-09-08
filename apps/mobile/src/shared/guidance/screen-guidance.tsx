import { Button, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
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
        onPress={() => {
          setHelpFor(identity);
          guidanceEvent(area, "help_opened", userId);
        }}
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          alignSelf: "flex-start",
        }}
      >
        <AppIcon name="help-circle-outline" size={22} color={theme.colors.text} />
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
        <Typography variant="h3">{title ?? content.title}</Typography>
        <Typography variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
          {description ?? content.description}
        </Typography>
        {content.steps.map((step, index) => (
          <Typography key={step} variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
            {index + 1}. {step}
          </Typography>
        ))}
        <Typography variant="bodyBold">Depois de concluir</Typography>
        <Typography variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
          {content.next}
        </Typography>
        <Button
          title="Ainda preciso de ajuda"
          variant="outline"
          onPress={() => {
            setHelpFor(null);
            router.push("/support");
          }}
          size="lg"
        />
      </StandardModal>
    </View>
  );
}
