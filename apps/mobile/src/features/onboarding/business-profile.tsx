import { fonts, Typography } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { AppIcon } from "../../shared/components/app-icon";
import { ResponsiveModal } from "../../shared/components/responsive-modal-surface";
import { marketingIdeas } from "./business-profile-data";
import { BusinessProfileForm } from "./business-profile-form";
import { profileRecommendation, type BusinessProfileAnswers } from "./profile-data";
import { useBusinessOnboarding } from "./use-business-onboarding";

export function BusinessProfileFlow({
  onClose,
  firstAccess = false,
  closeRequest,
}: Readonly<{
  onClose: () => void;
  firstAccess?: boolean;
  closeRequest?: React.RefObject<(() => void) | null>;
}>) {
  const state = useBusinessOnboarding();
  const router = useRouter();
  const colors = useBrandScreenPalette();
  useEffect(() => {
    if (closeRequest)
      closeRequest.current = () => {
        void close();
      };
    return () => {
      if (closeRequest) closeRequest.current = null;
    };
  });
  useEffect(() => {
    if (!firstAccess) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!state.loading && !state.loadError) void close();
      return true;
    });
    return () => listener.remove();
  });
  async function finish(profile: BusinessProfileAnswers, start = false) {
    if (!(await state.save(profile))) return;
    onClose();
    const next = profileRecommendation(profile);
    if (start && next) router.push(next.route);
  }
  async function close() {
    if (state.saving) return;
    if (state.loading || state.loadError) {
      if (!firstAccess) onClose();
      return;
    }
    if (!state.record && !(await state.save(null))) return;
    onClose();
  }
  if (state.loading || state.loadError)
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        {state.loadError ? (
          <>
            <Text style={[styles.body, { color: colors.wine }]}>
              Não foi possível carregar seu perfil.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={state.retry}
              style={styles.action}
            >
              <Text style={{ color: colors.wine }}>Tentar novamente</Text>
            </Pressable>
            {!firstAccess && (
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={styles.action}
              >
                <Text style={{ color: colors.wine }}>Fechar</Text>
              </Pressable>
            )}
            {state.error && (
              <Text
                accessibilityRole="alert"
                style={[styles.body, { color: colors.wine }]}
              >
                {state.error}
              </Text>
            )}
          </>
        ) : (
          <ActivityIndicator color={colors.wine} accessibilityLabel="Carregando perfil" />
        )}
      </View>
    );
  return (
    <BusinessProfileForm
      initialProfile={state.answers}
      editInitially
      saving={state.saving}
      saveError={state.error}
      onClose={() => void close()}
      onComplete={(profile) => void finish(profile)}
      onStart={(profile) => void finish(profile, true)}
    />
  );
}

export function BusinessProfileCard({
  settings = false,
  hasSale = false,
}: Readonly<{ settings?: boolean; hasSale?: boolean }>) {
  const state = useBusinessOnboarding();
  const colors = useBrandScreenPalette();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const closeRequest = useRef<(() => void) | null>(null);
  const [ideasVisible, setIdeasVisible] = useState(false);
  const complete = state.record?.status === "completed";
  let label = complete ? "SUA PRIORIDADE" : "UM COMEÇO DO SEU JEITO";
  if (settings) label = "PERFIL DO NEGÓCIO";
  const next = complete ? profileRecommendation(state.answers, { hasSale }) : undefined;
  const ideas = complete ? marketingIdeas(state.answers) : [];
  if (!settings && (state.loading || state.loadError || !complete)) return null;
  return (
    <>
      {settings ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={complete ? "Editar perfil do negócio" : "Montar meu perfil"}
          onPress={() => setVisible(true)}
          style={({ pressed }) => [
            styles.settingsCard,
            { backgroundColor: colors.softRose, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View style={styles.settingsHeading}>
            <AppIcon name="storefront-outline" size={20} color={colors.wine} />
            <Typography variant="captionBold" color={colors.wine}>
              Perfil do negócio
            </Typography>
          </View>
          <Typography variant="h2" color={colors.wine}>
            Seu negócio, suas escolhas
          </Typography>
          <Typography variant="body" color={colors.muted}>
            Personalize o app para o seu jeito de trabalhar.
          </Typography>
          <View style={styles.settingsAction}>
            <Typography variant="bodyBold" color={colors.wine} style={{ flex: 1 }}>
              {complete ? "Editar perfil do negócio" : "Montar meu perfil"}
            </Typography>
            <AppIcon name="arrow-forward" size={20} color={colors.wine} />
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
          <Text style={[styles.title, { color: colors.wine }]}>
            {settings
              ? "Seu negócio, suas escolhas"
              : (next?.title ?? "Vamos conhecer seu negócio?")}
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            {settings
              ? "Atualize seu segmento, momento, canais e objetivo. Suas respostas personalizam o app."
              : (next?.text ??
                "Responda cinco perguntas para encontrar seu próximo passo.")}
          </Text>
          {next && !settings && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(next.route)}
              style={[styles.action, { backgroundColor: colors.wineFill }]}
            >
              <Text style={[styles.actionText, { color: colors.onWine }]}>
                {next.action}
              </Text>
              <AppIcon name="arrow-forward" size={18} color={colors.onWine} />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(true)}
            style={styles.edit}
          >
            <Text style={[styles.actionText, { color: colors.wine }]}>
              {complete ? "Editar perfil do negócio" : "Montar meu perfil"}
            </Text>
            <AppIcon name="chevron-forward" size={18} color={colors.wine} />
          </Pressable>
          {!settings && ideas.length > 0 && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: ideasVisible }}
                onPress={() => setIdeasVisible(!ideasVisible)}
                style={[styles.edit, { borderTopWidth: 1, borderColor: colors.border }]}
              >
                <Text style={[styles.actionText, { color: colors.wine }]}>
                  Ideias para divulgar
                </Text>
                <AppIcon
                  name={ideasVisible ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.wine}
                />
              </Pressable>
              {ideasVisible &&
                ideas.map((idea) => (
                  <View key={idea.value} style={{ gap: 4 }}>
                    <Text style={[styles.actionText, { color: colors.wine }]}>
                      {idea.label}
                    </Text>
                    <Text style={[styles.body, { color: colors.muted }]}>
                      {idea.idea}
                    </Text>
                  </View>
                ))}
            </>
          )}
        </View>
      )}
      <ResponsiveModal
        visible={visible}
        onRequestClose={() => {
          closeRequest.current?.();
        }}
        animationType="fade"
        desktopMaxWidth={1080}
      >
        {visible && (
          <BusinessProfileFlow
            closeRequest={closeRequest}
            onClose={() => setVisible(false)}
          />
        )}
      </ResponsiveModal>
    </>
  );
}

const styles = StyleSheet.create({
  settingsCard: { padding: 18, borderRadius: 16, gap: 8 },
  settingsHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  settingsAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    minHeight: 32,
  },
  loading: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  card: { padding: 20, borderWidth: 1, borderRadius: 20, gap: 12 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  action: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  edit: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
});
