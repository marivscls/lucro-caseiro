import { create } from "zustand";
import {
  browserPush,
  browserPushRequest,
  browserPushSupported,
  BROWSER_PUSH_OWNER,
  stopBrowserPush,
} from "./browser-push";
import { useAuth } from "./use-auth";
import { useNotificationPrefs } from "./notification-prefs";
import type { NotificationType } from "./notification-types";

type BrowserPushState = {
  supported: boolean;
  enabled: boolean;
  busy: boolean;
  publicKey: string | null;
  message: string;
  refresh: () => Promise<void>;
  toggle: () => Promise<void>;
  test: () => Promise<void>;
  setPreference: (type: NotificationType, value: boolean) => Promise<void>;
};

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Não foi possível atualizar as notificações. Tente novamente.";
const activeMessage =
  "Ativadas neste navegador. Avisos às 9h e lembrete diário às 19h, conforme suas preferências.";

export const useBrowserNotifications = create<BrowserPushState>((set, get) => ({
  supported: false,
  enabled: false,
  busy: false,
  publicKey: null,
  message: "Verificando notificações…",
  refresh: async () => {
    const { token, userId } = useAuth.getState();
    if (!token || !userId || get().busy) return;
    const supported = browserPushSupported();
    set({ supported });
    if (!supported) {
      set({
        enabled: false,
        message:
          "Este navegador não oferece notificações. No iPhone ou iPad, adicione o app à Tela de Início e abra por lá.",
      });
      return;
    }
    set({ busy: true });
    try {
      const config = (await browserPushRequest("/config", token)) as {
        publicKey: string | null;
      };
      if (useAuth.getState().userId !== userId) return;
      set({ publicKey: config.publicKey });
      if (!config.publicKey) {
        set({
          enabled: false,
          message:
            "As notificações precisam ser configuradas no servidor para serem ativadas.",
        });
        return;
      }
      let subscription = await browserPush.subscription();
      if (localStorage.getItem(BROWSER_PUSH_OWNER) !== userId && subscription) {
        await subscription.unsubscribe();
        subscription = null;
      }
      const enabled = !!subscription && Notification.permission === "granted";
      if (enabled && subscription) {
        await useNotificationPrefs.getState().hydrate();
        if (
          useAuth.getState().userId !== userId ||
          localStorage.getItem(BROWSER_PUSH_OWNER) !== userId
        )
          return;
        await browserPush.sync(
          token,
          subscription,
          useNotificationPrefs.getState().prefs,
        );
      }
      if (useAuth.getState().userId !== userId) return;
      let message =
        "Receba lembretes mesmo com a página fechada. Ative e permita as notificações do navegador.";
      if (Notification.permission === "denied")
        message =
          "Notificações bloqueadas. Permita as notificações nas configurações deste site no navegador.";
      if (enabled) message = activeMessage;
      set({ enabled, message });
    } catch (error) {
      set({ message: errorMessage(error) });
    } finally {
      set({ busy: false });
    }
  },
  toggle: async () => {
    const { token, userId } = useAuth.getState();
    const { busy, enabled, publicKey } = get();
    if (!token || !userId || busy || !publicKey) return;
    set({ busy: true });
    try {
      if (enabled) {
        await stopBrowserPush(token);
        set({ enabled: false, message: "Notificações desativadas neste navegador." });
      } else {
        await browserPush.enable(token, publicKey, useNotificationPrefs.getState().prefs);
        if (useAuth.getState().userId !== userId) {
          await stopBrowserPush(token);
          return;
        }
        localStorage.setItem(BROWSER_PUSH_OWNER, userId);
        set({ enabled: true, message: activeMessage });
      }
    } catch (error) {
      const subscription = await browserPush.subscription().catch(() => null);
      set({
        enabled: !!subscription && localStorage.getItem(BROWSER_PUSH_OWNER) === userId,
        message: errorMessage(error),
      });
    } finally {
      set({ busy: false });
    }
  },
  test: async () => {
    const { token } = useAuth.getState();
    if (!token || get().busy) return;
    set({ busy: true });
    try {
      await browserPush.test(token);
      set({
        message: "Teste enviado. Confira a central de notificações do dispositivo.",
      });
    } catch (error) {
      set({ message: errorMessage(error) });
    } finally {
      set({ busy: false });
    }
  },
  setPreference: async (type, value) => {
    const { token } = useAuth.getState();
    if (!token || get().busy) return;
    set({ busy: true });
    try {
      const subscription = await browserPush.subscription();
      if (!subscription) throw new Error("Ative as notificações primeiro.");
      await browserPush.sync(token, subscription, {
        ...useNotificationPrefs.getState().prefs,
        [type]: value,
      });
      useNotificationPrefs.getState().setPref(type, value);
      set({ message: activeMessage });
    } catch (error) {
      set({ message: errorMessage(error) });
    } finally {
      set({ busy: false });
    }
  },
}));
