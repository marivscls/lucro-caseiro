import type { Label, LabelData } from "@lucro-caseiro/contracts";
import { labels } from "@lucro-caseiro/database/schema";
import { and, count, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateLabelData, FindAllOpts, ILabelsRepo } from "./labels.types";

export class LabelsRepoPg implements ILabelsRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateLabelData): Promise<Label> {
    const [row] = await this.db
      .insert(labels)
      .values({
        userId,
        productId: data.productId ?? null,
        templateId: data.templateId,
        name: data.name,
        data: data.data,
        logoUrl: data.logoUrl ?? null,
        qrCodeUrl: data.qrCodeUrl ?? null,
      })
      .returning();

    return this.toLabel(row!);
  }

  async findById(userId: string, id: string): Promise<Label | null> {
    const [row] = await this.db
      .select()
      .from(labels)
      .where(and(eq(labels.userId, userId), eq(labels.id, id)));

    return row ? this.toLabel(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Label[]; total: number }> {
    const conditions = [eq(labels.userId, userId)];

    if (opts.productId) {
      conditions.push(eq(labels.productId, opts.productId));
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(labels)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${labels.createdAt} DESC`),
      this.db.select({ value: count() }).from(labels).where(where),
    ]);

    return {
      items: rows.map((r) => this.toLabel(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateLabelData>,
  ): Promise<Label | null> {
    const updateData: Record<string, unknown> = {};

    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.data !== undefined) updateData.data = data.data;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.qrCodeUrl !== undefined) updateData.qrCodeUrl = data.qrCodeUrl;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(labels)
      .set(updateData)
      .where(and(eq(labels.userId, userId), eq(labels.id, id)))
      .returning();

    return row ? this.toLabel(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(labels)
      .where(and(eq(labels.userId, userId), eq(labels.id, id)))
      .returning({ id: labels.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(labels)
      .where(eq(labels.userId, userId));

    return result?.value ?? 0;
  }

  private toLabel(row: typeof labels.$inferSelect): Label {
    return {
      id: row.id,
      userId: row.userId,
      productId: row.productId ?? null,
      templateId: row.templateId,
      name: row.name,
      data: row.data as LabelData,
      logoUrl: row.logoUrl ?? null,
      qrCodeUrl: row.qrCodeUrl ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
