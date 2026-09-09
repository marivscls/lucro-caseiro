import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { Button, Card, Typography, fonts, spacing, useTheme } from "@lucro-caseiro/ui";
import {
  answerHelpQuestion,
  HELP_SUGGESTIONS,
  type HelpAnswer,
} from "./help-assistant.domain";
export interface HelpAssistantProps {
  profile: string;
  onNavigate: (route: NonNullable<HelpAnswer["action"]>["route"]) => void;
  onContactSupport: (question: string) => void;
}

export function HelpAssistant({
  profile,
  onNavigate,
  onContactSupport,
}: Readonly<HelpAssistantProps>) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<
    Array<{ question: string; answer: HelpAnswer }>
  >([]);
  const suggestions =
    profile === "services" || profile === "beauty"
      ? [
          "Como calculo meu preço?",
          "Como agendar um atendimento?",
          "Como cadastro um cliente?",
        ]
      : HELP_SUGGESTIONS;
  const ask = (value: string) => {
    const question = value.trim().slice(0, 400);
    if (!question) return;
    setConversation((previous) => [
      ...previous.slice(-3),
      { question, answer: answerHelpQuestion(question, profile) },
    ]);
    setDraft("");
  };
  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Typography variant="h3">Pergunte ao assistente</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Escreva o que você quer fazer. As respostas usam as instruções do app e
          funcionam sem internet.
        </Typography>
      </View>
      {conversation.length === 0 && (
        <View style={{ gap: spacing.sm }}>
          {suggestions.map((question) => (
            <Button
              key={question}
              title={question}
              variant="outline"
              onPress={() => ask(question)}
            />
          ))}
        </View>
      )}
      {conversation.map(({ question, answer }, index) => (
        <View key={`${index}-${question}`} style={{ gap: spacing.md }}>
          <View
            style={{
              alignSelf: "flex-end",
              maxWidth: "94%",
              padding: spacing.md,
              borderRadius: 14,
              backgroundColor: theme.colors.background,
            }}
          >
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Você
            </Typography>
            <Typography variant="body">{question}</Typography>
          </View>
          <View accessibilityLiveRegion="polite" style={{ gap: spacing.sm }}>
            <Typography variant="caption" color={theme.colors.primaryStrong}>
              Assistente · Ajuda do app
            </Typography>
            <Typography variant="body">{answer.text}</Typography>
            {answer.steps.map((step, stepIndex) => (
              <Typography key={step} variant="body" color={theme.colors.textSecondary}>
                {stepIndex + 1}. {step}
              </Typography>
            ))}
            {answer.action && (
              <Button
                title={answer.action.label}
                variant="outline"
                onPress={() => onNavigate(answer.action!.route)}
              />
            )}
          </View>
        </View>
      ))}
      <View style={{ gap: spacing.sm }}>
        <Typography variant="bodyBold">Sua pergunta</Typography>
        <TextInput
          accessibilityLabel="Sua pergunta"
          placeholder="Ex.: como calculo meu preço?"
          placeholderTextColor={theme.colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={400}
          textAlignVertical="top"
          style={{
            minHeight: 96,
            maxHeight: 180,
            padding: spacing.md,
            fontSize: 16,
            fontFamily: fonts.regular,
            lineHeight: 24,
            color: theme.colors.text,
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: 12,
          }}
        />
        <Button
          title="Perguntar"
          size="lg"
          disabled={!draft.trim()}
          onPress={() => ask(draft)}
        />
        <Button
          title="Falar por email"
          variant="outline"
          onPress={() =>
            onContactSupport(draft.trim() || conversation.at(-1)?.question || "")
          }
        />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          O assistente orienta sobre o app. Não consulta nem altera os dados da sua conta.
        </Typography>
      </View>
    </Card>
  );
}
