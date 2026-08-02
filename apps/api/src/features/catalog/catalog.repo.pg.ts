import type {
  CatalogSettings,
  PublicCatalogProduct,
  PublicCatalogService,
  PublicServiceBookingRequestInput,
  ServiceBookingRequest,
} from "@lucro-caseiro/contracts";
import { normalizePlan } from "@lucro-caseiro/contracts";
import {
  catalogSettings,
  products,
  publicServiceBookingRequests,
  serviceAddOns,
  servicePackages,
  services,
  serviceVariations,
  users,
} from "@lucro-caseiro/database/schema";
import { and, asc, eq, ne } from "drizzle-orm";

import type { AppDatabase } from "../../shared/db";
import type { CatalogOwner, CatalogSettingsData, ICatalogRepo } from "./catalog.types";

const ACCENT_KEYS = ["brown", "rose", "green", "lavender", "blue", "amber"];

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
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
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
      plan: normalizePlan(row.plan),
      planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
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

  async upsert(userId: string, data: CatalogSettingsData): Promise<CatalogSettings> {
    const values = { userId, ...data, updatedAt: new Date() };
    const [row] = await this.db
      .insert(catalogSettings)
      .values(values)
      .onConflictDoUpdate({
        target: catalogSettings.userId,
        set: {
          slug: values.slug,
          brandId: values.brandId,
          enabled: values.enabled,
          whatsapp: values.whatsapp,
          coverUrl: values.coverUrl,
          logoUrl: values.logoUrl,
          accentColor: values.accentColor,
          pattern: values.pattern,
          tagline: values.tagline,
          promoBanner: values.promoBanner,
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
        category: products.category,
        description: products.description,
        photoUrl: products.photoUrl,
        extraPhotos: products.extraPhotos,
        salePrice: products.salePrice,
        saleUnit: products.saleUnit,
        variations: products.variations,
      })
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          eq(products.isActive, true),
          eq(products.publicEnabled, true),
        ),
      )
      .orderBy(asc(products.name));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      photoUrl: row.photoUrl,
      extraPhotos: row.extraPhotos ?? [],
      salePrice: Number(row.salePrice),
      saleUnit: row.saleUnit,
      variations: (row.variations ?? []).map((variation) => ({
        id: variation.id,
        name: variation.name,
        ...(variation.color ? { color: variation.color } : {}),
        ...(variation.size ? { size: variation.size } : {}),
        inStock: variation.stockQuantity === undefined || variation.stockQuantity > 0,
      })),
    }));
  }

  async listPublicServices(userId: string): Promise<PublicCatalogService[]> {
    const rows = await this.db
      .select()
      .from(services)
      .where(
        and(
          eq(services.userId, userId),
          eq(services.active, true),
          eq(services.publicEnabled, true),
        ),
      )
      .orderBy(asc(services.name));

    return Promise.all(
      rows.map(async (service) => {
        const [variations, addOns, packages] = await Promise.all([
          this.db
            .select()
            .from(serviceVariations)
            .where(
              and(
                eq(serviceVariations.userId, userId),
                eq(serviceVariations.serviceId, service.id),
                eq(serviceVariations.active, true),
              ),
            )
            .orderBy(asc(serviceVariations.name)),
          this.db
            .select()
            .from(serviceAddOns)
            .where(
              and(
                eq(serviceAddOns.userId, userId),
                eq(serviceAddOns.serviceId, service.id),
                eq(serviceAddOns.active, true),
              ),
            )
            .orderBy(asc(serviceAddOns.name)),
          this.db
            .select()
            .from(servicePackages)
            .where(
              and(
                eq(servicePackages.userId, userId),
                eq(servicePackages.serviceId, service.id),
                eq(servicePackages.active, true),
              ),
            )
            .orderBy(asc(servicePackages.name)),
        ]);
        return {
          id: service.id,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          defaultPrice:
            service.defaultPrice == null ? null : Number(service.defaultPrice),
          locationMode: service.locationMode as PublicCatalogService["locationMode"],
          bookingInstructions: service.bookingInstructions,
          variations: variations.map((item) => ({
            id: item.id,
            name: item.name,
            durationMinutes: item.durationMinutes,
            price: Number(item.price),
          })),
          addOns: addOns.map((item) => ({
            id: item.id,
            name: item.name,
            durationMinutes: item.durationMinutes,
            price: Number(item.price),
          })),
          packages: packages.map((item) => ({
            id: item.id,
            name: item.name,
            sessions: item.sessions,
            price: Number(item.price),
            validityDays: item.validityDays,
            recurrenceDays: item.recurrenceDays,
          })),
        };
      }),
    );
  }

  async createPublicServiceBooking(
    userId: string,
    data: PublicServiceBookingRequestInput,
  ): Promise<ServiceBookingRequest | null> {
    const [service] = await this.db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(
        and(
          eq(services.userId, userId),
          eq(services.id, data.serviceId),
          eq(services.active, true),
          eq(services.publicEnabled, true),
        ),
      );
    if (!service) return null;
    const [row] = await this.db
      .insert(publicServiceBookingRequests)
      .values({
        userId,
        serviceId: service.id,
        serviceName: service.name,
        clientName: data.clientName.trim(),
        phone: data.phone.trim(),
        desiredDate: data.desiredDate,
        desiredTime: data.desiredTime ?? null,
        locationMode: data.locationMode,
        notes: data.notes?.trim() || null,
      })
      .returning();
    return {
      id: row!.id,
      serviceId: row!.serviceId,
      serviceName: row!.serviceName,
      clientName: row!.clientName,
      phone: row!.phone,
      desiredDate: row!.desiredDate,
      desiredTime: row!.desiredTime,
      locationMode: row!.locationMode as ServiceBookingRequest["locationMode"],
      notes: row!.notes,
      status: row!.status as ServiceBookingRequest["status"],
      createdAt: row!.createdAt.toISOString(),
    };
  }

  async getOwnerDefaults(userId: string): Promise<CatalogOwner | null> {
    const [row] = await this.db
      .select({
        name: users.name,
        businessName: users.businessName,
        phone: users.phone,
        plan: users.plan,
        planExpiresAt: users.planExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId));
    if (!row) return null;
    return {
      userId,
      businessName: row.businessName ?? row.name,
      phone: row.phone,
      plan: normalizePlan(row.plan),
      planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
    };
  }

  private toSettings(row: typeof catalogSettings.$inferSelect): CatalogSettings {
    return {
      brandId: row.brandId,
      slug: row.slug,
      enabled: row.enabled,
      whatsapp: row.whatsapp,
      coverUrl: row.coverUrl,
      logoUrl: row.logoUrl,
      accentColor:
        ACCENT_KEYS.includes(row.accentColor ?? "") ||
        /^#[0-9a-fA-F]{6}$/.test(row.accentColor ?? "")
          ? row.accentColor
          : null,
      pattern: ["dots", "bubbles", "grid", "stripes"].includes(row.pattern ?? "")
        ? (row.pattern as CatalogSettings["pattern"])
        : null,
      tagline: row.tagline,
      promoBanner: row.promoBanner,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
