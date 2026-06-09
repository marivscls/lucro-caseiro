import type { CatalogSettings, PublicCatalogProduct } from "@lucro-caseiro/contracts";
import { catalogSettings, products, users } from "@lucro-caseiro/database/schema";
import { and, asc, eq, ne } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { CatalogOwner, ICatalogRepo } from "./catalog.types";

export class CatalogRepoPg implements ICatalogRepo {
  constructor(private db: AppDatabase) {}

  async findByUser(userId: string): Promise<CatalogSettings | null> {
    const [row] = await this.db
      .select()
      .from(catalogSettings)
      .where(eq(catalogSettings.userId, userId));
    return row ? this.toSettings(row) : null;
  }

  async findOwnerBySlug(slug: string): Promise<(CatalogSettings & CatalogOwner) | null> {
    const [row] = await this.db
      .select({
        settings: catalogSettings,
        name: users.name,
        businessName: users.businessName,
        phone: users.phone,
      })
      .from(catalogSettings)
      .innerJoin(users, eq(catalogSettings.userId, users.id))
      .where(eq(catalogSettings.slug, slug));

    if (!row) return null;
    return {
      ...this.toSettings(row.settings),
      userId: row.settings.userId,
      businessName: row.businessName ?? row.name,
      phone: row.phone,
    };
  }

  async slugTaken(slug: string, excludeUserId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: catalogSettings.userId })
      .from(catalogSettings)
      .where(
        and(eq(catalogSettings.slug, slug), ne(catalogSettings.userId, excludeUserId)),
      );
    return !!row;
  }

  async upsert(
    userId: string,
    data: { slug: string; enabled: boolean; whatsapp: string | null },
  ): Promise<CatalogSettings> {
    const values = { userId, ...data, updatedAt: new Date() };
    const [row] = await this.db
      .insert(catalogSettings)
      .values(values)
      .onConflictDoUpdate({
        target: catalogSettings.userId,
        set: {
          slug: values.slug,
          enabled: values.enabled,
          whatsapp: values.whatsapp,
          updatedAt: values.updatedAt,
        },
      })
      .returning();
    return this.toSettings(row!);
  }

  async listPublicProducts(userId: string): Promise<PublicCatalogProduct[]> {
    const rows = await this.db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        photoUrl: products.photoUrl,
        salePrice: products.salePrice,
        saleUnit: products.saleUnit,
      })
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.isActive, true)))
      .orderBy(asc(products.name));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      photoUrl: row.photoUrl,
      salePrice: Number(row.salePrice),
      saleUnit: row.saleUnit,
    }));
  }

  async getOwnerDefaults(userId: string): Promise<CatalogOwner | null> {
    const [row] = await this.db
      .select({ name: users.name, businessName: users.businessName, phone: users.phone })
      .from(users)
      .where(eq(users.id, userId));
    if (!row) return null;
    return {
      userId,
      businessName: row.businessName ?? row.name,
      phone: row.phone,
    };
  }

  private toSettings(row: typeof catalogSettings.$inferSelect): CatalogSettings {
    return {
      slug: row.slug,
      enabled: row.enabled,
      whatsapp: row.whatsapp,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
