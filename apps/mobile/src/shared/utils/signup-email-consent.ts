import type { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { apiClient } from "./api-client";
import { authStorage } from "./supabase";

const PENDING_GOOGLE_OPT_IN = "lucro-caseiro:pending-google-email-opt-in";
const MAX_PENDING_MS = 60 * 60 * 1000;
let applying: Promise<void> | null = null;

function readPending(): Promise<string | null> {
  return Platform.OS === "web"
    ? Promise.resolve(sessionStorage.getItem(PENDING_GOOGLE_OPT_IN))
    : authStorage.getItem(PENDING_GOOGLE_OPT_IN);
}

function writePending(value: string): Promise<void> {
  if (Platform.OS === "web") {
    sessionStorage.setItem(PENDING_GOOGLE_OPT_IN, value);
    return Promise.resolve();
  }
  return authStorage.setItem(PENDING_GOOGLE_OPT_IN, value);
}

function removePending(): Promise<void> {
  if (Platform.OS === "web") {
    sessionStorage.removeItem(PENDING_GOOGLE_OPT_IN);
    return Promise.resolve();
  }
  return authStorage.removeItem(PENDING_GOOGLE_OPT_IN);
}

export async function savePendingGoogleSignupEmailConsent(): Promise<void> {
  await writePending(String(Date.now()));
}

export async function clearPendingGoogleSignupEmailConsent(): Promise<void> {
  // A falha ao limpar uma intenção antiga não deve impedir o login normal.
  await removePending().catch(() => {});
}

export function applyPendingGoogleSignupEmailConsent(session: Session): Promise<void> {
  if (applying) return applying;
  applying = (async () => {
    const raw = await readPending();
    if (!raw) return;
    const providers = session.user.app_metadata?.providers;
    const isGoogle =
      session.user.app_metadata?.provider === "google" ||
      (Array.isArray(providers) && providers.includes("google")) ||
      session.user.identities?.some((identity) => identity.provider === "google");
    if (!isGoogle) {
      await removePending();
      return;
    }
    const startedAt = Number(raw);
    if (
      !Number.isFinite(startedAt) ||
      startedAt > Date.now() ||
      Date.now() - startedAt > MAX_PENDING_MS
    ) {
      await removePending();
      return;
    }
    await apiClient("/api/v1/email-preferences", {
      method: "PUT",
      token: session.access_token,
      body: { actionEmails: true },
    });
    await removePending();
  })().finally(() => {
    applying = null;
  });
  return applying;
}
