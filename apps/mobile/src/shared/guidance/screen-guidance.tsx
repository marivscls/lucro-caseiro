import {
  Button,
  Typography,
  spacing,
  useReducedMotion,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { AppIcon } from "../components/app-icon";
import { StandardModal } from "../components/standard-modal";
import { FormActions } from "../components/form-layout";
import { FormSection } from "../components/form-section";
import { useAuth } from "../hooks/use-auth";
import { guidanceContent } from "./guidance-content";
import {
  shouldIntroduce,
  type GuidanceArea,
  type GuidanceProgress,
} from "./guidance.domain";
import { useGuidanceStore } from "./guidance-store";
import { guidanceEvent } from "./guidance-events";
import { TutorialVideoModal } from "./tutorial-video-modal";
import { TutorialVideoThumb } from "./tutorial-video-thumb";
import { getTutorialVideoForArea } from "./tutorial-videos";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import { desktopLayout, desktopWidths } from "../layout/desktop-density";
import { screenCreateBarBottomPadding } from "../layout/floating-tab-bar";
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
  /**
   * Celular: cartão enxuto (texto e botões em menos altura), para telas em que
   * a tarefa precisa de espaço logo abaixo, como Nova venda.
   */
  compact?: boolean;
}
export interface ScreenGuidanceParts {
  /** Botão "Ajuda" para o cabeçalho; null quando não há conta ou está suspenso. */
  help: React.ReactNode;
  /** Cartão de boas-vindas da tela, quando deve aparecer. */
  intro: React.ReactNode;
  /** Modal com o passo a passo, aberto pelo botão "Ajuda". */
  modal: React.ReactNode;
}
const EMPTY_PROGRESS: GuidanceProgress = {};

const useTakeoverStore = create<{
  areas: Partial<Record<GuidanceArea, boolean>>;
  set: (area: GuidanceArea, active: boolean) => void;
}>((set) => ({
  areas: {},
  set: (area, active) =>
    set((state) =>
      !!state.areas[area] === active
        ? state
        : { areas: { ...state.areas, [area]: active } },
    ),
}));

/**
 * No celular, uma lista ainda vazia que tem tutorial mostra o guia na tela
 * inteira. A tela usa este valor para não desenhar o próprio vazio por baixo.
 */
export function useGuidanceTakeover(area: GuidanceArea): boolean {
  return useTakeoverStore((state) => !!state.areas[area]);
}
export function ScreenGuidance({
  renderHeader,
  ...props
}: Readonly<
  ScreenGuidanceProps & {
    renderHeader: (helpButton: React.ReactNode) => React.ReactNode;
  }
>) {
  const { help, intro, modal } = useScreenGuidance(props);
  return (
    <>
      {renderHeader(help)}
      {intro}
      {modal}
    </>
  );
}

/**
 * Mesmas orientações do ScreenGuidance, em partes soltas: a tela decide onde o
 * cartão entra (por exemplo, dentro da rolagem, para não prender espaço fixo).
 */
