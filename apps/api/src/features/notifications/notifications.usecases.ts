import type {
  INotificationsRepo,
  PushSender,
  RegisterPushTokenInput,
} from "./notifications.types";

export class NotificationsUseCases {
  constructor(
    private repo: INotificationsRepo,
    private sendPush: PushSender,
  ) {}

  registerDevice(
    userId: string,
    brandId: string,
    input: RegisterPushTokenInput,
  ): Promise<void> {
    return this.repo.registerToken(userId, brandId, input);
  }

  unregisterDevice(userId: string, token: string): Promise<void> {
    return this.repo.unregisterToken(userId, token);
  }

  async notifyServiceBooking(
    userId: string,
    brandId: string,
    serviceId: string,
    serviceName: string,
    bookingRequestId: string,
  ): Promise<void> {
    const tokens = await this.repo.listTokens(userId, brandId);
    if (tokens.length === 0) return;

    const result = await this.sendPush(tokens, {
      title: "Nova solicitação de horário",
      body: `${serviceName} — toque para ver os dados.`,
      data: {
        type: "SERVICE_BOOKING",
        serviceId,
        bookingRequestId,
      },
    });
    await this.repo.deleteTokens(result.invalidTokens);
  }

  async notifyCatalogOrder(
    userId: string,
    brandId: string,
    order: { id: string; customerName: string; total: number },
  ): Promise<void> {
    const tokens = await this.repo.listTokens(userId, brandId);
    if (tokens.length === 0) return;

    const total = order.total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const result = await this.sendPush(tokens, {
      title: "Novo pedido pelo catálogo 🛍️",
      body: `${order.customerName} pediu ${total}. Já está na sua agenda.`,
      data: { type: "CATALOG_ORDER", orderId: order.id },
    });
    await this.repo.deleteTokens(result.invalidTokens);
  }
}
