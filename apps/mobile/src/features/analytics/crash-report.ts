import { useAuth } from "../../shared/hooks/use-auth";
import { currentAnalyticsScreen } from "./screen-tracking";
import { trackAnalyticsAction } from "./tracker";

/** Evita inundar a coleta quando a pessoa tenta de novo e a tela quebra em loop. */
const MAX_REPORTS_PER_SESSION = 5;
let reportsSent = 0;

/**
 * Só o tipo do erro (ex.: "TypeError"). A mensagem e a pilha podem conter dados da
 * pessoa ou do cliente e nunca são enviadas.
 */
export function crashErrorName(error: unknown): string {
  let raw: string = typeof error;
  if (error instanceof Error) raw = error.name || error.constructor.name;
  else if (typeof error === "object" && error !== null) raw = "NonErrorObject";
  const name = raw.replace(/\W/g, "").slice(0, 40);
  return name || "UnknownError";
}

export function reportAppCrash(error: unknown): void {
  if (reportsSent >= MAX_REPORTS_PER_SESSION) return;
  reportsSent += 1;
  const screen = currentAnalyticsScreen();
  void trackAnalyticsAction("app_crashed", useAuth.getState().token, {
    error: crashErrorName(error),
    ...(screen ? { screen } : {}),
  });
}

export function resetCrashReportsForTests(): void {
  reportsSent = 0;
}
