import type { PixKeyType, PixSettings } from "@lucro-caseiro/contracts";
import {
  clients,
  fiadoLinks,
  products,
  saleItems,
  sales,
  services,
  users,
} from "@lucro-caseiro/database/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { FiadoStatement, IFiadoRepo } from "./fiado.types";

function toPix(row: {
  pixKeyType: string | null;
  pixKey: string | null;
  pixCity: string | null;
}): PixSettings {
  return {
    pixKeyType: (row.pixKeyType as PixKeyType | null) ?? null,
    pixKey: row.pixKey,
    pixCity: row.pixCity,
  };
}

export class FiadoRepoPg implements IFiadoRepo {
  constructor(private db: AppDatabase) {}

  async getPixSettings(userId: string): Promise<PixSettings | null> {
    const [row] = await this.db
      .select({
        pixKeyType: users.pixKeyType,
        pixKey: users.pixKey,
        pixCity: users.pixCity,
      })
      .from(users)
      .where(eq(users.id, userId));
    return row ? toPix(row) : null;
  }

  async updatePixSettings(userId: string, data: PixSettings): Promise<PixSettings> {
    const [row] = await this.db
      .update(users)
      .set({ pixKeyType: data.pixKeyType, pixKey: data.pixKey, pixCity: data.pixCity })
      .where(eq(users.id, userId))
      .returning({
        pixKeyType: users.pixKeyType,
        pixKey: users.pixKey,
        pixCity: users.pixCity,
      });
    return toPix(row!);
  }

  async clientExists(userId: string, clientId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
    return Boolean(row);
  }

  async findLinkToken(userId: string, clientId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ token: fiadoLinks.token })
      .from(fiadoLinks)
      .where(and(eq(fiadoLinks.userId, userId), eq(fiadoLinks.clientId, clientId)))
      .limit(1);
    return row?.token ?? null;
  }

  async insertLink(
    userId: string,
    clientId: string,
    token: string,
    brandId: string,
  ): Promise<string> {
    const [row] = await this.db
      .insert(fiadoLinks)
      .values({ userId, clientId, token, brandId })
      .returning({ token: fiadoLinks.token });
    return row!.token;
  }

  async findStatement(token: string): Promise<FiadoStatement | null> {
    const [link] = await this.db
      .select({
        userId: fiadoLinks.userId,
        clientId: fiadoLinks.clientId,
        brandId: fiadoLinks.brandId,
        clientName: clients.name,
        ownerName: users.name,
        businessName: users.businessName,
        phone: users.phone,
        pixKeyType: users.pixKeyType,
        pixKey: users.pixKey,
        pixCity: users.pixCity,
      })
      .from(fiadoLinks)
      .innerJoin(users, eq(users.id, fiadoLinks.userId))
      .innerJoin(
        clients,
        and(eq(clients.id, fiadoLinks.clientId), eq(clients.userId, fiadoLinks.userId)),
      )
      .where(eq(fiadoLinks.token, token));
    if (!link) return null;

    const openSales = await this.db
      .select({
        id: sales.id,
        soldAt: sales.soldAt,
        total: sales.total,
        paidAmount: sales.paidAmount,
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, link.userId),
          eq(sales.clientId, link.clientId),
          eq(sales.status, "pending"),
        ),
      )
      .orderBy(asc(sales.soldAt))
      .limit(200);

    const ids = openSales.map((sale) => sale.id);
    const items = ids.length
      ? await this.db
          .select({
            saleId: saleItems.saleId,
            quantity: saleItems.quantity,
            itemName: saleItems.itemName,
            productName: products.name,
            serviceName: services.name,
          })
          .from(saleItems)
          .leftJoin(products, eq(products.id, saleItems.productId))
          .leftJoin(services, eq(services.id, saleItems.serviceId))
          .where(inArray(saleItems.saleId, ids))
      : [];

    const describe = (saleId: string) => {
      const names = items
        .filter((item) => item.saleId === saleId)
        .map((item) => {
          const name = item.itemName ?? item.productName ?? item.serviceName ?? "Compra";
          const qty = Number(item.quantity);
          return qty > 1 ? `${qty.toLocaleString("pt-BR")}x ${name}` : name;
        });
      if (names.length === 0) return "Compra";
      return names.length > 2
        ? `${names.slice(0, 2).join(", ")} e mais ${names.length - 2}`
        : names.join(", ");
    };

    return {
      brandId: link.brandId,
      owner: {
        name: link.ownerName,
        businessName: link.businessName,
        phone: link.phone,
        pix: toPix(link),
      },
      clientName: link.clientName,
      sales: openSales.map((sale) => ({
        soldAt: sale.soldAt,
        total: Number(sale.total),
        paidAmount: Number(sale.paidAmount),
        description: describe(sale.id),
      })),
    };
  }
}
