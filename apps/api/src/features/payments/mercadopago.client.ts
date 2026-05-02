import type { IMercadoPagoClient, MercadoPagoPreapproval } from "./payments.types";

const MP_API = "https://api.mercadopago.com";

export class MercadoPagoClient implements IMercadoPagoClient {
  constructor(private accessToken: string) {}

  async getPreapproval(id: string): Promise<MercadoPagoPreapproval> {
    const response = await fetch(`${MP_API}/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`MercadoPago preapproval fetch failed: ${response.status}`);
    }

    return (await response.json()) as MercadoPagoPreapproval;
  }
}
