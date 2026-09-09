type Prefs = Partial<
  Record<
    | "PENDING_SALES"
    | "LOW_STOCK"
    | "DELIVERY"
    | "CLIENT_BIRTHDAY"
    | "DAILY_REMINDER"
    | "WEEKLY_SUMMARY",
    boolean
  >
>;
type Request = (
  path: string,
  token: string,
  method?: string,
  body?: unknown,
) => Promise<unknown>;
type BrowserEnvironment = {
  supported: () => boolean;
  permission: () => NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  registration: () => Promise<ServiceWorkerRegistration | undefined>;
  request: Request;
};

export class BrowserNotifications {
  private generation = 0;
  constructor(private env: BrowserEnvironment) {}

  async subscription(): Promise<PushSubscription | null> {
    if (!this.env.supported()) return null;
    return (await this.env.registration())?.pushManager.getSubscription() ?? null;
  }

  async sync(token: string, subscription: PushSubscription, prefs: Prefs): Promise<void> {
    const generation = this.generation;
    const json = subscription.toJSON();
    await this.env.request("/subscription", token, "PUT", {
      endpoint: subscription.endpoint,
      keys: json.keys,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      prefs,
    });
    if (generation !== this.generation) {
      await this.env.request("/subscription", token, "DELETE", {
        endpoint: subscription.endpoint,
      });
      throw new Error("Ativação cancelada ao sair da conta.");
    }
  }

  async enable(token: string, publicKey: string, prefs: Prefs): Promise<void> {
    const generation = this.generation;
    if (!this.env.supported())
      throw new Error(
        "Este navegador não oferece notificações. No iPhone ou iPad, adicione o app à Tela de Início e abra por lá.",
      );
    // Call synchronously from the click; Safari requires the user activation.
    const permission =
      this.env.permission() === "granted"
        ? "granted"
        : await this.env.requestPermission();
    if (generation !== this.generation)
      throw new Error("Ativação cancelada ao sair da conta.");
    if (permission !== "granted")
      throw new Error(
        permission === "denied"
          ? "Notificações bloqueadas. Permita as notificações nas configurações deste site no navegador."
          : "A permissão não foi concedida. Toque em Ativar para tentar novamente.",
      );
    const registration = await this.env.registration();
    if (!registration?.active)
      throw new Error("Atualize a página para concluir a instalação das notificações.");
    const previous = await registration.pushManager.getSubscription();
    const applicationServerKey = Uint8Array.from(
      atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")),
      (char) => char.charCodeAt(0),
    );
    const subscription =
      previous ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));
    if (generation !== this.generation) {
      await subscription.unsubscribe();
      throw new Error("Ativação cancelada ao sair da conta.");
    }
    try {
      await this.sync(token, subscription, prefs);
    } catch (error) {
      if (!previous) await subscription.unsubscribe().catch(() => false);
      throw error;
    }
  }

  async disable(token: string): Promise<void> {
    this.generation += 1;
    const subscription = await this.subscription();
    if (!subscription) return;
    // Browser-side cancellation also works when logout happens offline.
    try {
      await subscription.unsubscribe();
    } finally {
      await this.env.request("/subscription", token, "DELETE", {
        endpoint: subscription.endpoint,
      });
    }
  }

  async test(token: string): Promise<void> {
    const subscription = await this.subscription();
    if (!subscription) throw new Error("Ative as notificações primeiro.");
    await this.env.request("/test", token, "POST", { endpoint: subscription.endpoint });
  }
}
