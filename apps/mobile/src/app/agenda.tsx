import { Redirect } from "expo-router";
import React from "react";

// Agenda virou uma tab (ADR-0006). Mantemos esta rota para não quebrar deep
// links, notificações e atalhos antigos que ainda apontam para "/agenda".
export default function AgendaRedirect() {
  return <Redirect href="/tabs/agenda" />;
}
