import { Redirect } from "expo-router";
import { useFeature } from "@lucro-caseiro/ui";
import React from "react";

// Agenda virou uma tab (ADR-0006). Mantemos esta rota para não quebrar deep
// links, notificações e atalhos antigos que ainda apontam para "/agenda".
export default function AgendaRedirect() {
  const enabled = useFeature("agendamento");
  // The route remains for legacy deep links, but this brand has no scheduling module.
  if (!enabled) return <Redirect href="/tabs" />;
  return <Redirect href="/tabs/agenda" />;
}