export function useScreenGuidance({
  area,
  onStart,
  actionLabel,
  secondary,
  hasRecords = false,
  loading = false,
  suspended = false,
  title,
  description,
  compact = false,
}: Readonly<ScreenGuidanceProps>): ScreenGuidanceParts {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const userId = useAuth((state) => state.userId);
  const progress = useGuidanceStore((state) =>
    userId ? (state.accounts[userId]?.[area] ?? EMPTY_PROGRESS) : EMPTY_PROGRESS,
  );
  const ready = useGuidanceStore((state) => !!userId && !!state.ready[userId]);
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const [videoFor, setVideoFor] = useState<string | null>(null);
  const [dismissFor, setDismissFor] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const trigger = useRef<View>(null);
  const helpScroll = useRef<ScrollView>(null);
  const content = guidanceContent[area];
  const tutorial = getTutorialVideoForArea(area);
  const identity = `${userId}:${area}`;
  const dismissing = dismissFor === identity;
  const helpOpen = helpFor === identity && !suspended;
  const videoOpen = videoFor === identity && !suspended;
  const introduce =
    ready && !loading && !suspended && shouldIntroduce(progress, hasRecords);
  const takeover = introduce && !!tutorial && !isDesktop && !compact;
  const insets = useSafeAreaInsets();
  const isTabScreen = useSegments()[0] === "tabs";
  const takeoverBottomPadding = screenCreateBarBottomPadding({
    isDesktop,
    isTabScreen,
    bottomInset: insets.bottom,
  });
  useLayoutEffect(() => {
    if (!takeover) return;
    useTakeoverStore.getState().set(area, true);
    return () => useTakeoverStore.getState().set(area, false);
  }, [area, takeover]);
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
    setVideoFor(null);
    if (userId) guidanceEvent(area, "task_started", userId);
    action();
  }
  function openVideo() {
    setHelpFor(null);
    setVideoFor(identity);
  }
  const watchLabel = tutorial
    ? `Ver como funciona (${tutorial.video.durationLabel})`
    : null;
  function renderSecondaryButton() {
    if (!secondary) return null;
    return (
      <Button
        title={secondary.label}
        variant="text"
        onPress={() => start(secondary.onPress)}
        disabled={dismissing}
      />
    );
  }
  /** Capa do vídeo como atalho de ponteiro; o botão com nome é o link ao lado. */
  function renderThumbShortcut() {
    if (!tutorial) return null;
    return (
      <Pressable
        onPress={openVideo}
        disabled={dismissing}
        focusable={false}
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <TutorialVideoThumb durationLabel={tutorial.video.durationLabel} />
      </Pressable>
    );
  }
  function renderQuietActions() {
    return (
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: spacing.xl,
        }}
      >
        {secondary ? (
          <Pressable
            onPress={() => start(secondary.onPress)}
            accessibilityRole="button"
            disabled={dismissing}
            style={{ minHeight: 48, justifyContent: "center", alignItems: "center" }}
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
          style={{ minHeight: 48, justifyContent: "center", alignItems: "center" }}
        >
          <Typography variant="bodyBold" color={theme.colors.textSecondary}>
            Agora não
          </Typography>
        </Pressable>
      </View>
    );
  }
  function renderWatchLink() {
    if (!watchLabel) return null;
    return (
      <Pressable
        onPress={openVideo}
        accessibilityRole="button"
        accessibilityLabel={watchLabel}
        disabled={dismissing}
        style={{
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 2,
        }}
      >
        <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
          Ver como funciona
        </Typography>
        <AppIcon name="chevron-forward" size={18} color={theme.colors.primaryStrong} />
      </Pressable>
    );
  }
  /** Cartão do celular: a capa do vídeo faz parte da explicação, não dos botões. */
  function renderCard(large: boolean) {
    return (
      <View
        style={{
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {renderThumbShortcut()}
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant={large ? "h3" : "bodyBold"} accessibilityRole="header">
              {title ?? content.title}
            </Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              {description ?? content.description}
            </Typography>
            {renderWatchLink()}
          </View>
        </View>
        <Button
          title={actionLabel ?? content.action}
          onPress={() => start()}
          disabled={dismissing}
          size={large ? "lg" : "md"}
        />
        {renderQuietActions()}
      </View>
    );
  }
  /** Lista ainda vazia: o tutorial ocupa o meio da tela e a ação fica no rodapé. */
  function renderTakeover() {
    if (!tutorial) return null;
    return (
      <Animated.View
        testID={`screen-guidance-${area}`}
        style={{ flex: 1, minHeight: 0, width: "100%", opacity }}
        pointerEvents={dismissing ? "none" : "auto"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xl,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
          }}
        >
          <Pressable
            onPress={openVideo}
            accessibilityRole="button"
            accessibilityLabel={watchLabel ?? undefined}
            disabled={dismissing}
            style={({ pressed }) => ({
              alignItems: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <TutorialVideoThumb
              shape="hero"
              durationLabel={tutorial.video.durationLabel}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                Ver como funciona
              </Typography>
              <AppIcon
                name="chevron-forward"
                size={18}
                color={theme.colors.primaryStrong}
              />
            </View>
          </Pressable>
          <View style={{ gap: spacing.sm, maxWidth: 360 }}>
            <Typography
              variant="h2"
              accessibilityRole="header"
              style={{ textAlign: "center" }}
            >
              {title ?? content.title}
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              {description ?? content.description}
            </Typography>
          </View>
        </ScrollView>
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: takeoverBottomPadding,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Button
            title={actionLabel ?? content.action}
            onPress={() => start()}
            disabled={dismissing}
            size="lg"
          />
          {renderQuietActions()}
        </View>
      </Animated.View>
    );
  }
  function renderIntro() {
    if (!introduce) return null;
    if (isDesktop)
      return (
        <Animated.View
          testID={`screen-guidance-${area}`}
          style={{ opacity, width: "100%", maxWidth: desktopWidths.page }}
          pointerEvents={dismissing ? "none" : "auto"}
        >
          {/* Desktop: uma faixa discreta; a tarefa da tela continua em primeiro plano. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: spacing.lg,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.xl,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
              // Mesmo intervalo entre blocos do cabeçalho até o conteúdo.
              marginBottom: desktopLayout.blockGap,
            }}
          >
            {tutorial ? (
              renderThumbShortcut()
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.primaryBg,
                }}
              >
                <AppIcon
                  name="bulb-outline"
                  size={20}
                  color={theme.colors.primaryStrong}
                />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 280, gap: 2 }}>
              <Typography variant="desktopBodyStrong" accessibilityRole="header">
                {title ?? content.title}
              </Typography>
              <Typography variant="desktopBody">
                {description ?? content.description}
              </Typography>
              {renderWatchLink()}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Button
                title="Agora não"
                variant="ghost"
                onPress={() => setDismissFor(identity)}
                disabled={dismissing}
              />
              {renderSecondaryButton()}
              <Button
                title={actionLabel ?? content.action}
                onPress={() => start()}
                disabled={dismissing}
              />
            </View>
          </View>
        </Animated.View>
      );
    if (compact)
      return (
        <Animated.View
          testID={`screen-guidance-${area}`}
          style={{ opacity }}
          pointerEvents={dismissing ? "none" : "auto"}
        >
          {/* Cartão enxuto: fica dentro da rolagem da tela e ocupa pouca altura. */}
          {renderCard(false)}
        </Animated.View>
      );
    if (takeover) return renderTakeover();
    return (
      <View
        testID={`screen-guidance-${area}`}
        style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          flexShrink: 1,
          width: "100%",
          maxWidth: 720,
          alignSelf: "center",
        }}
      >
        <Animated.View style={{ opacity }} pointerEvents={dismissing ? "none" : "auto"}>
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {renderCard(true)}
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  if (!userId || suspended) return { help: null, intro: null, modal: null };
  return {
    help: (
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
          minHeight: 48,
          flexShrink: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: pressed ? theme.colors.surface : "transparent",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {/* Texto junto do ícone: "?" sozinho não é entendido por todos. */}
        <AppIcon
          name="help-circle-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
        <Typography variant="captionBold" color={theme.colors.textSecondary}>
          Ajuda
        </Typography>
      </Pressable>
    ),
    intro: renderIntro(),
    modal: (
      <>
        <StandardModal
          visible={helpOpen}
          onClose={closeHelp}
          title={content.helpTitle}
          scrollRef={helpScroll}
          footer={
            <FormActions>
              <Button title={actionLabel ?? content.action} onPress={() => start()} />
            </FormActions>
          }
        >
          <Typography variant="h3">{title ?? content.title}</Typography>
          <Typography variant="body">{description ?? content.description}</Typography>
          {tutorial && watchLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={watchLabel}
              onPress={openVideo}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                padding: spacing.sm,
                borderRadius: 18,
                backgroundColor: theme.colors.primaryBg,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <TutorialVideoThumb
                shape="landscape"
                durationLabel={tutorial.video.durationLabel}
              />
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                  Ver como funciona
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {tutorial.video.title}
                </Typography>
              </View>
              <AppIcon
                name="chevron-forward"
                size={20}
                color={theme.colors.primaryStrong}
              />
            </Pressable>
          ) : null}
          {content.steps.map((step, index) => (
            <Typography key={step} variant="body">
              {index + 1}. {step}
            </Typography>
          ))}
          <FormSection collapsible={false} title="Depois de concluir">
            <Typography variant="body">{content.next}</Typography>
          </FormSection>
          <Button
            title="Ainda preciso de ajuda"
            variant="text"
            style={{ alignSelf: "flex-start" }}
            onPress={() => {
              setHelpFor(null);
              router.push("/support");
            }}
          />
        </StandardModal>
        {tutorial ? (
          <TutorialVideoModal
            visible={videoOpen}
            video={tutorial.video}
            url={tutorial.url}
            onClose={() => setVideoFor(null)}
            actionLabel={actionLabel ?? content.action}
            onAction={() => start()}
          />
        ) : null}
      </>
    ),
  };
}
